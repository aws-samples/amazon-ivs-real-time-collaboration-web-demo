module.exports = {
  extends: ['../.eslintrc.cjs'],
  parserOptions: { sourceType: 'module', tsconfigRootDir: __dirname },
  rules: {
    'no-new': 'off',
    'import/prefer-default-export': 'off'
  }
};
