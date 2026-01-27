/**
 * Schema Drift Validator Configuration
 *
 * Constants for the schema drift detection tool.
 */

import * as path from 'path';

export const PROJECT_ROOT = path.resolve(__dirname, '../..');
export const SCHEMA_DIR = 'frontend/src/db/schema';
export const SUPABASE_PROJECT_ID = 'eqxropalhxjeyvfcoyxg';

/**
 * Tables to exclude from drift detection (internal/system tables).
 * These are managed by Supabase or other systems, not our Drizzle schema.
 */
export const EXCLUDE_TABLES = ['_prisma_migrations', 'schema_migrations'];

/**
 * Note: We intentionally do NOT maintain a list of Drizzle column types.
 * The column extraction regex uses a permissive pattern that matches
 * ANY function call with a string first argument, which handles:
 * - Standard Drizzle types: text('x'), uuid('x'), jsonb('x'), timestamp('x')
 * - Custom pgEnum types: userRoleEnum('x'), adPlatformEnum('x')
 * - Complex types: numeric('x', { precision: 10, scale: 2 })
 */
