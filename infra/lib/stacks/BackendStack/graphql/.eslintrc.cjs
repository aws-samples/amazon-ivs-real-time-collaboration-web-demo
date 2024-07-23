module.exports = {
  overrides: [
    {
      extends: ['../../../../.eslintrc.cjs', 'plugin:@aws-appsync/recommended'],
      files: ['**/*.ts']
    }
  ]
};
