import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      // Unused code
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Type safety (warn for flexibility)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Code quality
      'no-console': ['warn', { allow: ['error', 'info', 'warn'] }],
      'no-debugger': 'error',
      'no-nested-ternary': 'warn',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    ignores: ['dist/**'],
  },
];
