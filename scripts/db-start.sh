#!/bin/bash

# Start PostgreSQL database using Docker Compose
# Load environment variables from root .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_DIR="$ROOT_DIR/apps/db"

# Load .env file if it exists
if [ -f "$ROOT_DIR/.env" ]; then
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

# Set defaults if not set
export DB_USER=${DB_USER:-postgres}
export DB_PASSWORD=${DB_PASSWORD:-postgres}
export DB_NAME=${DB_NAME:-monex-root-template-v2-db}
export DB_PORT=${DB_PORT:-5433}
export DB_CONTAINER_NAME=${DB_CONTAINER_NAME:-nestjs-poc-db}

echo "Starting PostgreSQL database..."
cd "$DB_DIR" && docker-compose up -d postgres

echo "Waiting for database to be ready..."
sleep 5

# Check if database is ready
until docker-compose -f "$DB_DIR/docker-compose.yml" exec -T postgres pg_isready -U "$DB_USER" > /dev/null 2>&1; do
  echo "Waiting for database..."
  sleep 2
done

echo "✅ PostgreSQL database is ready!"
echo ""
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME?schema=public"

