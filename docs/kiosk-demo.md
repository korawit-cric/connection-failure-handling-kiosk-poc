# Relay: HQ-to-kiosk demo

This demo implements the offline-first kiosk system design used as the project reference. The existing Turborepo workspaces, Next frontend, Nest services, shared API contracts, Prisma client and PostgreSQL remain the foundation.

## Run

Follow the [repository quick start](../README.md#quick-start) for dependencies, PostgreSQL, environment configuration and workspace builds. Default ports are frontend 3000, API 3001 and PostgreSQL 5433. The [alternative-port instructions](../README.md#alternative-ports-and-an-existing-database) support an existing PostgreSQL instance and frontend/API ports 3100/3101.

The first API startup creates an initial menu against an empty schema. No manual menu seed is required. Keep local environment files and database data outside version control.

## Walk through the behavior

1. Open the demo and wait for **online** and an active menu version.
2. Add a burger. Disconnect the kiosk using the simulator. Add more items. Cart changes and their outbox events persist locally.
3. Change the burger price or mark an item unavailable in HQ. Publish. HQ advances while the kiosk keeps its old snapshot. Refresh the page: the cart, menu and simulated WAN outage survive.
4. Restore connectivity. Recovery rechecks pending payments, verifies the menu checksum, atomically activates the new snapshot, and drains the outbox. The cart remains; changed prices require a new accepted quote. Unavailable items cannot pass checkout.
5. Validate checkout, review the authoritative total and accept it. The backend calculates integer minor units (satang); the client cannot set the charge amount. Quotes expire after two minutes and become invalid when HQ publishes again.
6. Choose **Charged · response lost**. The payment becomes UNKNOWN and checkout locks. Automatic recovery or **Reconcile payment** resolves the same payment identity. Exactly one paid order is created.
7. Enable **Corrupt download**, publish another version, then sync. Checksum verification fails and the last-known-good menu remains active. Disable corruption and sync again to recover.
8. Use **Restore as new** in history. Old snapshots stay immutable; rollback publishes their content under a new, monotonically increasing version. Concurrent HQ edits with an outdated base version receive HTTP 409.

## Package and service boundaries

- `packages/api-client/src/kiosk.ts`: runtime-independent endpoint definitions and request/response contracts. No React, fetch or Nest dependencies.
- `apps/web/services/kiosk.service.ts`: frontend-owned transport, request timeout and schema/checksum validation.
- `apps/web/components/kiosk-lab.tsx`: kiosk connectivity state, durable local envelope, recovery loop and demo UI. TanStack Query owns HQ server-state reads.
- `apps/api/src/kiosk/kiosk.controller.ts`: Nest HTTP boundary.
- `apps/api/src/kiosk/kiosk.service.ts`: HQ publication, authoritative quoting, durable mock gateway ledger, reconciliation and outbox ingestion.
- `packages/prisma/prisma/schema.prisma`: immutable menu snapshots, expiring quotes, payments, paid orders and deduplicated kiosk events.

## Consistency and recovery

HQ owns names, prices and demo availability. Kiosk carts carry item identities and quantities. Payments use `pay_<quoteId>`, backed by a unique quote constraint and durable provider status. PostgreSQL transactions use an advisory lock to serialize HQ publication, checkout validation and payment mutations. Reconciliation upserts an order using its unique payment identity. Only confirmed CAPTURED outcomes can produce paid orders. A new quote after a definite decline is a new intentional payment attempt.

The kiosk writes its menu, cart, outbox and pending payment identity to one localStorage envelope before displaying changes or initiating payment. Replacing that envelope activates a complete snapshot atomically. This is a small single-kiosk demo; localStorage is not a store gateway database. Storage failures fail closed. Keep one kiosk tab per browser profile. Do not clear browser storage while a payment is unresolved.

The state machine is ONLINE → DEGRADED → OFFLINE, with RECOVERING on restoration. Actual API responses establish health; `navigator.onLine` is not used. Three consecutive failed probes mark OFFLINE. Recovery retries exponentially with jitter, capped near 30 seconds. A version-only probe avoids downloading unchanged menus. Financial recovery precedes configuration refresh and telemetry delivery. Event batches carry stable IDs; PostgreSQL `createMany(skipDuplicates)` gives at-least-once delivery with one stored logical event.

The simulator cuts **kiosk-to-HQ API traffic**, leaving the HQ control panel and frontend host reachable. In-flight requests can have reached HQ even if their responses are discarded. Saved quote IDs therefore survive ambiguous responses. An already-loaded kiosk also survives real API outages, but this demo does not install a service worker to cold-start the app when the frontend host itself is offline.

## Tests

```sh
npm run build -w @repo/prisma
npm run build -w @repo/api-client
npm run build -w api
node --test scripts/test-kiosk-unit.cjs
# Requires this demo API and database. Appends test records, restores menu as a new version.
node --env-file=.env scripts/test-kiosk-integration.mjs
npm run check-types -w web
npm run build -w web
# Optional browser checks; requires an existing Playwright installation:
# PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/test-kiosk-browser.cjs
```

Set `TEST_API` if the integration API uses a port other than 3101. Its `DATABASE_URL` must target that same disposable demo database. Tests cover stale pricing, malformed input, sold-out products, expiry, publish conflicts, concurrent payment retries, UNKNOWN reconciliation, unique orders and duplicate events.

## Deliberate demo limits

The mock provider's ledger lives in PostgreSQL and simulates a lost response; it is not an external financial processor. There are no real charges, payment-card fields, stock reservations, promotions, refunds, device provisioning, authentication, store authorization or fleet-wide workers. HQ is a localhost-only demonstration control plane. Production needs a separately authenticated HQ API, per-device/store authorization, a trusted local gateway/IndexedDB or SQLite, cross-device inventory ownership and an independently reconciled provider adapter. Checksums detect corruption, not hostile tampering. The demo-wide advisory lock favors clear correctness over fleet-scale throughput. Database setup uses `db push`; introduce reviewed migrations before deployment.
