#!/usr/bin/env tsx
/**
 * FK Type Consistency Checker CLI
 *
 * Validates that foreign key relationships in Drizzle schema have matching types.
 *
 * Usage:
 *   pnpm schema:fk           # Human-readable output
 *   pnpm schema:fk --json    # JSON output
 *   pnpm schema:fk --ci      # Exit code 1 if mismatches found
 *
 * @story US-A06
 */

import * as path from 'path';
import { analyzeFKConsistency, formatFKConsistencyReport } from './fk-consistency';

// =============================================================================
// Configuration
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SCHEMA_DIR = path.join(PROJECT_ROOT, 'frontend/src/db/schema');

// =============================================================================
// CLI
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const ciMode = args.includes('--ci');

  try {
    const report = analyzeFKConsistency(SCHEMA_DIR);

    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatFKConsistencyReport(report, PROJECT_ROOT));
    }

    // Exit with error code if mismatches found and in CI mode
    if (ciMode && report.type_mismatches.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('[fk-consistency] Error:', error);
    process.exit(1);
  }
}

main();
