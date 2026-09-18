# @repo/prisma

Shared Prisma client and schema package with PostgreSQL support. This package provides a singleton Prisma client instance and exports all Prisma types for use across your monorepo or as a standalone npm package.

## Installation

```bash
npm install @repo/prisma
# or
yarn add @repo/prisma
# or
pnpm add @repo/prisma
```

## Prerequisites

- Node.js >= 18
- PostgreSQL database
- `DATABASE_URL` environment variable set

## Quick Start

1. **Set up your database connection string**:

   Copy the example environment file from the root:

   ```bash
   # From the root of the monorepo
   cp .env.example .env
   ```

   The `.env` file in the root directory should contain:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/monex-root-template-v2-db?schema=public"
   ```

   **How Prisma loads environment variables:**

   A symlink is created in `packages/prisma/.env` that points to the root `.env` file. This ensures:
   - The root `.env` file is the single source of truth
   - Prisma commands work correctly from the `packages/prisma` directory
   - The `env("DATABASE_URL")` in `schema.prisma` reads from the root `.env` file

   **Note**: If the symlink doesn't exist, create it with:

   ```bash
   cd packages/prisma && ln -sf ../../.env .env
   ```

2. **The Prisma client is automatically generated** on `npm install` via the `postinstall` script.

3. **Push your schema to the database** (development):

```bash
npx prisma db push
```

Or use migrations for production:

```bash
npx prisma migrate dev
```

## Usage

### Direct Import

You can import the Prisma client directly:

```typescript
import prisma from '@repo/prisma';

// Use in your code
const links = await prisma.link.findMany();
```

### NestJS Integration

The NestJS app includes a `PrismaService` that wraps the Prisma client. Import `PrismaModule` in your app module:

```typescript
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  // ...
})
export class AppModule {}
```

Then inject `PrismaService` in your services:

```typescript
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.link.findMany();
  }
}
```

## Scripts

- `db:generate` - Generate Prisma Client
- `db:push` - Push schema changes to database (for development)
- `db:migrate` - Create and apply migrations
- `db:studio` - Open Prisma Studio
- `db:seed` - Run database seed script

## Type Exports

This package exports all Prisma types for use in your application:

```typescript
import type { Prisma, Link } from '@repo/prisma';

// Use Prisma types
const createData: Prisma.LinkCreateInput = {
  title: 'Example',
  url: 'https://example.com',
  description: 'An example link',
};
```

## Publishing

To publish this package to npm:

```bash
# Build the package
npm run build

# Publish (make sure you're logged in to npm)
npm publish
```

The `prepublishOnly` script will automatically build the package before publishing.
