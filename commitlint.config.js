module.exports = {
  extends: ['@commitlint/config-conventional'],
  // example commit name: feat(monex-root): add prettier, commit-lint, husky and pre-commit
  rules: {
    // Ensure commit type is one of the specified values
    'type-enum': [
      2,
      'always',
      ['build', 'chore', 'docs', 'feat', 'fix', 'refactor', 'test', 'release'],
    ],
    // Ensure scope is in kebab-case or lower-case (allows numbers)
    'scope-case': [2, 'always', ['kebab-case', 'lower-case']],
    // Ensure scope is never empty
    'scope-empty': [2, 'never'],
    'header-max-length': [2, 'always', 150],
  },
};
