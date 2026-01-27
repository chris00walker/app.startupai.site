/**
 * Schema Drift Validator Core Functions
 *
 * Pure functions for parsing Drizzle schema files.
 */

import type { TableSchema } from './schema';

/**
 * Pattern to match pgTable declarations.
 * Captures: (1) TypeScript variable name, (2) Database table name
 *
 * Example matches:
 *   export const projects = pgTable('projects', {
 *   export const userProfiles = pgTable('user_profiles', {
 */
const TABLE_PATTERN = /export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*['"]([^'"]+)['"]/g;

/**
 * Pattern to extract column definitions from a table body.
 * Uses PERMISSIVE matching - matches ANY function with string first argument.
 *
 * Works for:
 * - Standard Drizzle types: text('x'), uuid('x'), jsonb('x'), timestamp('x')
 * - Custom pgEnum types: userRoleEnum('x'), adPlatformEnum('x')
 * - Complex types: numeric('x', { precision: 10, scale: 2 })
 *
 * Anchored to line start with indentation to avoid matching:
 * - Import statements
 * - Type definitions
 * - Comments
 *
 * Captures: (1) TypeScript property name, (2) Database column name
 */
const COLUMN_PATTERN = /^\s+(\w+)\s*:\s*\w+\s*\(\s*['"]([^'"]+)['"]/gm;

/**
 * Pattern to find export statements in index.ts.
 * Captures: (1) Filename without extension
 *
 * Example: export * from './users';  -> 'users'
 */
const EXPORT_PATTERN = /export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/g;

/**
 * Extract column names from a table definition block.
 *
 * @param tableContent - The content between pgTable('name', { ... })
 * @returns Array of database column names (snake_case)
 */
export function extractColumns(tableContent: string): string[] {
  const columns: string[] = [];
  const pattern = new RegExp(COLUMN_PATTERN.source, 'gm');

  let match;
  while ((match = pattern.exec(tableContent)) !== null) {
    const columnName = match[2];
    // Avoid duplicates (shouldn't happen in valid schema, but safety check)
    if (!columns.includes(columnName)) {
      columns.push(columnName);
    }
  }

  return columns;
}

/**
 * Find the table body content between pgTable('name', { and the closing });
 *
 * @param content - Full file content
 * @param startIndex - Index after the opening brace
 * @returns The content of the table definition
 */
function extractTableBody(content: string, startIndex: number): string {
  let braceCount = 1;
  let i = startIndex;

  while (i < content.length && braceCount > 0) {
    if (content[i] === '{') {
      braceCount++;
    } else if (content[i] === '}') {
      braceCount--;
    }
    i++;
  }

  return content.slice(startIndex, i - 1);
}

/**
 * Parse a Drizzle schema file and extract table/column definitions.
 *
 * @param content - The TypeScript file content
 * @param filePath - Path to the file (for error reporting and metadata)
 * @returns Array of table schemas found in the file
 */
export function parseSchemaFile(content: string, filePath: string): TableSchema[] {
  const tables: TableSchema[] = [];
  const pattern = new RegExp(TABLE_PATTERN.source, 'g');

  let match;
  while ((match = pattern.exec(content)) !== null) {
    const variableName = match[1];
    const tableName = match[2];

    // Find the opening brace after pgTable('name',
    const afterMatch = content.slice(match.index + match[0].length);
    const braceIndex = afterMatch.indexOf('{');

    if (braceIndex === -1) {
      console.error(`WARNING: Could not find table body for ${tableName} in ${filePath}`);
      continue;
    }

    const bodyStartIndex = match.index + match[0].length + braceIndex + 1;
    const tableBody = extractTableBody(content, bodyStartIndex);
    const columns = extractColumns(tableBody);

    tables.push({
      tableName,
      variableName,
      columns,
      sourceFile: filePath,
    });
  }

  return tables;
}

/**
 * Discover schema files to parse from the index.ts exports.
 *
 * @param indexContent - Content of the index.ts file
 * @returns Array of relative file paths (e.g., ['users.ts', 'projects.ts'])
 */
export function discoverSchemaFiles(indexContent: string): string[] {
  const files: string[] = [];
  const pattern = new RegExp(EXPORT_PATTERN.source, 'g');

  let match;
  while ((match = pattern.exec(indexContent)) !== null) {
    files.push(match[1] + '.ts');
  }

  return files;
}
