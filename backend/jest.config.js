module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/..'],
  testMatch: ['<rootDir>/../tests/**/*.test.ts'],
  globalTeardown: '<rootDir>/tests-global-teardown.js',
};
