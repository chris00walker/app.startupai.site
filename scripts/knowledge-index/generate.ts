#!/usr/bin/env tsx
/**
 * Unified Knowledge Index System - Main Generator
 *
 * Generates the unified-knowledge-index.json by composing existing artifacts
 * and generating per-agent indexes.
 *
 * Run with: pnpm knowledge:generate
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PROJECT_ROOT,
  resolveRepoRoots,
  KNOWLEDGE_INDEX_PATH,
  DOCS_REGISTRY_PATH,
  EXISTING_INDEX_PATHS,
  INDEX_VERSION,
} from './config';
import { calculateFileChecksum, calculateChecksums } from './checksum';
import {
  loadDocsRegistry,
  validateAllDocs,
  buildTopicIndex,
  buildPhaseIndex,
} from './doc-scanner';
import { indexAllAgents } from './agent-indexer';
import type {
  UnifiedKnowledgeIndex,
  IndexMetadata,
  IndexReferences,
  NavigationGraph,
} from './types';

// =============================================================================
// Existing Index Loading
// =============================================================================

/**
 * Load an existing JSON index file
 */
function loadExistingIndex(relativePath: string): unknown {
  const fullPath = path.join(PROJECT_ROOT, 'docs/traceability', relativePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: Index not found: ${fullPath}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (error) {
    console.error(`Error loading ${fullPath}: ${error}`);
    return null;
  }
}

// =============================================================================
// Navigation Graph Building
// =============================================================================

/**
 * Build the navigation graph for ≤3 hop discovery
 */
function buildNavigationGraph(
  topicIndex: Record<string, string[]>,
  phaseIndex: Record<string, string[]>,
  agentIndexes: Record<string, { relevant_docs: string[]; relevant_apis: string[]; relevant_schemas: string[]; relevant_stories: string[] }>
): NavigationGraph {
  // Build by_agent from agent indexes
  const by_agent: Record<string, string[]> = {};

  for (const [agentName, index] of Object.entries(agentIndexes)) {
    by_agent[agentName] = [
      ...index.relevant_docs,
      ...index.relevant_apis.map((api) => `api:${api}`),
      ...index.relevant_schemas.map((schema) => `schema:${schema}`),
      ...index.relevant_stories.map((story) => `story:${story}`),
    ];
  }

  return {
    by_topic: topicIndex,
    by_phase: phaseIndex,
    by_agent,
  };
}

// =============================================================================
// CLI Arguments
// =============================================================================

const args = process.argv.slice(2);
const fullChecksums = args.includes('--full-checksums') || args.includes('--ci');

// =============================================================================
// Checksum Collection
// =============================================================================

/**
 * Default checksum limit for fast local generation.
 * Use --full-checksums or --ci for complete coverage.
 */
const DEFAULT_CHECKSUM_LIMIT = 50;

/**
 * Collect checksums for drift detection
 * @param full - If true, checksum all docs (slower but complete)
 */
function collectChecksums(
  docsRegistry: Array<{ repo: string; path: string }>,
  repoRoots: Record<string, string>,
  full: boolean = false
): Record<string, string> {
  const checksums: Record<string, string> = {};

  // Checksum the registry itself
  const registryPath = path.join(PROJECT_ROOT, DOCS_REGISTRY_PATH);
  if (fs.existsSync(registryPath)) {
    checksums[DOCS_REGISTRY_PATH] = calculateFileChecksum(registryPath);
  }

  // Checksum existing indexes
  for (const [name, relativePath] of Object.entries(EXISTING_INDEX_PATHS)) {
    const fullPath = path.join(PROJECT_ROOT, 'docs/traceability', relativePath);
    if (fs.existsSync(fullPath)) {
      checksums[`docs/traceability/${relativePath}`] = calculateFileChecksum(fullPath);
    }
  }

  // Checksum canonical docs
  // In full mode (CI), checksum all docs; otherwise limit for performance
  const docsToChecksum = full ? docsRegistry : docsRegistry.slice(0, DEFAULT_CHECKSUM_LIMIT);
  for (const entry of docsToChecksum) {
    const repoRoot = repoRoots[entry.repo as keyof typeof repoRoots];
    if (!repoRoot) continue;

    const fullPath = path.join(repoRoot, entry.path);
    if (fs.existsSync(fullPath)) {
      const key = `${entry.repo}:${entry.path}`;
      try {
        checksums[key] = calculateFileChecksum(fullPath);
      } catch {
        // Skip files that can't be read
      }
    }
  }

  return checksums;
}

// =============================================================================
// Main Generator
// =============================================================================

async function generate(): Promise<void> {
  console.log('🔄 Generating unified knowledge index...\n');

  // Step 1: Load and validate docs registry
  console.log('📖 Loading docs registry...');
  const docsRegistry = loadDocsRegistry();

  if (docsRegistry.length === 0) {
    console.error('❌ No docs found in registry. Run: pnpm knowledge:bootstrap');
    process.exit(1);
  }

  console.log(`   Found ${docsRegistry.length} documents`);

  // Step 2: Validate docs
  console.log('\n✅ Validating documents...');
  const { results: docResults, summary: docSummary } = validateAllDocs();
  console.log(`   Found: ${docSummary.found}/${docSummary.total}`);
  console.log(`   Missing: ${docSummary.missing}`);
  if (docSummary.missing > 0) {
    console.log('   Missing files:');
    for (const result of docResults.filter((r) => !r.exists)) {
      console.log(`      - ${result.entry.repo}:${result.entry.path}`);
    }
  }

  // Step 3: Build topic and phase indexes
  console.log('\n🏷️  Building topic index...');
  const repoRoots = resolveRepoRoots();
  const topicIndex = buildTopicIndex(docsRegistry, repoRoots);
  console.log(`   Topics indexed: ${Object.keys(topicIndex).length}`);

  console.log('\n📊 Building phase index...');
  const phaseIndex = buildPhaseIndex(docsRegistry);
  for (const [phase, docs] of Object.entries(phaseIndex)) {
    if (docs.length > 0) {
      console.log(`   ${phase}: ${docs.length} docs`);
    }
  }

  // Step 4: Load existing indexes (composition references)
  console.log('\n📦 Loading existing indexes...');
  const storyCodeMap = loadExistingIndex(EXISTING_INDEX_PATHS.stories);
  const apiInventory = loadExistingIndex(EXISTING_INDEX_PATHS.apis);
  const schemaCoverage = loadExistingIndex(EXISTING_INDEX_PATHS.schemas);

  if (storyCodeMap) {
    const storyCount = Object.keys((storyCodeMap as { stories?: object }).stories || {}).length;
    console.log(`   story-code-map: ${storyCount} stories`);
  }
  if (apiInventory) {
    const routeCount = ((apiInventory as { routes?: unknown[] }).routes || []).length;
    console.log(`   api-inventory: ${routeCount} routes`);
  }
  if (schemaCoverage) {
    const tableCount = ((schemaCoverage as { stats?: { tables_in_drizzle?: number } }).stats?.tables_in_drizzle) || 0;
    console.log(`   schema-coverage: ${tableCount} tables`);
  }

  // Step 5: Index agents
  console.log('\n👥 Indexing agents...');
  const agentResult = indexAllAgents(
    docsRegistry,
    topicIndex,
    storyCodeMap,
    apiInventory,
    schemaCoverage
  );
  console.log(`   Indexed: ${agentResult.summary.indexed_agents} agents`);
  if (agentResult.summary.context_pointers_added > 0) {
    console.log(`   Context pointers added: ${agentResult.summary.context_pointers_added}`);
  }

  // Step 6: Build navigation graph
  console.log('\n🗺️  Building navigation graph...');
  const navigation = buildNavigationGraph(
    topicIndex,
    phaseIndex,
    agentResult.agents
  );
  console.log(`   Topics: ${Object.keys(navigation.by_topic).length}`);
  console.log(`   Phases: ${Object.keys(navigation.by_phase).length}`);
  console.log(`   Agents: ${Object.keys(navigation.by_agent).length}`);

  // Step 7: Collect checksums
  console.log('\n🔐 Collecting checksums...');
  if (fullChecksums) {
    console.log('   Mode: full (all docs)');
  } else {
    console.log(`   Mode: fast (first ${DEFAULT_CHECKSUM_LIMIT} docs)`);
    console.log('   Use --full-checksums or --ci for complete coverage');
  }
  const checksums = collectChecksums(docsRegistry, repoRoots, fullChecksums);
  console.log(`   Files checksummed: ${Object.keys(checksums).length}`);

  // Step 8: Assemble unified index
  const metadata: IndexMetadata = {
    generated_at: new Date().toISOString(),
    version: INDEX_VERSION,
    checksums,
  };

  const indexes: IndexReferences = {
    docs_registry: `./${path.basename(DOCS_REGISTRY_PATH)}`,
    stories: EXISTING_INDEX_PATHS.stories,
    apis: EXISTING_INDEX_PATHS.apis,
    schemas: EXISTING_INDEX_PATHS.schemas,
  };

  const unifiedIndex: UnifiedKnowledgeIndex = {
    metadata,
    indexes,
    agent_indexes: agentResult.agents,
    navigation,
  };

  // Step 9: Write output
  const outputPath = path.join(PROJECT_ROOT, KNOWLEDGE_INDEX_PATH);
  fs.writeFileSync(outputPath, JSON.stringify(unifiedIndex, null, 2));
  console.log(`\n✅ Written: ${KNOWLEDGE_INDEX_PATH}`);

  // Summary
  console.log('\n📝 Generation complete!');
  console.log(`   Documents: ${docsRegistry.length}`);
  console.log(`   Agents: ${agentResult.summary.indexed_agents}`);
  console.log(`   Topics: ${Object.keys(topicIndex).length}`);
  console.log(`   Checksums: ${Object.keys(checksums).length}`);

  // Warn about missing files
  if (docSummary.missing > 0) {
    console.log(`\n⚠️  Warning: ${docSummary.missing} documents not found`);
    console.log('   Run: pnpm knowledge:validate for details');
  }
}

// =============================================================================
// CLI Entry Point
// =============================================================================

generate().catch((error) => {
  console.error('Generation failed:', error);
  process.exit(1);
});
