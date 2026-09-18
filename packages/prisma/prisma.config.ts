import path from 'node:path';
import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Load .env from package directory or root
config({ path: path.join(__dirname, '.env') });
config({ path: path.join(__dirname, '..', '..', '.env') });

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/monex-root-template-v2-db?schema=public';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: databaseUrl,
  },
  migrate: {
    url: databaseUrl,
  },
});
