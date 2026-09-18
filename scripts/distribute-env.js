#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// Packages to exclude (config packages)
const excludedPackages = ['eslint-config', 'jest-config', 'typescript-config'];

// Check if root .env exists
if (!fs.existsSync(envPath)) {
  console.error(
    '❌ Root .env file not found. Please create it from .env.example',
  );
  process.exit(1);
}

// Get all apps
const appsDir = path.join(rootDir, 'apps');
const packagesDir = path.join(rootDir, 'packages');

const targets = [];

// Add apps
if (fs.existsSync(appsDir)) {
  const apps = fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => ({
      name: dirent.name,
      path: path.join(appsDir, dirent.name),
    }));
  targets.push(...apps);
}

// Add packages (excluding config packages)
if (fs.existsSync(packagesDir)) {
  const packages = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) => !excludedPackages.includes(dirent.name))
    .map((dirent) => ({
      name: dirent.name,
      path: path.join(packagesDir, dirent.name),
    }));
  targets.push(...packages);
}

// Distribute .env to each target
let distributed = 0;
for (const target of targets) {
  const targetEnvPath = path.join(target.path, '.env');
  const relativePath = path.relative(rootDir, target.path);

  // Create symlink to root .env
  try {
    // Remove existing .env if it's not a symlink
    if (fs.existsSync(targetEnvPath)) {
      const stats = fs.lstatSync(targetEnvPath);
      if (!stats.isSymbolicLink()) {
        fs.unlinkSync(targetEnvPath);
      }
    }

    // Create symlink if it doesn't exist
    if (!fs.existsSync(targetEnvPath)) {
      const relativeEnvPath = path.relative(target.path, envPath);
      fs.symlinkSync(relativeEnvPath, targetEnvPath, 'file');
      console.log(`✅ Linked .env to ${relativePath}/`);
      distributed++;
    } else {
      console.log(`⏭️  ${relativePath}/.env already exists (symlink)`);
    }
  } catch (error) {
    console.error(
      `❌ Failed to create symlink for ${relativePath}:`,
      error.message,
    );
  }
}

if (distributed > 0) {
  console.log(`\n✨ Distributed .env to ${distributed} target(s)`);
} else {
  console.log('\n✨ All targets already have .env symlinks');
}
