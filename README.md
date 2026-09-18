#     cric-monex-root-template-v2

A full-stack monorepo featuring NestJS APIs, Next.js frontends, and Prisma ORM with PostgreSQL.

## What's inside?

This Turborepo includes the following packages & apps:

### Apps and Packages

```shell
.
├── apps
│   ├── web                # Next.js 16 Frontend         → http://localhost:3000
│   ├── api                # NestJS 11 API              → http://localhost:3001
│   └── db                        # PostgreSQL 16 (Docker Compose)    → localhost:5433
└── packages
    ├── @repo/api-client          # Frontend API definitions & types (no fetch)
    ├── @repo/design-system       # Tailwind 4 config, colors, global styles
    ├── @repo/eslint-config       # ESLint configurations (includes Prettier)
    ├── @repo/icons               # SVG icon components (SVGR-generated)
    ├── @repo/jest-config         # Jest configurations
    ├── @repo/prisma              # Prisma 7 client, schema, and types
    ├── @repo/typescript-config   # TypeScript configurations
    └── @repo/ui                  # React 19 component library with Tailwind
```

Each package and application are written in [TypeScript](https://www.typescriptlang.org/).

### Tech Stack & Versions

**Runtime & Apps**

| Component                                                 | Version         | Port       |
| --------------------------------------------------------- | --------------- | ---------- |
| **Node.js**                                               | >=22.12         | -          |
| [**Next.js Web**](https://nextjs.org/) (`apps/web`)       | ^16.0.7         | 3000       |
| [**NestJS API**](https://nestjs.com/) (`apps/api`)        | ^11.0.0         | 3001       |
| [**PostgreSQL**](https://www.postgresql.org/) (`apps/db`) | 16-alpine       | 5433       |
| **Swagger** (`/api`)                                      | @nestjs/swagger | 3001, 3003 |

**Core Libraries**

| Library                                           | Version |
| ------------------------------------------------- | ------- |
| [**React**](https://react.dev/)                   | ^19.1.0 |
| [**Prisma ORM**](https://www.prisma.io/)          | ^7.1.0  |
| [**Tailwind CSS**](https://tailwindcss.com/)      | ^4.1.11 |
| [**TanStack Query**](https://tanstack.com/query)  | ^5.80.7 |
| [**TypeScript**](https://www.typescriptlang.org/) | 5.5.4+  |
| [**SVGR**](https://react-svgr.com/)               | ^8.1.0  |

**Tooling**

| Tool                                                   | Purpose            |
| ------------------------------------------------------ | ------------------ |
| [**Turborepo**](https://turbo.build/repo)              | Monorepo build     |
| [**ESLint**](https://eslint.org/)                      | Code linting       |
| [**Prettier**](https://prettier.io)                    | Code formatting    |
| [**Jest**](https://jestjs.io/)                         | Testing            |
| [**Docker Compose**](https://docs.docker.com/compose/) | Database container |
| [**Husky**](https://typicode.github.io/husky/)         | Git hooks          |
| [**Commitlint**](https://commitlint.js.org/)           | Commit messages    |

## Getting Started

### Prerequisites

- Node.js >= 22.12 (required for Prisma 7)
- Docker and Docker Compose (for PostgreSQL database)
- npm (recommended)

### Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

   This will automatically:
   - Create `.env` from `.env.example` if it doesn't exist
   - Set up the environment configuration

2. **Start PostgreSQL database**:

   ```bash
   npm run db:start
   ```

3. **Configure database connection** (if needed):

   The `.env` file is automatically created from `.env.example` during `npm install`. If you need to update it, edit the root `.env` file:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/monex-root-template-v2-db?schema=public"
   ```

   **Note**: When you run `npm run dev`, the root `.env` file is automatically distributed to all apps and packages (except config packages) via symlinks. This ensures all parts of the monorepo use the same environment variables.

4. **Generate Prisma client and push schema**:

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start development servers**:

   ```bash
   npm run dev
   ```

   This will:
   - Automatically distribute the root `.env` file to all apps and packages
   - Start all development servers:
     - Web on <http://localhost:3000>
     - API on <http://localhost:3001>

### Commands

This `Turborepo` includes useful commands for all apps and packages.

#### Database Commands

```bash
# Start PostgreSQL database
npm run db:start
# or
npm run db:up

# Stop PostgreSQL database
npm run db:stop
# or
npm run db:down

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

#### Build

```bash
# Will build all the app & packages with the supported `build` script.
npm run build

# ℹ️ If you plan to only build apps individually,
# Please make sure you've built the packages first.
```

#### Develop

```bash
# Will run the development server for all the app & packages with the supported `dev` script.
# This automatically distributes the root .env file to all apps and packages before starting.
npm run dev
```

**Note**: The `predev` script automatically creates symlinks from the root `.env` to each app and package (excluding config packages like `eslint-config`, `jest-config`, `typescript-config`).

#### test

```bash
# Will launch a test suites for all the app & packages with the supported `test` script.
pnpm run test

# You can launch e2e testes with `test:e2e`
pnpm run test:e2e

# See `@repo/jest-config` to customize the behavior.
```

#### Lint

```bash
# Will lint all the app & packages with the supported `lint` script.
# See `@repo/eslint-config` to customize the behavior.
pnpm run lint
```

#### Format

```bash
# Will format all the supported `.ts,.js,json,.tsx,.jsx` files.
# See `@repo/eslint-config/prettier-base.js` to customize the behavior.
npm run format
```

### Git Hooks & CI

#### Pre-commit

Automatically runs on every commit via Husky:

- **ESLint** + **Prettier** on staged `.ts/.tsx` files
- **Prettier** on staged `.json/.md/.css` files

#### Commit Messages

Uses [Conventional Commits](https://www.conventionalcommits.org/) format with required scope:

```bash
# Format: type(scope): message
feat(web): add user authentication
fix(api): resolve database connection issue
docs(readme): update installation steps
refactor(prisma): optimize query performance
```

**Allowed types:** `build`, `chore`, `docs`, `feat`, `fix`, `refactor`, `test`, `release`

#### GitHub Actions

Runs on all pushes and pull requests:

- ESLint across all packages
- Prettier format check
- TypeScript type checking

## Project Structure

### API Endpoints

The NestJS APIs provide the following endpoints with **Swagger documentation**:

- API: `http://localhost:3001/api`
- API: `http://localhost:3003/api`

- `GET /links` - Get all links
- `GET /links/:id` - Get a specific link
- `POST /links` - Create a new link
- `PATCH /links/:id` - Update a link
- `DELETE /links/:id` - Delete a link

#### DTOs & Swagger

DTOs implement Prisma types to ensure type alignment:

```typescript
// apps/registry-api/src/links/dto/create-link.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import type { Prisma } from '@repo/prisma';

export class CreateLinkDto implements Prisma.LinkCreateInput {
  @ApiProperty({ example: 'https://google.com' })
  url: string;

  @ApiProperty({ example: 'Google' })
  title: string;

  @ApiProperty({ example: 'Search engine', required: false })
  description?: string;
}
```

**Why this pattern?**

- ✅ `implements Prisma.LinkCreateInput` - TypeScript enforces DTO ↔ Prisma alignment
- ✅ `@ApiProperty()` - Swagger gets proper documentation with examples
- ✅ Single source of truth - Prisma schema defines the data model
- ✅ Compile-time errors if DTO drifts from schema

### Frontend

The Next.js apps display database results fetched from their respective NestJS APIs. The frontends:

- Fetches links from the API on server-side
- Displays them in a styled card layout
- Shows link metadata (ID, URL, creation date)
- Uses Prisma-generated TypeScript types for type safety

### Shared Packages

- **@repo/api-client**: Frontend API definitions (no fetch, no React, no Next.js)
  - Endpoint definitions with typed request/response
  - Shared DTOs (`CreateLinkDto`, `UpdateLinkDto`)
  - Runtime-agnostic - works on server and client components
  - **Shared across all frontend apps only**

- **@repo/prisma**: Shared Prisma client and schema
  - Exports singleton Prisma client instance
  - Exports all Prisma types (`Prisma`, `Link`, etc.)
  - **Ready to publish as an npm package** (see [Architecture Philosophy](#architecture-philosophy))

- **@repo/design-system**: Shared styling foundation
  - Tailwind CSS configuration and color palette
  - Global CSS variables and styles
  - Used by all frontend apps

- **@repo/icons**: SVG icon components library
  - SVG files converted to React components using SVGR
  - TypeScript support with full type safety
  - Optimized SVGs with `currentColor` for styling flexibility
  - See [@repo/icons README](./packages/icons/README.md) for usage

- **@repo/ui**: Shared React component library
  - Reusable components (Button, Card, etc.)
  - Built with Tailwind CSS from `@repo/design-system`

### Icon System with SVGR

The `@repo/icons` package uses [SVGR](https://react-svgr.com/) to automatically convert SVG files into React components. This provides a type-safe, tree-shakeable icon system.

**How it works:**

1. **SVG Source Files**: Place SVG files in `packages/icons/src/icons/` (e.g., `arrow-right.svg`)

2. **Build Process**: SVGR transforms SVGs into React components:

   ```bash
   npm run build:icons  # Converts SVG → React components in dist/
   ```

3. **Auto-Generated Index**: The build process creates TypeScript exports:

   ```typescript
   // packages/icons/src/index.ts (auto-generated)
   export { default as ArrowRight } from '../dist/ArrowRight';
   ```

4. **Usage in Apps**: Import icons as React components:

   ```tsx
   import { ArrowRight, AddUser } from '@repo/icons';

   <ArrowRight className="text-primary-600 h-5 w-5" />;
   ```

**SVGR Configuration** (`.svgrrc.js`):

- **TypeScript**: Generates `.tsx` files with full type safety
- **SVGO Optimization**: Automatically optimizes SVG files
- **Color Replacement**: `#000` and `#000000` → `currentColor` for styling flexibility
- **Icon Mode**: Optimized for icon usage (removes dimensions, preserves viewBox)

**Development Workflow**:

- `npm run build` - Build all icons and regenerate index
- `npm run dev` - Watch mode (auto-rebuilds on SVG changes)
- Icons are automatically converted from kebab-case filenames to PascalCase component names

### Data Fetching Architecture

This project separates **API definitions** from **fetch logic** for maximum flexibility:

```
@repo/api-client (shared)    apps/*-web (per-app)
┌─────────────────────┐      ┌─────────────────────────────────┐
│ linksApi.list()     │      │ lib/fetch/server.ts (SSR)       │
│ linksApi.detail(id) │ ──▶  │ lib/fetch/client.ts (CSR)       │
│ linksApi.create()   │      │ queries/links.ts (TanStack)     │
└─────────────────────┘      └─────────────────────────────────┘
```

**How it works:**

1. **`@repo/api-client`** defines endpoints as pure data (no fetch):

```typescript
// packages/api-client/src/links.ts
export const linksApi = {
  list: () => ({ url: '/links', method: 'GET' }),
  detail: (id: number) => ({ url: `/links/${id}`, method: 'GET' }),
  create: (data) => ({ url: '/links', method: 'POST', body: data }),
};
```

2. **Each app** has its own fetch utilities that consume these definitions:

```typescript
// apps/registry-web/lib/fetch/server.ts - Server-side fetch
export async function serverFetch<T>(endpoint: ApiEndpoint<T>): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
    method: endpoint.method,
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    cache: 'no-store', // Server controls caching
  });
  return response.json();
}

// apps/registry-web/lib/fetch/client.ts - Client-side fetch (for TanStack Query)
export async function clientFetch<T>(endpoint: ApiEndpoint<T>): Promise<T> {
  // Same logic, but TanStack Query handles caching
}
```

3. **Usage** differs by component type:

**Server Components** use `serverFetch()` directly:

```typescript
// apps/registry-web/app/page.tsx (Server Component)
import { linksApi } from '@repo/api-client';
import { serverFetch } from '@/lib/fetch/server';

export default async function Page() {
  const links = await serverFetch(linksApi.list());
  return <LinksList links={links} />;
}
```

**Client Components** use TanStack Query hooks:

```typescript
// apps/registry-web/components/links-client.tsx
'use client';
import { useLinksQuery } from '@/queries/links';

export function LinksClient() {
  const { data: links, isLoading } = useLinksQuery();
  if (isLoading) return <Loading />;
  return <LinksList links={links} />;
}
```

**Why this pattern?**

- ✅ **Share definitions, not fetch** - `@repo/api-client` has no fetch, no React, no Next.js
- ✅ **Per-app control** - Each app manages caching, headers, error handling
- ✅ **Server vs client separation** - Different strategies for SSR and CSR
- ✅ **Type safety** - Full TypeScript inference from endpoint to response
- ✅ **Easy to test** - Mock endpoints without mocking fetch

### Extending Apps

> **💡 Simple Extension Pattern**: To add a new Next.js app, simply duplicate an existing app directory and change its name!

This monorepo is designed to make adding new apps straightforward:

1. **Duplicate an existing app**:

   ```bash
   cp -r apps/registry-web apps/my-new-app
   ```

2. **Update the app name** in the following files:
   - `apps/my-new-app/package.json` - Change the name to `"my-new-app"`
   - `apps/my-new-app/package.json` - Update the `"dev"` script port (e.g., `--port 3004`)
   - `apps/my-new-app/next.config.js` (if it exists) - Update any app-specific configurations

3. **That's it!** The new app will:
   - ✅ Automatically use shared packages (`@repo/design-system`, `@repo/ui`, `@repo/api-client`)
   - ✅ Inherit all Tailwind configurations from the design system
   - ✅ Use the same environment variables (via symlink distribution)
   - ✅ Work with Turborepo's build and dev commands
   - ✅ Share TypeScript, ESLint, and Prettier configurations

**Example: Creating an admin dashboard**

```bash
# 1. Duplicate an existing app
cp -r apps/registry-web apps/admin

# 2. Update package.json
cd apps/admin
# Change "name": "registry-web" → "name": "admin"
# Change port from 3001 → 3004

# 3. Start developing!
npm run dev
# Your new admin app will be available at http://localhost:3004
```

All shared packages, configurations, and utilities are automatically available to your new app. This makes it incredibly easy to spin up additional frontend applications while maintaining consistency across your monorepo.

### Environment Variables

The project uses a centralized `.env` file in the root directory:

- **Automatic Setup**: `.env` is created from `.env.example` during `npm install`
- **Automatic Distribution**: When running `npm run dev`, the root `.env` is distributed to all apps and packages via symlinks
- **Excluded Packages**: Config packages (`eslint-config`, `jest-config`, `typescript-config`) don't receive `.env` files
- **Single Source of Truth**: All environment variables are managed in the root `.env` file

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```bash
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```bash
npx turbo link
```
