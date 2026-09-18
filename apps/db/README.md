# Database Service

PostgreSQL database service running in Docker.

## Usage

```bash
# Start the database
npm run dev
# or
npm start

# Stop the database
npm stop
# or
npm run down

# View logs
npm run logs

# Check status
npm run ps
```

## Environment Variables

The database configuration is read from the root `.env` file:

- `DB_USER` - PostgreSQL username (default: postgres)
- `DB_PASSWORD` - PostgreSQL password (default: postgres)
- `DB_NAME` - Database name (default: monex-root-template-v2-db)
- `DB_PORT` - Host port mapping (default: 5433)
- `DB_CONTAINER_NAME` - Docker container name (default: monex-root-template-v2-db)
- `DATABASE_URL` - Full connection string for Prisma

## Connection

The database is accessible at:

- **Host**: localhost
- **Port**: ${DB_PORT:-5433}
- **Database**: ${DB_NAME:-monex-root-template-v2-db}
- **User**: ${DB_USER:-postgres}
- **Password**: ${DB_PASSWORD:-postgres}
