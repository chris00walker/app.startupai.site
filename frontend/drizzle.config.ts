/**
 * Drizzle Kit Configuration
 *
 * Configuration for Drizzle ORM migrations and schema management.
 * Used by drizzle-kit for generate, push, and introspect commands.
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
