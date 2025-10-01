/**
 * Database Client Configuration
 * 
 * Configures the PostgreSQL connection for Drizzle ORM.
 * Uses Supabase connection pooling for serverless compatibility.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres connection
// max: 1 for serverless/edge functions (connection pooling via Supavisor)
const client = postgres(connectionString, { max: 1 });

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export client for cleanup if needed
export { client as pgClient };
