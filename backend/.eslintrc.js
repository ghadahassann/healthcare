module.exports = {
  env: {
    node: true,
    jest: true,
    es6: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'off',
    'no-console': 'off',
    'no-undef': 'off'
  },
  globals: {
    Promise: 'readonly',
    console: 'readonly',
    process: 'readonly',
    require: 'readonly',
    module: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly'
  }
};