#!/bin/bash

# Separate Frontend from Monorepo
# Removes: apps/api, apps/db, packages/prisma (replaced with npm package)

set -e

echo "🔧 Separating Frontend from Monorepo..."
echo ""

# Prompt for Prisma package source
echo "📦 Prisma Package Configuration"
echo "The frontend needs @repo/prisma types. Choose how to get them:"
echo ""
echo "1. Use npm package (for production - requires published package)"
echo "2. Keep local reference (for development - will need backend repo)"
echo ""
read -p "Enter choice (1 or 2): " PRISMA_CHOICE

PRISMA_NPM_NAME=""
if [[ "$PRISMA_CHOICE" == "1" ]]; then
    read -p "Enter npm package name (e.g., @your-org/prisma or your-prisma-types): " PRISMA_NPM_NAME
    if [[ -z "$PRISMA_NPM_NAME" ]]; then
        echo "Package name required for npm option. Aborted."
        exit 1
    fi
    read -p "Enter package version (e.g., ^1.0.0): " PRISMA_VERSION
    PRISMA_VERSION=${PRISMA_VERSION:-"*"}
fi

# Confirm
echo ""
read -p "This will remove backend apps and packages. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Remove backend apps
echo "📦 Removing backend apps..."
rm -rf apps/api
rm -rf apps/db

# Remove backend packages
echo "📦 Removing backend packages..."
rm -rf packages/prisma

# Replace config files with frontend versions
echo "📝 Updating config files..."
cp docs/package-frontend.json package.json
cp docs/turbo-frontend.json turbo.json
cp docs/README-frontend.md README.md
cp docs/env-frontend.example .env.example

# Update prisma references if using npm package
if [[ -n "$PRISMA_NPM_NAME" ]]; then
    echo "📝 Updating Prisma imports to use npm package: $PRISMA_NPM_NAME..."
    
    # Update api-client package.json
    if [[ -f "packages/api-client/package.json" ]]; then
        sed -i.bak "s/\"@repo\/prisma\": \"\*\"/\"$PRISMA_NPM_NAME\": \"$PRISMA_VERSION\"/" packages/api-client/package.json
        rm -f packages/api-client/package.json.bak
        
        # Update imports in api-client
        find packages/api-client -name "*.ts" -exec sed -i.bak "s/@repo\/prisma/$PRISMA_NPM_NAME/g" {} \;
        find packages/api-client -name "*.bak" -delete
    fi
    
    # Update web app
    if [[ -d "apps/web" ]]; then
        find apps/web -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak "s/@repo\/prisma/$PRISMA_NPM_NAME/g" 2>/dev/null || true
        find apps/web -name "*.bak" -delete 2>/dev/null || true
    fi
    
    # Update admin app
    if [[ -d "apps/admin" ]]; then
        find apps/admin -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak "s/@repo\/prisma/$PRISMA_NPM_NAME/g" 2>/dev/null || true
        find apps/admin -name "*.bak" -delete 2>/dev/null || true
    fi
    
    echo "✅ Updated imports to use $PRISMA_NPM_NAME"
fi

# Remove db scripts
echo "📝 Removing database scripts..."
rm -f scripts/db-start.sh
rm -f scripts/db-stop.sh

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
echo "✅ Frontend separation complete!"
echo ""
echo "Structure:"
echo "├── apps"
echo "│   ├── admin   # Next.js Admin"
echo "│   └── web     # Next.js Web"
echo "└── packages"
echo "    ├── api-client      # API definitions"
echo "    ├── design-system   # Tailwind config"
echo "    ├── eslint-config"
echo "    ├── jest-config"
echo "    ├── typescript-config"
echo "    └── ui              # React components"
echo ""
if [[ -n "$PRISMA_NPM_NAME" ]]; then
    echo "Prisma types: $PRISMA_NPM_NAME@$PRISMA_VERSION"
else
    echo "Prisma types: Local reference (requires backend repo)"
fi
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Set NEXT_PUBLIC_API_URL in .env"
