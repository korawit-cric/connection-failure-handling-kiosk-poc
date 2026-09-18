// Optional: npm install --no-save playwright, or point PLAYWRIGHT_MODULE at an existing installation.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const local = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('relay-kiosk-v1')));
  await page.goto(process.env.TEST_WEB || 'http://localhost:3100');
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem('relay-kiosk-v1') || '{}').menu?.version,
  );
  const first = await local();
  await page.getByRole('button', { name: /Disconnect kiosk/ }).click();
  await page
    .getByRole('button', { name: /Kitchen Classic smash burger/ })
    .click();
  const price = page.getByRole('spinbutton', {
    name: 'Classic smash burger price',
  });
  const originalPrice = Number(await price.inputValue());
  await price.fill(String(originalPrice + 20));
  await page.getByRole('button', { name: /Publish menu version/ }).click();
  await page.getByText(/HQ published v/).waitFor();
  assert.equal((await local()).menu.version, first.menu.version);
  await page.reload();
  await page.getByRole('button', { name: /Restore connection/ }).waitFor();
  assert.equal((await local()).cart[0].quantity, 1);
  assert.equal((await local()).menu.version, first.menu.version);
  assert.equal(
    await page.getByRole('button', { name: /Validate checkout/ }).isDisabled(),
    true,
  );
  await page.screenshot({
    path: path.resolve('docs/kiosk-offline.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: /Restore connection/ }).click();
  await page.waitForFunction(
    (v) => JSON.parse(localStorage.getItem('relay-kiosk-v1')).menu.version > v,
    first.menu.version,
  );
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem('relay-kiosk-v1')).outbox.length === 0,
  );
  await page.getByRole('button', { name: /Validate checkout/ }).click();
  await page.getByText(/HQ quote/).waitFor();
  await page.getByRole('combobox').selectOption('timeout');
  await page.getByRole('button', { name: /Accept .* pay/ }).click();
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem('relay-kiosk-v1')).logs.some((l) =>
      l.includes('Gateway returned UNKNOWN'),
    ),
  );
  await page
    .getByText('✓ Payment confirmed. Order complete.')
    .waitFor({ timeout: 15000 });
  assert.equal((await local()).cart.length, 0);
  assert.equal((await local()).payment.status, 'PAID');
  const beforeCorrupt = (await local()).menu.version;
  await page.getByLabel('Corrupt download').check();
  await price.fill(String(originalPrice));
  await page.getByRole('button', { name: /Publish menu version/ }).click();
  await page.getByText(/HQ published v/).waitFor();
  await page.getByRole('button', { name: /Sync now/ }).click();
  await page.getByText(/Checksum mismatch/).waitFor();
  assert.equal((await local()).menu.version, beforeCorrupt);
  await page.getByLabel('Corrupt download').uncheck();
  await page.getByRole('button', { name: /Sync now/ }).click();
  await page.waitForFunction(
    (v) => JSON.parse(localStorage.getItem('relay-kiosk-v1')).menu.version > v,
    beforeCorrupt,
  );
  await page.screenshot({
    path: path.resolve('docs/kiosk-recovered.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS: offline cart, HQ publication while disconnected, reload durability, checkout blocking, reconnection, outbox drain, UNKNOWN payment recovery, corrupt snapshot rejection and mobile layout.',
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
