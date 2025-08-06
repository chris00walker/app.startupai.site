import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    threads: false,  // Run tests in a single thread to avoid MongoDB memory server conflicts
    maxConcurrency: 1,
    environment: 'node',
    setupFiles: ['./vitest.setup.js'],
    testTimeout: 60000,
    reporters: ['verbose'],
    hookTimeout: 60000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['agents/**', 'models/**', 'server/**'],
      exclude: ['**/__tests__/**'],
    },
  },
});
