/**
 * Schema Drift Validator Type Definitions
 *
 * TypeScript interfaces for schema drift detection.
 */

/**
 * Represents a single table's schema definition from Drizzle.
 */
export interface TableSchema {
  /** Database table name (snake_case) */
  tableName: string;
  /** TypeScript variable name in the schema file */
  variableName: string;
  /** List of database column names */
  columns: string[];
  /** Source .ts file path relative to schema directory */
  sourceFile: string;
}

/**
 * Complete expected schema extracted from Drizzle TypeScript files.
 */
export interface ExpectedSchema {
  /** ISO timestamp when schema was generated */
  generated_at: string;
  /** Map of table name to table schema */
  tables: Record<string, TableSchema>;
}

/**
 * Report of schema drift between Drizzle and production.
 */
export interface DriftReport {
  /** ISO timestamp when check was performed */
  checked_at: string;
  /** Overall status */
  status: 'NO_DRIFT' | 'DRIFT_DETECTED';
  /** Columns in Drizzle but not in production (critical - blocks queries) */
  missing_columns: Array<{ table: string; column: string }>;
  /** Columns in production but not in Drizzle (info only - may be triggers, manual additions) */
  extra_columns: Array<{ table: string; column: string }>;
  /** Tables in Drizzle but not in production */
  missing_tables: string[];
}

/**
 * Raw column info from Supabase information_schema query.
 */
export interface ProductionColumn {
  table_name: string;
  column_name: string;
}
