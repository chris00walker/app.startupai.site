export default {
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      roots: ['<rootDir>/backend'],
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/frontend/src'],
      setupFilesAfterEnv: ['<rootDir>/frontend/src/setupTests.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
    },
  ],
};
