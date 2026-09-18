# Relay — offline-first HQ-to-kiosk demo

A working proof of concept for a retail kiosk that stays useful during connectivity failures. HQ publishes versioned menus; a kiosk browses its last-known-good menu and builds a durable cart while disconnected. Checkout resumes only after recovery and authoritative validation by the backend.

Built on the Monex starter’s **npm workspaces / Turborepo, Next.js, NestJS, Prisma and PostgreSQL** architecture. Payment processing is a mock gateway: no real money or payment-card data is involved.

![Relay kiosk after synchronization and payment recovery](docs/kiosk-recovered.png)

## What the demo does

- **HQ control:** edit prices and availability, publish immutable menu snapshots, inspect history, and restore an earlier menu as a new version. Optimistic version checks reject conflicting HQ edits.
- **Offline kiosk:** browse a cached menu and edit a cart without HQ connectivity. The menu, cart, outbox and unresolved payment identity survive page reloads in browser storage.
- **Versioned synchronization:** probe the current version, download changed snapshots, validate their schema and SHA-256 checksum, then atomically activate them. A corrupted download leaves the previous version active.
- **Recovery:** move through ONLINE, DEGRADED, OFFLINE and RECOVERING; reconcile payments before refreshing configuration and draining telemetry. Retries use backoff and jitter.
- **Checkout validation:** recalculate prices at HQ, reject unavailable items, issue a two-minute quote and require explicit acceptance. A new menu invalidates an unpaid quote.
- **Payment safety:** simulate success, decline, or a successful charge with a lost response. UNKNOWN outcomes block another checkout until reconciled. Stable payment identities and database uniqueness prevent duplicate charges and paid orders.
- **Observability:** show menu lag, pending events, recovery activity and the authoritative payment ledger.

The simulator disconnects **kiosk API traffic** while leaving the HQ panel available. It does not disconnect the browser from the frontend host. See the [walkthrough and consistency rules](docs/kiosk-demo.md) for details.

## Quick start

Requirements: Node.js **22.12+**, npm, and Docker Compose with PostgreSQL 16, or an existing PostgreSQL instance.

```sh
npm ci
npm run env:distribute
```

Installation creates a root `.env` from `.env.example` if one does not exist. Review it before starting the database. The default database settings are:

```dotenv
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=monex-root-template-v2-db
DB_PORT=5433
DB_CONTAINER_NAME=monex-root-template-v2-db
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/monex-root-template-v2-db?schema=public"
API_PORT=3001
NEXT_PUBLIC_API="http://localhost:3001"
```

Use a concrete `DATABASE_URL`; dotenv does not expand `${DB_*}` placeholders. If you change the database name or port, update both the Compose settings and the connection URL. Existing `.env` files are preserved and are not committed.

```sh
# Start the isolated Compose database and wait until it is healthy.
docker compose --env-file .env -f apps/db/docker-compose.yml up -d --wait postgres

# Create the demo schema and build shared packages before the apps.
npm run db:push
npm run build

# In one terminal:
npm run dev -w api

# In another terminal:
npm run dev -w web
```

