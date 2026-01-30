#!/usr/bin/env tsx
/**
 * Unified Knowledge Index System - Validation
 *
 * Validates the knowledge index for completeness and correctness.
 * Run with: pnpm knowledge:validate
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PROJECT_ROOT,
  resolveRepoRoots,
  resolveAgentsRoot,
  KNOWLEDGE_INDEX_PATH,
  DOCS_REGISTRY_PATH,
  EXISTING_INDEX_PATHS,
} from './config';
import { validateAllDocs } from './doc-scanner';
import { loadTeamConfig, discoverAgents } from './agent-indexer';
import type { UnifiedKnowledgeIndex, ValidationResult, ValidationIssue } from './types';

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate the knowledge index exists and is well-formed
 */
function validateIndexStructure(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const indexPath = path.join(PROJECT_ROOT, KNOWLEDGE_INDEX_PATH);

  if (!fs.existsSync(indexPath)) {
    issues.push({
      type: 'error',
      message: 'Knowledge index not found',
      path: KNOWLEDGE_INDEX_PATH,
    });
    return issues;
  }

  try {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as UnifiedKnowledgeIndex;

    // Check metadata
    if (!index.metadata) {
      issues.push({ type: 'error', message: 'Missing metadata section' });
    } else {
      if (!index.metadata.generated_at) {
        issues.push({ type: 'warning', message: 'Missing generated_at timestamp' });
      }
      if (!index.metadata.version) {
        issues.push({ type: 'warning', message: 'Missing version' });
      }
      if (!index.metadata.checksums || Object.keys(index.metadata.checksums).length === 0) {
        issues.push({ type: 'warning', message: 'No checksums recorded for drift detection' });
      }
    }

    // Check indexes references
    if (!index.indexes) {
      issues.push({ type: 'error', message: 'Missing indexes section' });
    } else {
      for (const [name, relativePath] of Object.entries(index.indexes)) {
        const fullPath = path.join(PROJECT_ROOT, 'docs/traceability', relativePath);
        if (!fs.existsSync(fullPath)) {
          issues.push({
            type: 'error',
            message: `Referenced index not found: ${name}`,
            path: relativePath,
          });
        }
      }
    }

    // Check agent indexes
    if (!index.agent_indexes || Object.keys(index.agent_indexes).length === 0) {
      issues.push({ type: 'warning', message: 'No agent indexes generated' });
    }

    // Check navigation
    if (!index.navigation) {
      issues.push({ type: 'error', message: 'Missing navigation section' });
    } else {
      if (!index.navigation.by_topic || Object.keys(index.navigation.by_topic).length === 0) {
        issues.push({ type: 'warning', message: 'Empty topic navigation' });
      }
      if (!index.navigation.by_phase) {
        issues.push({ type: 'warning', message: 'Missing phase navigation' });
      }
      if (!index.navigation.by_agent || Object.keys(index.navigation.by_agent).length === 0) {
        issues.push({ type: 'warning', message: 'Empty agent navigation' });
      }
    }
  } catch (error) {
    issues.push({
      type: 'error',
      message: `Failed to parse index: ${error}`,
      path: KNOWLEDGE_INDEX_PATH,
    });
  }

  return issues;
}

/**
 * Validate docs registry coverage
 */
function validateDocsCoverage(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { results, summary } = validateAllDocs();

  if (summary.total === 0) {
    issues.push({
      type: 'error',
      message: 'No documents in registry',
      path: DOCS_REGISTRY_PATH,
    });
    return issues;
  }

  if (summary.missing > 0) {
    for (const result of results.filter((r) => !r.exists)) {
      issues.push({
        type: 'error',
        message: `Document not found: ${result.entry.repo}:${result.entry.path}`,
        path: result.absolutePath,
      });
    }
  }

  // Check for docs without topics
  for (const result of results) {
    if (result.exists && result.entry.topics.length === 0) {
      issues.push({
        type: 'warning',
        message: `Document has no topics: ${result.entry.repo}:${result.entry.path}`,
        path: result.entry.path,
      });
    }
  }

  return issues;
}

/**
 * Validate agent coverage
 */
