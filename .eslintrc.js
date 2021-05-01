module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      'babel-module': {
      },
    },
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'object-curly-newline': ['error', {
      ObjectExpression: 'always',
      ObjectPattern: {
        multiline: true,
      },
      ImportDeclaration: 'never',
      ExportDeclaration: {
        multiline: true, minProperties: 3,
      },
    }],
  },
};