Open [the demo](http://localhost:3000). The API runs at [localhost:3001](http://localhost:3001), with a route listing in [Swagger](http://localhost:3001/api). The first API startup creates the initial six-item menu automatically; the starter’s link seed is not needed.

`npm run dev` also launches all workspace development tasks through Turborepo. The inherited database workspace task uses the legacy `docker-compose` executable; the separate commands above work with Docker Compose v2.

The Compose project is named `relay-kiosk-lab`, keeping its database volume separate from other starter projects. Database schema setup uses `db push` for this proof of concept.

### Alternative ports and an existing database

If ports are occupied, set `API_PORT` and `NEXT_PUBLIC_API` to the same alternative API port, and point `DATABASE_URL` at your PostgreSQL instance. For example, with API port 3101:

```sh
npm run build
node --env-file=.env apps/api/dist/main.js
# In another terminal:
npm run start -w web -- --port 3100 --hostname 127.0.0.1
```

This serves the production frontend at [localhost:3100](http://localhost:3100). Public frontend variables are embedded at build time, so rebuild after changing `NEXT_PUBLIC_API`. The API binds to loopback for local demonstration.

## Try the failure scenarios

1. Add a burger, then select **Disconnect kiosk**.
2. Change its price at HQ and select **Publish menu version**. The kiosk retains the old version and price. Add another item and reload: the cart and simulated outage remain.
3. Select **Restore connection**. Watch the version advance and the outbox drain. Validate checkout, review the current HQ quote and accept it.
4. Choose **Charged · response lost** before paying. Observe UNKNOWN followed by reconciliation to PAID, with one paid order.
5. Enable **Corrupt download**, publish another version and sync. The kiosk keeps its last-known-good menu. Disable corruption and sync again.
6. Mark an item unavailable at HQ to see checkout rejection, or use **Restore as new** to demonstrate rollback without decreasing version numbers.

![Kiosk using its stale menu while HQ has a newer version](docs/kiosk-offline.png)

## Architecture and package boundaries

```text
apps/
  web/                       Next.js UI: HQ panel and kiosk simulator
    components/kiosk-lab.tsx  Durable local state and recovery coordinator
    services/kiosk.service.ts Frontend transport and snapshot verification
  api/                       NestJS HTTP API
    src/kiosk/               Controller and authoritative business service
    src/prisma/              Shared Prisma client lifecycle
  db/                        PostgreSQL Docker Compose configuration
packages/
  api-client/                Typed, runtime-independent endpoint contracts
  prisma/                    Database schema, generated client and shared types
  design-system/             Shared styling foundation
  ui/                        Existing shared UI components
  icons/                     Existing SVG icon package
  eslint-config/             Shared lint configuration
  jest-config/               Shared test configuration
  typescript-config/         Shared TypeScript configuration
```

`@repo/api-client` defines requests and responses without fetching or depending on React or NestJS. The frontend owns fetch behavior; TanStack Query manages HQ server-state reads. Nest controllers route requests to services, and services use the shared Prisma client for authoritative database operations.

Prisma models persist `MenuSnapshot`, `CheckoutQuote`, `Payment`, `KioskOrder` and `KioskEvent`. The original `Link` model and endpoints remain as starter examples. Payment and publication transactions use a PostgreSQL advisory lock; payment-to-quote and order-to-payment uniqueness enforce one logical effect under retries.

For endpoint contracts, see [kiosk.ts](packages/api-client/src/kiosk.ts). For synchronization details, ownership rules and recovery order, see [the design guide](docs/kiosk-demo.md).

## Validation

```sh
# Build all workspaces and check frontend types.
npm run build
npm run check-types -w web

# Financial and menu invariants; requires the compiled API.
node --test scripts/test-kiosk-unit.cjs

# Existing starter tests.
npm run test -w api -- --runInBand

# Integration tests: point both variables at the same disposable demo instance.
TEST_API=http://localhost:3001 node --env-file=.env scripts/test-kiosk-integration.mjs
```

Integration tests append quotes, payments and events, then restore the original menu as a new version. They verify authoritative pricing, publication conflicts, expiry, sold-out validation, eight concurrent payment retries, UNKNOWN reconciliation, exactly one paid order and duplicate event delivery. Do not run them against a production database.

Optional browser tests require Playwright and its Chromium browser to be installed separately. Point `PLAYWRIGHT_MODULE` at that installation:

```sh
TEST_WEB=http://localhost:3000 PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/test-kiosk-browser.cjs
```

Browser checks exercise the full outage/reload/recovery flow, corruption rejection, payment reconciliation and mobile overflow. They refresh the screenshots in `docs/`. The scripts default to the alternative demo ports 3100/3101 when the test URL variables are omitted.

Commits use `type(scope): description`. The existing Husky hooks run staged lint/format checks, workspace type checks and Commitlint.

## Scope and production gaps

This is a **single-kiosk, localhost proof of concept**. Keep one kiosk tab per browser profile. Browser localStorage supplies demo durability; there is no separate store gateway, multi-tab coordination or service worker for cold-starting without the frontend host.

The provider ledger is mocked in PostgreSQL. Authentication, per-store device authorization, inventory reservations, promotions, real payment integration and fleet reconciliation workers are not implemented. Production would need those controls, reviewed database migrations, and a durable store-level gateway or IndexedDB/SQLite storage. Checksums detect corruption, not hostile tampering.
