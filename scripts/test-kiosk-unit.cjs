const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { KioskService } = require('../apps/api/dist/kiosk/kiosk.service');
let service, tx, charges, orders;
const item = {
  id: 'burger',
  name: 'Burger',
  category: 'Kitchen',
  description: '',
  price: 12000,
  available: true,
  icon: '🍔',
};
beforeEach(() => {
  charges = [];
  orders = [];
  tx = {
    $executeRaw: async () => 0,
    menuSnapshot: {
      findFirstOrThrow: async () => ({ version: 2, items: [item] }),
    },
    checkoutQuote: {
      create: async ({ data }) => data,
      findUnique: async () => ({
        id: 'q1',
        menuVersion: 2,
        total: 24000,
        items: [],
        expiresAt: new Date(Date.now() + 120000),
      }),
      findUniqueOrThrow: async () => ({ items: [], total: 24000 }),
    },
    payment: {
      findUnique: async () => charges[0] || null,
      create: async ({ data }) => {
        charges.push(data);
        return data;
      },
      update: async ({ data }) => ({ ...charges[0], ...data }),
    },
    kioskOrder: {
      create: async ({ data }) => orders.push(data),
      upsert: async ({ create }) => {
        if (!orders.length) orders.push(create);
      },
    },
  };
  service = new KioskService({ client: { $transaction: (fn) => fn(tx) } });
});
test('stale cart is recalculated with HQ prices', async () => {
  const quote = await service.quote({
    localVersion: 1,
    items: [{ id: 'burger', quantity: 2 }],
  });
  assert.equal(quote.total, 24000);
  assert.equal(quote.menuVersion, 2);
});
test('invalid quantities and duplicate lines are rejected', () => {
  assert.throws(() =>
    service.quote({ localVersion: 1, items: [{ id: 'burger', quantity: -1 }] }),
  );
  assert.throws(() =>
    service.quote({
      localVersion: 1,
      items: [
        { id: 'burger', quantity: 1 },
        { id: 'burger', quantity: 1 },
      ],
    }),
  );
});
test('unavailable products cannot be quoted', async () => {
  tx.menuSnapshot.findFirstOrThrow = async () => ({
    version: 2,
    items: [{ ...item, available: false }],
  });
  await assert.rejects(
    () =>
      service.quote({
        localVersion: 1,
        items: [{ id: 'burger', quantity: 1 }],
      }),
    /unavailable/,
  );
});
test('concurrent HQ edit conflict rejects stale base version', async () => {
  await assert.rejects(
    () => service.publish({ baseVersion: 1, items: [item] }),
    /HQ changed/,
  );
  assert.throws(
    () => service.publish({ baseVersion: 2, items: [null] }),
    /Invalid menu/,
  );
});
test('expired quote cannot be charged', async () => {
  tx.checkoutQuote.findUnique = async () => ({
    menuVersion: 2,
    expiresAt: new Date(0),
  });
  await assert.rejects(
    () => service.pay({ quoteId: 'q1', mode: 'success' }),
    /expired/,
  );
  assert.equal(charges.length, 0);
});
test('new menu invalidates an unpaid quote', async () => {
  tx.menuSnapshot.findFirstOrThrow = async () => ({ version: 3 });
  await assert.rejects(
    () => service.pay({ quoteId: 'q1', mode: 'success' }),
    /menu changed/,
  );
});
test('payment retry returns original outcome without another charge', async () => {
  const first = await service.pay({ quoteId: 'q1', mode: 'success' });
  const second = await service.pay({ quoteId: 'q1', mode: 'timeout' });
  assert.equal(first.id, second.id);
  assert.equal(charges.length, 1);
  assert.equal(orders.length, 1);
});
test('lost response is UNKNOWN and creates no paid order until reconciliation', async () => {
  const payment = await service.pay({ quoteId: 'q1', mode: 'timeout' });
  assert.equal(payment.status, 'UNKNOWN');
  assert.equal(payment.providerStatus, 'CAPTURED');
  assert.equal(orders.length, 0);
  const result = await service.reconcile(payment.id);
  assert.equal(result.status, 'PAID');
  await service.reconcile(payment.id);
  assert.equal(orders.length, 1);
});
test('decline never creates a paid order', async () => {
  const payment = await service.pay({ quoteId: 'q1', mode: 'decline' });
  assert.equal(payment.status, 'FAILED');
  assert.equal(orders.length, 0);
});
