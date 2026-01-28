/**
 * Schema Coverage Core Functions
 *
 * Static analysis to find gaps between code table references and Drizzle schema.
 *
 * @story US-A06
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TableReference, DrizzleTable } from './types';

// =============================================================================
// Drizzle Schema Parsing
// =============================================================================

/**
 * Extract table definitions from a Drizzle schema file.
 *
 * Matches patterns like:
 *   export const userProfiles = pgTable('user_profiles', { ... })
 */
export function extractDrizzleTables(content: string, filePath: string): DrizzleTable[] {
  const tables: DrizzleTable[] = [];

  // Pattern: export const varName = pgTable('table_name', ...
  const TABLE_PATTERN = /export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*['"]([^'"]+)['"]/g;

  let match;
  while ((match = TABLE_PATTERN.exec(content)) !== null) {
    tables.push({
      variableName: match[1],
      tableName: match[2],
      sourceFile: filePath,
    });
  }

  return tables;
}

/**
 * Discover all Drizzle schema files from the index.ts exports.
 */
export function discoverSchemaFiles(schemaDir: string): string[] {
  const indexPath = path.join(schemaDir, 'index.ts');

  if (!fs.existsSync(indexPath)) {
    // Fall back to globbing all .ts files
    return fs.readdirSync(schemaDir)
      .filter(f => f.endsWith('.ts') && f !== 'index.ts')
      .map(f => path.join(schemaDir, f));
  }

  const content = fs.readFileSync(indexPath, 'utf-8');
  const files: string[] = [];

  // Match: export * from './filename';
  const exportPattern = /export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/g;
  let match;
  while ((match = exportPattern.exec(content)) !== null) {
    const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
    files.push(path.join(schemaDir, fileName));
  }

  return files;
}

/**
 * Parse all Drizzle schema files and return table definitions.
 */
export function parseDrizzleSchema(schemaDir: string): DrizzleTable[] {
  const tables: DrizzleTable[] = [];
  const schemaFiles = discoverSchemaFiles(schemaDir);

  for (const filePath of schemaFiles) {
    if (!fs.existsSync(filePath)) {
      console.warn(`[schema-coverage] Schema file not found: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const fileTables = extractDrizzleTables(content, filePath);
    tables.push(...fileTables);
  }

  return tables;
}

// =============================================================================
// Code Reference Scanning
// =============================================================================

/**
 * Extract table references from a source file.
 *
 * Matches patterns like:
 *   .from('table_name')
 *   .from("table_name")
 *   supabase.from('table_name')
 */
export function extractTableReferences(content: string, filePath: string): TableReference[] {
  const references: TableReference[] = [];
  const lines = content.split('\n');

  // Pattern: .from('table_name') or .from("table_name") with optional generics
  const FROM_PATTERN = /\.from\s*(?:<[^>]+>)?\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = FROM_PATTERN.exec(content)) !== null) {
    const tableName = match[1];

    // Skip if it looks like a template literal or variable
    if (tableName.includes('$') || tableName.includes('{')) {
      continue;
    }

    const lineNumber = content.slice(0, match.index).split('\n').length;
    const context = lines[lineNumber - 1]?.trim() ?? '';

    references.push({
      tableName,
      filePath,
      lineNumber,
      context,
    });
  }

  return references;
}

/**
 * Recursively scan directory for TypeScript files and extract table references.
 */
export function scanCodeForReferences(
  dir: string,
  excludePatterns: string[] = []
): TableReference[] {
  const references: TableReference[] = [];

  function shouldExclude(filePath: string): boolean {
    return excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  function scanDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (shouldExclude(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        // Skip common non-source directories
        if (['node_modules', '.next', 'dist', '.git', 'coverage'].includes(entry.name)) {
          continue;
        }
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const fileRefs = extractTableReferences(content, fullPath);
        references.push(...fileRefs);
      }
    }
  }

  scanDir(dir);
  return references;
}

// =============================================================================
// Coverage Analysis
// =============================================================================

/**
 * Group table references by table name.
 */
export function groupReferencesByTable(
  references: TableReference[]
): Map<string, TableReference[]> {
  const grouped = new Map<string, TableReference[]>();

  for (const ref of references) {
    const existing = grouped.get(ref.tableName) || [];
    existing.push(ref);
    grouped.set(ref.tableName, existing);
  }

  return grouped;
}

/**
 * Find tables referenced in code but not defined in Drizzle.
 */
export function findMissingInDrizzle(
  codeReferences: Map<string, TableReference[]>,
  drizzleTables: DrizzleTable[]
): { tableName: string; references: TableReference[] }[] {
  const drizzleTableNames = new Set(drizzleTables.map(t => t.tableName));
  const missing: { tableName: string; references: TableReference[] }[] = [];

  for (const [tableName, refs] of codeReferences) {
    if (!drizzleTableNames.has(tableName)) {
      missing.push({ tableName, references: refs });
    }
  }

  // Sort by table name for consistent output
  return missing.sort((a, b) => a.tableName.localeCompare(b.tableName));
}

/**
 * Find tables defined in Drizzle but never referenced in code.
 */
export function findUnusedInCode(
  codeReferences: Map<string, TableReference[]>,
  drizzleTables: DrizzleTable[]
): { tableName: string; drizzleFile: string }[] {
  const referencedTables = new Set(codeReferences.keys());
  const unused: { tableName: string; drizzleFile: string }[] = [];

  for (const table of drizzleTables) {
    if (!referencedTables.has(table.tableName)) {
      unused.push({
        tableName: table.tableName,
        drizzleFile: table.sourceFile,
      });
    }
  }

  // Sort by table name for consistent output
  return unused.sort((a, b) => a.tableName.localeCompare(b.tableName));
}
