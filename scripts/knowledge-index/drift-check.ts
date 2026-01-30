#!/usr/bin/env tsx
/**
 * Unified Knowledge Index System - Drift Detection
 *
 * Compares current file checksums against stored checksums to detect changes.
 * Run with: pnpm knowledge:drift
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PROJECT_ROOT,
  resolveRepoRoots,
  KNOWLEDGE_INDEX_PATH,
} from './config';
import { calculateFileChecksum, compareChecksums } from './checksum';
import type { UnifiedKnowledgeIndex, DriftResult } from './types';

// =============================================================================
// Index Loading
// =============================================================================

/**
 * Load the unified knowledge index
 */
function loadKnowledgeIndex(): UnifiedKnowledgeIndex | null {
  const indexPath = path.join(PROJECT_ROOT, KNOWLEDGE_INDEX_PATH);

  if (!fs.existsSync(indexPath)) {
    console.error(`❌ Knowledge index not found: ${KNOWLEDGE_INDEX_PATH}`);
    console.error('   Run: pnpm knowledge:generate first');
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as UnifiedKnowledgeIndex;
  } catch (error) {
    console.error(`Error loading index: ${error}`);
    return null;
  }
}

// =============================================================================
// Drift Detection
// =============================================================================

/**
 * Calculate current checksums for tracked files
 */
function calculateCurrentChecksums(
  storedChecksums: Record<string, string>
): Record<string, string> {
  const repoRoots = resolveRepoRoots();
  const currentChecksums: Record<string, string> = {};

  for (const key of Object.keys(storedChecksums)) {
    let fullPath: string;

    // Handle repo:path format
    if (key.includes(':')) {
      const [repo, relativePath] = key.split(':');
      const repoRoot = repoRoots[repo as keyof typeof repoRoots];
      if (!repoRoot) {
        continue;
      }
      fullPath = path.join(repoRoot, relativePath);
    } else {
      // Handle relative path format
      fullPath = path.join(PROJECT_ROOT, key);
    }

    if (fs.existsSync(fullPath)) {
      try {
        currentChecksums[key] = calculateFileChecksum(fullPath);
      } catch {
        // File couldn't be read, mark as missing
      }
    }
  }

  return currentChecksums;
}

/**
 * Detect drift between stored and current checksums
 */
function detectDrift(index: UnifiedKnowledgeIndex): DriftResult {
  const storedChecksums = index.metadata.checksums;
  const currentChecksums = calculateCurrentChecksums(storedChecksums);

  const { changed, added, removed } = compareChecksums(storedChecksums, currentChecksums);

  return {
    hasDrift: changed.length > 0 || added.length > 0 || removed.length > 0,
    changedFiles: changed,
    newFiles: added,
    missingFiles: removed,
  };
}

// =============================================================================
// Main Function
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isCI = args.includes('--ci');

  console.log('🔍 Checking for drift in knowledge index...\n');

  // Load index
  const index = loadKnowledgeIndex();
  if (!index) {
    process.exit(1);
  }

  // Show index info
  console.log(`📅 Index generated: ${index.metadata.generated_at}`);
  console.log(`📦 Version: ${index.metadata.version}`);
  console.log(`🔐 Tracked files: ${Object.keys(index.metadata.checksums).length}\n`);

  // Detect drift
  const drift = detectDrift(index);

  if (!drift.hasDrift) {
    console.log('✅ No drift detected - index is up to date\n');
    process.exit(0);
  }

  // Report drift
  console.log('⚠️  Drift detected!\n');

  if (drift.changedFiles.length > 0) {
    console.log(`📝 Changed files (${drift.changedFiles.length}):`);
    for (const file of drift.changedFiles) {
      console.log(`   - ${file}`);
    }
    console.log();
  }

  if (drift.newFiles.length > 0) {
    console.log(`➕ New files (${drift.newFiles.length}):`);
    for (const file of drift.newFiles) {
      console.log(`   - ${file}`);
    }
    console.log();
  }

  if (drift.missingFiles.length > 0) {
    console.log(`❌ Missing files (${drift.missingFiles.length}):`);
    for (const file of drift.missingFiles) {
      console.log(`   - ${file}`);
    }
    console.log();
  }

  console.log('💡 To update the index, run: pnpm knowledge:generate\n');

  // Exit with error in CI mode
  if (isCI) {
    console.log('❌ CI check failed - index is out of date');
    process.exit(1);
  }
}

// =============================================================================
// CLI Entry Point
// =============================================================================

main().catch((error) => {
  console.error('Drift check failed:', error);
  process.exit(1);
});
