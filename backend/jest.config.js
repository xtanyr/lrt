module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': ['babel-jest', {
      presets: [['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]],
      plugins: [require.resolve('./test/import-meta-transform.cjs')],
    }],
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/node_modules/@prisma/client',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.module.ts'],
  coverageDirectory: 'coverage',
  preset: 'ts-jest',
  transformIgnorePatterns: [
    'node_modules/(?!(.*?/node_modules/)?(ansi-styles|ansi-regex|chalk|color-convert|color-name|escape-string-regexp|has-ansi|supports-color|terminal-strings|strip-ansi|wrap-ansi|@nestjs|@prisma)/)',
  ],
};
