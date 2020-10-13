module.exports = {
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/recommended',
    'plugin:prettier/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'prettier',
    'unicorn',
    'import',
  ],
  rules: {
    'import/extensions': ['error', { js: 'ignorePackages', ts: 'never' }],
    'import/prefer-default-export': 'off',
    'lines-between-class-members': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};
