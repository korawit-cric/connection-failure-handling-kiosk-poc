import { config } from '@repo/eslint-config/base';

export default [
  ...config,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      'apps/db/**',
    ],
  },
];
