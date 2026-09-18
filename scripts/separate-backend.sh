#!/bin/bash

# Separate Backend from Monorepo
# Removes: apps/web, apps/admin, packages/api-client, packages/design-system, packages/ui

set -e

echo "🔧 Separating Backend from Monorepo..."
echo ""

# Confirm
read -p "This will remove frontend apps and packages. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Remove frontend apps
echo "📦 Removing frontend apps..."
rm -rf apps/web
rm -rf apps/admin

# Remove frontend packages
echo "📦 Removing frontend packages..."
rm -rf packages/api-client
rm -rf packages/design-system
rm -rf packages/ui

# Replace config files with backend versions
echo "📝 Updating config files..."
cp docs/package-backend.json package.json
cp docs/turbo-backend.json turbo.json
cp docs/README-backend.md README.md
cp docs/env-backend.example .env.example

# Prompt for Prisma package rename
echo ""
echo "📦 Prisma Package Configuration"
echo "Current name: @repo/prisma"
read -p "Enter new package name for npm publishing (or press Enter to keep @repo/prisma): " NEW_PRISMA_NAME

if [[ -n "$NEW_PRISMA_NAME" ]]; then
    echo "Renaming @repo/prisma to $NEW_PRISMA_NAME..."
    sed -i.bak "s/\"name\": \"@repo\/prisma\"/\"name\": \"$NEW_PRISMA_NAME\"/" packages/prisma/package.json
    rm -f packages/prisma/package.json.bak
    
    # Update imports in api
    find apps/api -name "*.ts" -exec sed -i.bak "s/@repo\/prisma/$NEW_PRISMA_NAME/g" {} \;
    find apps/api -name "*.bak" -delete
    
    echo "✅ Renamed to $NEW_PRISMA_NAME"
fi

# Clean up docs folder
echo "📦 Cleaning up..."
rm -rf docs/

# Remove separation scripts (no longer needed)
rm -f scripts/separate-frontend.sh
rm -f scripts/separate-backend.sh

# Clean up node_modules
rm -rf node_modules
rm -f package-lock.json

echo ""
echo "✅ Backend separation complete!"
echo ""
echo "Structure:"
echo "├── apps"
echo "│   ├── api     # NestJS API"
echo "│   └── db      # PostgreSQL"
echo "└── packages"
echo "    ├── eslint-config"
echo "    ├── jest-config"
echo "    ├── prisma   # Ready to publish to npm"
echo "    └── typescript-config"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Publish prisma package: cd packages/prisma && npm publish"
