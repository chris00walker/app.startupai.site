/**
 * Schema Coverage Types
 *
 * Type definitions for the schema-coverage static analysis tool.
 *
 * @story US-A06
 */

export interface TableReference {
  tableName: string;
  filePath: string;
  lineNumber: number;
  context: string; // The line of code containing the reference
}

export interface DrizzleTable {
  tableName: string;       // DB table name (from pgTable first arg)
  variableName: string;    // TypeScript export name
  sourceFile: string;
}

export interface CoverageReport {
  generated_at: string;

  // Tables referenced in code but not defined in Drizzle (ERRORS)
  missing_in_drizzle: {
    tableName: string;
    references: TableReference[];
  }[];

  // Tables defined in Drizzle but never referenced in code (WARNINGS)
  unused_in_code: {
    tableName: string;
    drizzleFile: string;
  }[];

  // Summary stats
  stats: {
    tables_in_drizzle: number;
    tables_in_code: number;
    missing_count: number;
    unused_count: number;
  };
}
