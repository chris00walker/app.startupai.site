/**
 * Drizzle Kit Configuration
 * 
 * Configuration for Drizzle Kit CLI tools (migrations, introspection, etc.)
 * Connects to Supabase PostgreSQL database.
 */

import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { resolve } from 'path';

// Load environment from frontend/.env.local
config({ path: resolve(__dirname, 'frontend/.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL not found in frontend/.env.local');
}

export default defineConfig({
  schema: './frontend/src/db/schema/index.ts',
  out: './frontend/src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
