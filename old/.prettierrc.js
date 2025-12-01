module.exports = {
  singleQuote: true,
  useTabs: false,
  printWidth: 140,
  tabWidth: 2,
  semi: true,
  htmlWhitespaceSensitivity: 'strict',
  arrowParens: 'avoid',
  bracketSpacing: true,
  proseWrap: 'preserve',
  trailingComma: 'none',
  endOfLine: 'lf',
  // Enterprise standards
  overrides: [
    {
      files: '*.ts',
      options: {
        parser: 'typescript',
        singleQuote: true,
        trailingComma: 'none'
      }
    },
    {
      files: '*.html',
      options: {
        parser: 'angular',
        htmlWhitespaceSensitivity: 'strict'
      }
    },
    {
      files: ['*.json', '*.yml', '*.yaml'],
      options: {
        tabWidth: 2
      }
    }
  ]
};
