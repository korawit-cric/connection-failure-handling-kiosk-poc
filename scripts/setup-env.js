#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envExamplePath = path.join(rootDir, '.env.example');
const envPath = path.join(rootDir, '.env');

// Create .env from .env.example if it doesn't exist
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📝 Creating .env from .env.example...');

  // Read .env.example and process variable substitution
  let envContent = fs.readFileSync(envExamplePath, 'utf8');

  // Replace ${VAR} with actual values or defaults
  const defaults = {
    DB_USER: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_NAME: 'monex-root-template-v2-db',
    DB_PORT: '5433',
    DB_CONTAINER_NAME: 'nestjs-poc-db',
  };

  // Replace ${VAR} with default values
  envContent = envContent.replace(
    /\$\{(\w+)(?::-([^}]+))?\}/g,
    (match, varName, defaultValue) => {
      return defaultValue || defaults[varName] || match;
    },
  );

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
} else if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
} else {
  console.warn('⚠️  .env.example not found, skipping .env creation');
}
