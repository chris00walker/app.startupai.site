#!/usr/bin/env tsx
/**
 * Schema Drift Analyzer CLI
 *
 * Parses local Drizzle schema files and outputs expected schema as JSON.
 * This is the first part of drift detection - the Claude skill handles
 * querying production and comparing.
 *
 * Usage:
 *   pnpm schema:expected
 *
 * Output:
 *   JSON to stdout with expected table/column structure
 */

import * as fs from 'fs';
import * as path from 'path';
import { PROJECT_ROOT, SCHEMA_DIR, EXCLUDE_TABLES } from './config';
import { parseSchemaFile, discoverSchemaFiles } from './core';
import type { ExpectedSchema, TableSchema } from './schema';

function main(): void {
  const schemaDir = path.join(PROJECT_ROOT, SCHEMA_DIR);
  const indexPath = path.join(schemaDir, 'index.ts');

  // Validate schema directory exists
  if (!fs.existsSync(schemaDir)) {
    console.error(`ERROR: Schema directory not found: ${schemaDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(indexPath)) {
    console.error(`ERROR: Schema index not found: ${indexPath}`);
    process.exit(1);
  }

  // Discover schema files from index.ts exports
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  const schemaFiles = discoverSchemaFiles(indexContent);

  if (schemaFiles.length === 0) {
    console.error('ERROR: No schema files discovered from index.ts');
    process.exit(1);
  }

  // Parse each schema file
  const tables: Record<string, TableSchema> = {};
  let parseErrors = 0;

  for (const file of schemaFiles) {
    const filePath = path.join(schemaDir, file);

    if (!fs.existsSync(filePath)) {
      console.error(`WARNING: Schema file not found: ${filePath}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsedTables = parseSchemaFile(content, file);

      for (const table of parsedTables) {
        // Skip excluded tables
        if (EXCLUDE_TABLES.includes(table.tableName)) {
          continue;
        }

        // Check for duplicate table definitions
        if (tables[table.tableName]) {
          console.error(
            `WARNING: Duplicate table definition for '${table.tableName}' ` +
              `in ${file} (already defined in ${tables[table.tableName].sourceFile})`
          );
        }

        tables[table.tableName] = table;
      }
    } catch (err) {
      const error = err as Error;
      console.error(`WARNING: Could not parse ${file}: ${error.message}`);
      parseErrors++;
    }
  }

  // Build output
  const output: ExpectedSchema = {
    generated_at: new Date().toISOString(),
    tables,
  };

  // Output JSON to stdout
  console.log(JSON.stringify(output, null, 2));

  // Exit with error if there were parse failures
  if (parseErrors > 0) {
    process.exit(1);
  }
}

main();
