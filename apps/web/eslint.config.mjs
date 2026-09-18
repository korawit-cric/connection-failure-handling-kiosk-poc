import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ['*.config.mjs', 'eslint.config.mjs', 'postcss.config.mjs'],
  },
  ...nextJsConfig,
];
