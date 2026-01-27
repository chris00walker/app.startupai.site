/**
 * FK Type Consistency Checker
 *
 * Parses Drizzle schema files to find foreign key relationships
 * and validates that column types match on both sides.
 *
 * This catches bugs like:
 *   - validation_progress.run_id (UUID) -> validation_runs.run_id (TEXT)
 *
 * @story US-A06
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ColumnDefinition {
  tableName: string;
  columnName: string;       // DB column name
  propertyName: string;     // TypeScript property name
  columnType: string;       // Drizzle type (text, uuid, integer, etc.)
  sourceFile: string;
  lineNumber: number;
}

export interface ForeignKeyRelation {
  sourceTable: string;
  sourceColumn: string;
  sourceType: string;
  targetTable: string;
  targetColumn: string;
  targetType: string | null;  // null if target not found
  sourceFile: string;
  lineNumber: number;
}

export interface FKConsistencyReport {
  generated_at: string;
  foreign_keys: ForeignKeyRelation[];
  type_mismatches: ForeignKeyRelation[];
  unresolved_targets: ForeignKeyRelation[];
  stats: {
    total_fk_count: number;
    mismatch_count: number;
    unresolved_count: number;
  };
}

// Map Drizzle type names to normalized type names
const TYPE_NORMALIZER: Record<string, string> = {
  text: 'TEXT',
  varchar: 'TEXT',
  uuid: 'UUID',
  integer: 'INTEGER',
  int: 'INTEGER',
  smallint: 'INTEGER',
  bigint: 'BIGINT',
  serial: 'INTEGER',
  boolean: 'BOOLEAN',
  timestamp: 'TIMESTAMP',
  date: 'DATE',
  jsonb: 'JSONB',
  json: 'JSON',
  numeric: 'NUMERIC',
  real: 'REAL',
  doublePrecision: 'DOUBLE',
};

function normalizeType(drizzleType: string): string {
  // Extract base type (handle things like `text('column_name')` or custom enums)
  const match = drizzleType.match(/^(\w+)/);
  if (!match) return drizzleType.toUpperCase();

  const baseType = match[1].toLowerCase();
  return TYPE_NORMALIZER[baseType] || baseType.toUpperCase();
}

/**
 * Parse a Drizzle schema file and extract column definitions with types.
 */
export function extractColumns(content: string, filePath: string): ColumnDefinition[] {
  const columns: ColumnDefinition[] = [];
  const lines = content.split('\n');

  // Find all pgTable definitions
  // Pattern: export const varName = pgTable('table_name', {
  const tablePattern = /export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*['"]([^'"]+)['"]/;

  let currentTable: string | null = null;
  let currentTableName: string | null = null;
  let inTableDefinition = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for table definition start
    const tableMatch = line.match(tablePattern);
    if (tableMatch) {
      currentTable = tableMatch[1];
      currentTableName = tableMatch[2];
      inTableDefinition = true;
      braceDepth = 0;
    }

    if (inTableDefinition) {
      // Track brace depth
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      // Check if we've exited the table definition
      if (braceDepth <= 0 && line.includes('}')) {
        inTableDefinition = false;
        currentTable = null;
        currentTableName = null;
        continue;
      }

      // Match column definitions
      // Pattern: propertyName: type('column_name')
      // Examples:
      //   id: uuid('id').defaultRandom().primaryKey()
      //   userId: uuid('user_id').references(() => users.id)
      //   runId: text('run_id')
      const columnPattern = /^\s+(\w+)\s*:\s*(\w+)\s*\(\s*['"]([^'"]+)['"]/;
      const columnMatch = line.match(columnPattern);

      if (columnMatch && currentTableName) {
        columns.push({
          tableName: currentTableName,
          propertyName: columnMatch[1],
          columnType: columnMatch[2],
          columnName: columnMatch[3],
          sourceFile: filePath,
          lineNumber: i + 1,
        });
      }
    }
  }

  return columns;
}

/**
 * Parse a Drizzle schema file and extract foreign key relationships.
 * Handles multi-line column definitions where .references() is on a separate line.
 */
