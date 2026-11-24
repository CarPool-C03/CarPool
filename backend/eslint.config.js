// ESLint del backend. Le stesse regole di base sono in frontend/eslint.config.js.
const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['node_modules/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // Regola del progetto (AGENTS.md): nessun file oltre le 200 righe.
      'max-lines': ['error', { max: 200 }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['test/**/*.js', '**/*.test.js'],
    languageOptions: { globals: { ...globals.jest } },
  },
  prettier,
];
