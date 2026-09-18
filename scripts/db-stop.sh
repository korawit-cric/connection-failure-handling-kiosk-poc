#!/bin/bash

# Stop PostgreSQL database using Docker Compose
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_DIR="$ROOT_DIR/apps/db"

echo "Stopping PostgreSQL database..."
cd "$DB_DIR" && docker-compose down

echo "✅ PostgreSQL database stopped!"


