import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
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
