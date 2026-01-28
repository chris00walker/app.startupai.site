#!/usr/bin/env tsx
/**
 * Schema Coverage Analyzer
 *
 * Static analysis tool that finds gaps between code table references
 * and Drizzle schema definitions.
 *
 * Usage:
 *   pnpm schema:coverage           # Human-readable output
 *   pnpm schema:coverage --json    # JSON output
 *   pnpm schema:coverage --ci      # Exit code 1 if missing tables found
 *
 * @story US-A06
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  parseDrizzleSchema,
  scanCodeForReferences,
  groupReferencesByTable,
  findMissingInDrizzle,
  findUnusedInCode,
} from './core';
import type { CoverageReport } from './types';

// =============================================================================
// Configuration
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SCHEMA_DIR = path.join(PROJECT_ROOT, 'frontend/src/db/schema');
const CODE_DIRS = [
  path.join(PROJECT_ROOT, 'frontend/src'),
  path.join(PROJECT_ROOT, 'backend/netlify/functions'),
  path.join(PROJECT_ROOT, 'netlify/functions'),
];

// Directories to exclude from scanning
const EXCLUDE_PATTERNS = [
  '__tests__',
  '*.test.ts',
  '*.test.tsx',
  '*.spec.ts',
  '*.spec.tsx',
  'db/schema',  // Don't scan schema definitions themselves
];

// Tables that are known to exist but not in Drizzle (e.g., Supabase system tables)
const KNOWN_EXTERNAL_TABLES = [
  // Add any known external tables here if needed
];

// =============================================================================
// Main Analysis
// =============================================================================

function runAnalysis(): CoverageReport {
  console.error('[schema-coverage] Parsing Drizzle schema...');
  const drizzleTables = parseDrizzleSchema(SCHEMA_DIR);
  console.error(`[schema-coverage] Found ${drizzleTables.length} tables in Drizzle schema`);

  console.error('[schema-coverage] Scanning code for table references...');
  const codeReferences = [];
  for (const dir of CODE_DIRS) {
    if (!fs.existsSync(dir)) {
      continue;
    }
    codeReferences.push(...scanCodeForReferences(dir, EXCLUDE_PATTERNS));
  }
  console.error(`[schema-coverage] Found ${codeReferences.length} table references in code`);

  const groupedReferences = groupReferencesByTable(codeReferences);
  console.error(`[schema-coverage] References span ${groupedReferences.size} unique tables`);

  // Filter out known external tables
  for (const tableName of KNOWN_EXTERNAL_TABLES) {
    groupedReferences.delete(tableName);
  }

  const missingInDrizzle = findMissingInDrizzle(groupedReferences, drizzleTables);
  const unusedInCode = findUnusedInCode(groupedReferences, drizzleTables);

  return {
    generated_at: new Date().toISOString(),
    missing_in_drizzle: missingInDrizzle,
    unused_in_code: unusedInCode,
    stats: {
      tables_in_drizzle: drizzleTables.length,
      tables_in_code: groupedReferences.size,
      missing_count: missingInDrizzle.length,
      unused_count: unusedInCode.length,
    },
  };
}

// =============================================================================
// Output Formatters
// =============================================================================

function formatHumanReadable(report: CoverageReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('Schema Coverage Report');
  lines.push('======================');
  lines.push(`Generated: ${report.generated_at}`);
  lines.push('');

  // Summary
  lines.push(`Tables in Drizzle schema: ${report.stats.tables_in_drizzle}`);
  lines.push(`Tables referenced in code: ${report.stats.tables_in_code}`);
  lines.push('');

  // Missing in Drizzle (ERRORS)
  if (report.missing_in_drizzle.length > 0) {
    lines.push('ERRORS - Tables referenced in code but NOT in Drizzle schema:');
    lines.push('─'.repeat(60));
    lines.push('');

    for (const missing of report.missing_in_drizzle) {
      lines.push(`  ❌ ${missing.tableName}`);
      lines.push(`     Referenced ${missing.references.length} time(s):`);

      // Show first 3 references
      const refsToShow = missing.references.slice(0, 3);
      for (const ref of refsToShow) {
        const relativePath = path.relative(PROJECT_ROOT, ref.filePath);
        lines.push(`       - ${relativePath}:${ref.lineNumber}`);
      }

      if (missing.references.length > 3) {
        lines.push(`       ... and ${missing.references.length - 3} more`);
      }
      lines.push('');
    }

    lines.push('');
    lines.push('These tables will cause runtime errors! Add them to Drizzle schema.');
    lines.push('');
  }

  // Unused in code (WARNINGS)
  if (report.unused_in_code.length > 0) {
    lines.push('WARNINGS - Tables in Drizzle but never referenced in code:');
    lines.push('─'.repeat(60));
    lines.push('');

    for (const unused of report.unused_in_code) {
      const relativePath = path.relative(PROJECT_ROOT, unused.drizzleFile);
      lines.push(`  ⚠️  ${unused.tableName}`);
      lines.push(`      Defined in: ${relativePath}`);
    }
    lines.push('');
    lines.push('These may be dead code or tables used by external systems.');
    lines.push('');
  }

  // Final status
  if (report.missing_in_drizzle.length === 0 && report.unused_in_code.length === 0) {
    lines.push('✅ PASS - All code references match Drizzle schema');
  } else if (report.missing_in_drizzle.length === 0) {
    lines.push('✅ PASS - No missing tables (warnings only)');
  } else {
    lines.push(`❌ FAIL - ${report.missing_in_drizzle.length} table(s) missing from Drizzle schema`);
  }

  lines.push('');
  return lines.join('\n');
}

// =============================================================================
// CLI
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const ciMode = args.includes('--ci');

  try {
    const report = runAnalysis();

    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatHumanReadable(report));
    }

    // Exit with error code if missing tables found and in CI mode
    if (ciMode && report.missing_in_drizzle.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('[schema-coverage] Error:', error);
    process.exit(1);
  }
}

main();