export function extractForeignKeys(content: string, filePath: string): ForeignKeyRelation[] {
  const fks: ForeignKeyRelation[] = [];
  const lines = content.split('\n');

  // Find table definitions
  const tablePattern = /export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*['"]([^'"]+)['"]/;

  let currentTableName: string | null = null;
  let inTableDefinition = false;
  let braceDepth = 0;

  // Track current column being defined (for multi-line handling)
  let currentColumnDef: {
    propertyName: string;
    columnType: string;
    columnName: string;
    startLine: number;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for table definition start
    const tableMatch = line.match(tablePattern);
    if (tableMatch) {
      currentTableName = tableMatch[2];
      inTableDefinition = true;
      braceDepth = 0;
    }

    if (inTableDefinition) {
      // Track brace depth
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      // Check if we've exited the table definition
      if (braceDepth <= 0 && line.includes('}')) {
        inTableDefinition = false;
        currentTableName = null;
        currentColumnDef = null;
        continue;
      }

      // Match column definition start
      // Pattern: propertyName: type('column_name')
      const columnStartPattern = /^\s+(\w+)\s*:\s*(\w+)\s*\(\s*['"]([^'"]+)['"]/;
      const columnMatch = line.match(columnStartPattern);

      if (columnMatch) {
        currentColumnDef = {
          propertyName: columnMatch[1],
          columnType: columnMatch[2],
          columnName: columnMatch[3],
          startLine: i + 1,
        };
      }

      // Match FK reference (may be on same line or continuation line)
      // Pattern: .references(() => targetTable.column
      const fkPattern = /\.references\s*\(\s*\(\s*\)\s*=>\s*(\w+)\.(\w+)/;
      const fkMatch = line.match(fkPattern);

      if (fkMatch && currentTableName && currentColumnDef) {
        fks.push({
          sourceTable: currentTableName,
          sourceColumn: currentColumnDef.columnName,
          sourceType: currentColumnDef.columnType,
          targetTable: fkMatch[1],    // Target variable name (needs resolution)
          targetColumn: fkMatch[2],   // Target property name (needs resolution)
          targetType: null,           // Will be resolved later
          sourceFile: filePath,
          lineNumber: currentColumnDef.startLine,
        });
      }

      // Reset current column if line ends with comma (column definition complete)
      if (line.trimEnd().endsWith(',')) {
        currentColumnDef = null;
      }
    }
  }

  return fks;
}

/**
 * Discover schema files and parse all columns.
 */
export function parseAllColumns(schemaDir: string): Map<string, Map<string, ColumnDefinition>> {
  const tableColumns = new Map<string, Map<string, ColumnDefinition>>();

  const indexPath = path.join(schemaDir, 'index.ts');
  let schemaFiles: string[];

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const exportPattern = /export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/g;
    schemaFiles = [];
    let match;
    while ((match = exportPattern.exec(content)) !== null) {
      const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
      schemaFiles.push(path.join(schemaDir, fileName));
    }
  } else {
    schemaFiles = fs.readdirSync(schemaDir)
      .filter(f => f.endsWith('.ts') && f !== 'index.ts')
      .map(f => path.join(schemaDir, f));
  }

  for (const filePath of schemaFiles) {
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    const columns = extractColumns(content, filePath);

    for (const col of columns) {
      if (!tableColumns.has(col.tableName)) {
        tableColumns.set(col.tableName, new Map());
      }
      tableColumns.get(col.tableName)!.set(col.propertyName, col);
    }
  }

  return tableColumns;
}

/**
 * Build a map from Drizzle variable names to table names.
 */
export function buildTableNameMap(schemaDir: string): Map<string, string> {
  const varToTable = new Map<string, string>();

  const indexPath = path.join(schemaDir, 'index.ts');
  let schemaFiles: string[];

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const exportPattern = /export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/g;
    schemaFiles = [];
    let match;
    while ((match = exportPattern.exec(content)) !== null) {
      const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
      schemaFiles.push(path.join(schemaDir, fileName));
    }
  } else {
    schemaFiles = fs.readdirSync(schemaDir)
      .filter(f => f.endsWith('.ts') && f !== 'index.ts')
      .map(f => path.join(schemaDir, f));
  }

  for (const filePath of schemaFiles) {
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    const tablePattern = /export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*['"]([^'"]+)['"]/g;

    let match;
    while ((match = tablePattern.exec(content)) !== null) {
      varToTable.set(match[1], match[2]);
    }
  }

  return varToTable;
}

/**
 * Analyze FK consistency across all schema files.
 */
