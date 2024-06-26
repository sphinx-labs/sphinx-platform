module.exports = {
  $schema: 'http://json.schemastore.org/prettierrc',
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  arrowParens: 'always',
  overrides: [
    {
      files: '*.json',
      options: {
        semi: false,
        singleQuote: false,
      },
    },
  ],
}
