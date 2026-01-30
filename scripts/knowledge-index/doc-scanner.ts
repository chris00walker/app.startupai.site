/**
 * Unified Knowledge Index System - Document Scanner
 *
 * Scans canonical docs from docs-registry.json and validates their existence.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PROJECT_ROOT,
  resolveRepoRoots,
  DOCS_REGISTRY_PATH,
  extractTopics,
} from './config';
import type { DocRegistryEntry, RepoId, DocFrontmatter } from './types';

// =============================================================================
// Frontmatter Parsing
// =============================================================================

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseFrontmatter(content: string): DocFrontmatter | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    return null;
  }

  const yaml = match[1];
  const frontmatter: DocFrontmatter = {};

  // Simple YAML parsing for expected fields
  const canonicalMatch = yaml.match(/canonical:\s*(true|false)/);
  if (canonicalMatch) {
    frontmatter.canonical = canonicalMatch[1] === 'true';
  }

  const categoryMatch = yaml.match(/category:\s*(\S+)/);
  if (categoryMatch) {
    frontmatter.category = categoryMatch[1] as DocFrontmatter['category'];
  }

  const ownerMatch = yaml.match(/owner:\s*(.+)/);
  if (ownerMatch) {
    frontmatter.owner = ownerMatch[1].trim();
  }

  const reviewedMatch = yaml.match(/last_reviewed:\s*(\d{4}-\d{2}-\d{2})/);
  if (reviewedMatch) {
    frontmatter.last_reviewed = reviewedMatch[1];
  }

  return frontmatter;
}

// =============================================================================
// Registry Loading
// =============================================================================

/**
 * Load docs registry from JSON file
 */
export function loadDocsRegistry(): DocRegistryEntry[] {
  const registryPath = path.join(PROJECT_ROOT, DOCS_REGISTRY_PATH);

  if (!fs.existsSync(registryPath)) {
    console.warn(`Warning: Docs registry not found at ${registryPath}`);
    console.warn('Run: pnpm knowledge:bootstrap to create it');
    return [];
  }

  try {
    const content = fs.readFileSync(registryPath, 'utf-8');
    return JSON.parse(content) as DocRegistryEntry[];
  } catch (error) {
    console.error(`Error loading docs registry: ${error}`);
    return [];
  }
}

// =============================================================================
// Document Validation
// =============================================================================

export interface DocValidationResult {
  entry: DocRegistryEntry;
  exists: boolean;
  absolutePath: string;
  frontmatter: DocFrontmatter | null;
  warnings: string[];
}

/**
 * Validate a single doc entry
 */
export function validateDocEntry(
  entry: DocRegistryEntry,
  repoRoots: Record<RepoId, string>
): DocValidationResult {
  const repoRoot = repoRoots[entry.repo];
  const absolutePath = path.join(repoRoot, entry.path);
  const warnings: string[] = [];

  // Check if file exists
  const exists = fs.existsSync(absolutePath);
  if (!exists) {
    warnings.push(`File not found: ${absolutePath}`);
    return {
      entry,
      exists,
      absolutePath,
      frontmatter: null,
      warnings,
    };
  }

  // Read and parse frontmatter
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const frontmatter = parseFrontmatter(content);

  // Validate frontmatter if present
  if (frontmatter) {
    if (frontmatter.category && frontmatter.category !== entry.category) {
      warnings.push(
        `Category mismatch: registry says '${entry.category}', frontmatter says '${frontmatter.category}'`
      );
    }
  } else {
    // Frontmatter is optional, just note it
    warnings.push('No frontmatter found (optional)');
  }

  return {
    entry,
    exists,
    absolutePath,
    frontmatter,
    warnings,
  };
}

/**
 * Validate all docs in registry
 */
export function validateAllDocs(): {
  results: DocValidationResult[];
  summary: {
    total: number;
    found: number;
    missing: number;
    withFrontmatter: number;
    withWarnings: number;
  };
} {
  const registry = loadDocsRegistry();
  const repoRoots = resolveRepoRoots();

  const results: DocValidationResult[] = [];

  for (const entry of registry) {
    results.push(validateDocEntry(entry, repoRoots));
  }

  const summary = {
    total: results.length,
    found: results.filter((r) => r.exists).length,
    missing: results.filter((r) => !r.exists).length,
    withFrontmatter: results.filter((r) => r.frontmatter !== null).length,
    withWarnings: results.filter((r) => r.warnings.length > 0).length,
  };

  return { results, summary };
}

// =============================================================================
// Enhanced Topic Extraction
// =============================================================================

/**
 * Extract topics from a document file
 */
export function extractDocTopics(absolutePath: string): string[] {
  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const relativePath = path.basename(absolutePath);

  return extractTopics(content + ' ' + relativePath);
}

/**
 * Build topic index from all docs
 */
export function buildTopicIndex(
  registry: DocRegistryEntry[],
  repoRoots: Record<RepoId, string>
): Record<string, string[]> {
  const topicIndex: Record<string, string[]> = {};

  for (const entry of registry) {
    const repoRoot = repoRoots[entry.repo];
    const absolutePath = path.join(repoRoot, entry.path);

    // Use topics from registry
    for (const topic of entry.topics) {
      if (!topicIndex[topic]) {
        topicIndex[topic] = [];
      }
      // Use repo:path format for cross-repo support
      const docKey = `${entry.repo}:${entry.path}`;
      if (!topicIndex[topic].includes(docKey)) {
        topicIndex[topic].push(docKey);
      }
    }

    // Also extract topics from content if file exists
    if (fs.existsSync(absolutePath)) {
      const contentTopics = extractDocTopics(absolutePath);
      for (const topic of contentTopics) {
        if (!topicIndex[topic]) {
          topicIndex[topic] = [];
        }
        const docKey = `${entry.repo}:${entry.path}`;
        if (!topicIndex[topic].includes(docKey)) {
          topicIndex[topic].push(docKey);
        }
      }
    }
  }

  return topicIndex;
}

// =============================================================================
// Phase Index Building
// =============================================================================

/**
 * Build phase index from docs
 */
export function buildPhaseIndex(
  registry: DocRegistryEntry[]
): Record<string, string[]> {
  const phaseIndex: Record<string, string[]> = {
    'phase-0': [],
    'phase-1': [],
    'phase-2': [],
    'phase-3': [],
    'phase-4': [],
  };

  for (const entry of registry) {
    const docKey = `${entry.repo}:${entry.path}`;

    // Check topics for phase references
    for (const topic of entry.topics) {
      if (topic.startsWith('phase-')) {
        if (!phaseIndex[topic]) {
          phaseIndex[topic] = [];
        }
        if (!phaseIndex[topic].includes(docKey)) {
          phaseIndex[topic].push(docKey);
        }
      }
    }

    // Also check path and title for phase references
    const pathAndTitle = `${entry.path} ${entry.title}`.toLowerCase();
    for (let i = 0; i <= 4; i++) {
      const phaseKey = `phase-${i}`;
      if (
        pathAndTitle.includes(`phase ${i}`) ||
        pathAndTitle.includes(`phase-${i}`) ||
        pathAndTitle.includes(`phase_${i}`)
      ) {
        if (!phaseIndex[phaseKey].includes(docKey)) {
          phaseIndex[phaseKey].push(docKey);
        }
      }
    }
  }

  return phaseIndex;
}