function validateAgentCoverage(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const agentsRoot = resolveAgentsRoot();

  // Load team config
  const teamConfig = loadTeamConfig(agentsRoot);
  if (!teamConfig) {
    issues.push({
      type: 'warning',
      message: 'team-config.json not found',
      path: path.join(agentsRoot, 'teams/startupai/team-config.json'),
    });
    return issues;
  }

  // Get configured agents
  const configuredAgents = new Set(Object.keys(teamConfig.agents));

  // Get discovered agents
  const discoveredAgents = discoverAgents(agentsRoot);
  const discoveredAgentNames = new Set(discoveredAgents.map((a) => a.name));

  // Check for agents in config but not discovered
  for (const agentName of configuredAgents) {
    if (!discoveredAgentNames.has(agentName)) {
      issues.push({
        type: 'warning',
        message: `Agent in team-config but no context.md: ${agentName}`,
      });
    }
  }

  // Check for discovered agents not in config
  for (const agent of discoveredAgents) {
    if (!configuredAgents.has(agent.name)) {
      issues.push({
        type: 'warning',
        message: `Agent has context.md but not in team-config: ${agent.name}`,
      });
    }
  }

  // Load knowledge index to check agent indexes
  const indexPath = path.join(PROJECT_ROOT, KNOWLEDGE_INDEX_PATH);
  if (fs.existsSync(indexPath)) {
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as UnifiedKnowledgeIndex;
      const indexedAgents = new Set(Object.keys(index.agent_indexes || {}));

      // Check for configured agents not indexed
      for (const agentName of configuredAgents) {
        if (!indexedAgents.has(agentName)) {
          issues.push({
            type: 'warning',
            message: `Agent not indexed: ${agentName}`,
          });
        }
      }
    } catch {
      // Index parsing issues handled elsewhere
    }
  }

  return issues;
}

// =============================================================================
// Main Function
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isCI = args.includes('--ci');
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log('🔍 Validating knowledge index...\n');

  const allIssues: ValidationIssue[] = [];

  // Step 1: Validate index structure
  console.log('📦 Checking index structure...');
  const structureIssues = validateIndexStructure();
  allIssues.push(...structureIssues);
  console.log(`   ${structureIssues.filter((i) => i.type === 'error').length} errors, ${structureIssues.filter((i) => i.type === 'warning').length} warnings`);

  // Step 2: Validate docs coverage
  console.log('\n📖 Checking document coverage...');
  const docsIssues = validateDocsCoverage();
  allIssues.push(...docsIssues);
  console.log(`   ${docsIssues.filter((i) => i.type === 'error').length} errors, ${docsIssues.filter((i) => i.type === 'warning').length} warnings`);

  // Step 3: Validate agent coverage
  console.log('\n👥 Checking agent coverage...');
  const agentIssues = validateAgentCoverage();
  allIssues.push(...agentIssues);
  console.log(`   ${agentIssues.filter((i) => i.type === 'error').length} errors, ${agentIssues.filter((i) => i.type === 'warning').length} warnings`);

  // Summary
  const errors = allIssues.filter((i) => i.type === 'error');
  const warnings = allIssues.filter((i) => i.type === 'warning');

  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Summary');
  console.log('='.repeat(60));
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);

  // Show details if verbose or if there are issues
  if (verbose || errors.length > 0) {
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const issue of errors) {
        console.log(`   - ${issue.message}`);
        if (issue.path) {
          console.log(`     Path: ${issue.path}`);
        }
      }
    }
  }

  if (verbose && warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const issue of warnings) {
      console.log(`   - ${issue.message}`);
      if (issue.path) {
        console.log(`     Path: ${issue.path}`);
      }
    }
  }

  // Calculate stats
  const indexPath = path.join(PROJECT_ROOT, KNOWLEDGE_INDEX_PATH);
  if (fs.existsSync(indexPath)) {
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as UnifiedKnowledgeIndex;
      const registryPath = path.join(PROJECT_ROOT, DOCS_REGISTRY_PATH);
      const registry = fs.existsSync(registryPath)
        ? JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
        : [];

      const agentsRoot = resolveAgentsRoot();
      const discoveredAgents = discoverAgents(agentsRoot);

      console.log('\n📈 Statistics:');
      console.log(`   Total docs: ${registry.length}`);
      console.log(`   Indexed agents: ${Object.keys(index.agent_indexes || {}).length}/${discoveredAgents.length}`);
      console.log(`   Topics: ${Object.keys(index.navigation?.by_topic || {}).length}`);
      console.log(`   Checksums: ${Object.keys(index.metadata?.checksums || {}).length}`);
    } catch {
      // Stats couldn't be calculated
    }
  }

  console.log();

  // Exit with error if there are errors
  if (errors.length > 0) {
    if (isCI) {
      console.log('❌ Validation failed');
      process.exit(1);
    } else {
      console.log('⚠️  Validation completed with errors');
      console.log('   Run with --verbose for full details');
    }
  } else if (warnings.length > 0) {
    console.log('✅ Validation passed with warnings');
    if (!verbose) {
      console.log('   Run with --verbose for details');
    }
  } else {
    console.log('✅ Validation passed');
  }
}

// =============================================================================
// CLI Entry Point
// =============================================================================

main().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
