const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Global setup - runs once BEFORE all tests (pre-cleans orphan data)
  globalSetup: '<rootDir>/src/__tests__/globalSetup.ts',

  // Global teardown - runs once AFTER all tests complete
  globalTeardown: '<rootDir>/src/__tests__/globalTeardown.ts',

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/__tests__/e2e/',
    '<rootDir>/src/pages/test.tsx',
    '<rootDir>/src/components/legacy/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.netlify/',
    '<rootDir>/../.netlify/',
    '<rootDir>/.next/standalone/',
    '<rootDir>/src/components/legacy/',
  ],
  watchPathIgnorePatterns: [
    '<rootDir>/.next/standalone/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^until-async$': '<rootDir>/src/tests/mocks/untilAsyncMock.ts',
  },
  setupFiles: ['<rootDir>/jest.polyfills.js', '<rootDir>/jest.env.js'],
  maxWorkers: 1, // Prevent worker crashes in constrained environments
  // Specification-driven test configuration
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/components/**/__tests__/*.test.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
    '!src/components/legacy/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  // Test organization for specification-driven testing
  verbose: true
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
