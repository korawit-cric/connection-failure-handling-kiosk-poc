import process from 'node:process';
import console from 'node:console';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
const require = createRequire(import.meta.url);
const db = require('@repo/prisma').default;
const base = process.env.TEST_API || 'http://localhost:3101';
async function api(path, body, status = 200) {
  const r = await globalThis.fetch(`${base}/kiosk/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const value = await r.json();
  assert.equal(r.status, status, JSON.stringify(value));
  return value;
}
const original = await api('menu');
try {
  const changed = original.items.map((i) => ({
    ...i,
    price: i.price + 100,
    available: true,
  }));
  const published = await api(
    'menu',
    { baseVersion: original.version, items: changed },
    201,
  );
  await api('menu', { baseVersion: original.version, items: changed }, 409);
  await api('menu', { baseVersion: published.version, items: [null] }, 400);
  const canonical = published.items.map(
    ({ id, name, category, description, price, available, icon }) => ({
      id,
      name,
      category,
      description,
      price,
      available,
      icon,
    }),
  );
  assert.equal(
    published.checksum,
    createHash('sha256').update(JSON.stringify(canonical)).digest('hex'),
  );
  const quote = await api(
    'quote',
    {
      localVersion: original.version,
      items: [{ id: changed[0].id, quantity: 2 }],
    },
    201,
  );
  assert.equal(quote.total, changed[0].price * 2);
  const attempts = await Promise.all(
    Array.from({ length: 8 }, () =>
      api('pay', { quoteId: quote.id, mode: 'timeout' }, 201),
    ),
  );
  assert.equal(new Set(attempts.map((p) => p.id)).size, 1);
  assert.equal(attempts[0].status, 'UNKNOWN');
  assert.equal(await db.payment.count({ where: { quoteId: quote.id } }), 1);
  assert.equal(
    await db.kioskOrder.count({ where: { paymentId: attempts[0].id } }),
    0,
  );
  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      api(`pay/${attempts[0].id}/reconcile`, {}, 201),
    ),
  );
  assert.ok(results.every((p) => p.status === 'PAID'));
  assert.equal(
    await db.kioskOrder.count({ where: { paymentId: attempts[0].id } }),
    1,
  );
  const event = {
    id: randomUUID(),
    type: 'CART_UPDATED',
    items: [],
    createdAt: new Date().toISOString(),
  };
  await Promise.all([api('events', [event], 201), api('events', [event], 201)]);
  assert.equal(await db.kioskEvent.count({ where: { id: event.id } }), 1);
  const expired = await api(
    'quote',
    {
      localVersion: published.version,
      items: [{ id: changed[0].id, quantity: 1 }],
    },
    201,
  );
  await db.checkoutQuote.update({
    where: { id: expired.id },
    data: { expiresAt: new Date(0) },
  });
  await api('pay', { quoteId: expired.id, mode: 'success' }, 409);
  const beforeUpdate = await api(
    'quote',
    {
      localVersion: published.version,
      items: [{ id: changed[0].id, quantity: 1 }],
    },
    201,
  );
  await api(
    'menu',
    {
      baseVersion: published.version,
      items: changed.map((i, n) => ({ ...i, available: n !== 0 })),
    },
    201,
  );
  await api('pay', { quoteId: beforeUpdate.id, mode: 'success' }, 409);
  await api(
    'quote',
    {
      localVersion: original.version,
      items: [{ id: changed[0].id, quantity: 1 }],
    },
    409,
  );
  console.info(
    'PASS: PostgreSQL-backed checksum, publication conflicts, authoritative pricing, 8 concurrent payment retries, UNKNOWN recovery, exactly one paid order, duplicate outbox delivery, expiration and sold-out validation.',
  );
} finally {
  const latest = await api('menu');
  await api(
    'menu',
    { baseVersion: latest.version, items: original.items },
    201,
  );
  await db.$disconnect();
}