export function analyzeFKConsistency(schemaDir: string): FKConsistencyReport {
  console.error('[fk-consistency] Parsing column definitions...');
  const tableColumns = parseAllColumns(schemaDir);

  console.error('[fk-consistency] Building table name map...');
  const varToTable = buildTableNameMap(schemaDir);

  console.error('[fk-consistency] Extracting foreign key relationships...');
  const allFKs: ForeignKeyRelation[] = [];

  const indexPath = path.join(schemaDir, 'index.ts');
  let schemaFiles: string[];

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const exportPattern = /export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/g;
    schemaFiles = [];
    let match;
    while ((match = exportPattern.exec(content)) !== null) {
      const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
      schemaFiles.push(path.join(schemaDir, fileName));
    }
  } else {
    schemaFiles = fs.readdirSync(schemaDir)
      .filter(f => f.endsWith('.ts') && f !== 'index.ts')
      .map(f => path.join(schemaDir, f));
  }

  for (const filePath of schemaFiles) {
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    const fks = extractForeignKeys(content, filePath);
    allFKs.push(...fks);
  }

  console.error(`[fk-consistency] Found ${allFKs.length} foreign key relationships`);

  // Resolve target types
  const resolvedFKs: ForeignKeyRelation[] = [];
  const typeMismatches: ForeignKeyRelation[] = [];
  const unresolvedTargets: ForeignKeyRelation[] = [];

  for (const fk of allFKs) {
    // Resolve target table name from variable name
    const targetTableName = varToTable.get(fk.targetTable);

    if (!targetTableName) {
      unresolvedTargets.push(fk);
      continue;
    }

    // Look up target column
    const targetTableCols = tableColumns.get(targetTableName);
    if (!targetTableCols) {
      unresolvedTargets.push(fk);
      continue;
    }

    const targetCol = targetTableCols.get(fk.targetColumn);
    if (!targetCol) {
      unresolvedTargets.push(fk);
      continue;
    }

    // Update FK with resolved info
    const resolvedFK: ForeignKeyRelation = {
      ...fk,
      targetTable: targetTableName,
      targetType: targetCol.columnType,
    };

    resolvedFKs.push(resolvedFK);

    // Check for type mismatch
    const sourceTypeNorm = normalizeType(fk.sourceType);
    const targetTypeNorm = normalizeType(targetCol.columnType);

    if (sourceTypeNorm !== targetTypeNorm) {
      typeMismatches.push(resolvedFK);
    }
  }

  return {
    generated_at: new Date().toISOString(),
    foreign_keys: resolvedFKs,
    type_mismatches: typeMismatches,
    unresolved_targets: unresolvedTargets,
    stats: {
      total_fk_count: allFKs.length,
      mismatch_count: typeMismatches.length,
      unresolved_count: unresolvedTargets.length,
    },
  };
}

/**
 * Format FK consistency report for human reading.
 */
export function formatFKConsistencyReport(report: FKConsistencyReport, projectRoot: string): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('FK Type Consistency Report');
  lines.push('==========================');
  lines.push(`Generated: ${report.generated_at}`);
  lines.push('');
  lines.push(`Total FK relationships: ${report.stats.total_fk_count}`);
  lines.push(`Type mismatches: ${report.stats.mismatch_count}`);
  lines.push(`Unresolved targets: ${report.stats.unresolved_count}`);
  lines.push('');

  if (report.type_mismatches.length > 0) {
    lines.push('ERRORS - FK Type Mismatches:');
    lines.push('─'.repeat(60));
    lines.push('');

    for (const fk of report.type_mismatches) {
      const relativePath = path.relative(projectRoot, fk.sourceFile);
      lines.push(`  ❌ ${fk.sourceTable}.${fk.sourceColumn} (${fk.sourceType})`);
      lines.push(`     → ${fk.targetTable}.${fk.targetColumn} (${fk.targetType})`);
      lines.push(`     Defined at: ${relativePath}:${fk.lineNumber}`);
      lines.push('');
    }

    lines.push('These FK relationships have incompatible types!');
    lines.push('Fix by aligning column types in the Drizzle schema.');
    lines.push('');
  }

  if (report.unresolved_targets.length > 0) {
    lines.push('WARNINGS - Unresolved FK Targets:');
    lines.push('─'.repeat(60));
    lines.push('');

    for (const fk of report.unresolved_targets) {
      const relativePath = path.relative(projectRoot, fk.sourceFile);
      lines.push(`  ⚠️  ${fk.sourceTable}.${fk.sourceColumn}`);
      lines.push(`     → ${fk.targetTable}.${fk.targetColumn} (NOT FOUND)`);
      lines.push(`     Defined at: ${relativePath}:${fk.lineNumber}`);
      lines.push('');
    }

    lines.push('These FK targets could not be resolved in the schema.');
    lines.push('');
  }

  if (report.type_mismatches.length === 0 && report.unresolved_targets.length === 0) {
    lines.push('✅ PASS - All FK relationships have matching types');
  } else if (report.type_mismatches.length === 0) {
    lines.push('✅ PASS - No type mismatches (warnings only)');
  } else {
    lines.push(`❌ FAIL - ${report.type_mismatches.length} FK type mismatch(es) found`);
  }

  lines.push('');
  return lines.join('\n');
}
