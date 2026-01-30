/**
 * Unified Knowledge Index System - Configuration
 *
 * Defines doc categories, repo roots, topic keywords, tool-API mappings,
 * and agent exclude patterns.
 */

import * as path from 'path';
import * as fs from 'fs';
import type { DocCategory, RepoRoots, RepoId, ToolApiMapping } from './types';

// =============================================================================
// Project Root
// =============================================================================

/**
 * Project root directory (resolved from this file's location)
 */
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

// =============================================================================
// Repo Root Resolution
// =============================================================================

/**
 * Resolve repo roots from:
 * 1. Environment variables (APP_REPO_ROOT, CREW_REPO_ROOT, MARKETING_REPO_ROOT)
 * 2. docs/traceability/repo-roots.json
 * 3. Relative paths from existing traceability config
 * 4. CWD fallback with warning
 */
export function resolveRepoRoots(): RepoRoots {
  // 1. Check environment variables
  const envRoots: Partial<RepoRoots> = {
    app: process.env.APP_REPO_ROOT,
    crew: process.env.CREW_REPO_ROOT,
    marketing: process.env.MARKETING_REPO_ROOT,
  };

  // 2. Check repo-roots.json
  const repoRootsPath = path.join(PROJECT_ROOT, 'docs/traceability/repo-roots.json');
  let fileRoots: Partial<RepoRoots> = {};
  if (fs.existsSync(repoRootsPath)) {
    try {
      fileRoots = JSON.parse(fs.readFileSync(repoRootsPath, 'utf-8'));
    } catch {
      console.warn(`Warning: Could not parse ${repoRootsPath}`);
    }
  }

  // 3. Default relative paths (from existing traceability config patterns)
  const defaultRoots: RepoRoots = {
    app: PROJECT_ROOT,
    crew: path.resolve(PROJECT_ROOT, '../startupai-crew'),
    marketing: path.resolve(PROJECT_ROOT, '../startupai.site'),
  };

  // Merge with priority: env > file > default
  const roots: RepoRoots = {
    app: envRoots.app || fileRoots.app || defaultRoots.app,
    crew: envRoots.crew || fileRoots.crew || defaultRoots.crew,
    marketing: envRoots.marketing || fileRoots.marketing || defaultRoots.marketing,
  };

  // 4. Validate and warn if using CWD fallback
  for (const [repo, root] of Object.entries(roots)) {
    if (!fs.existsSync(root)) {
      console.warn(`Warning: Repo root for '${repo}' does not exist: ${root}`);
    }
  }

  return roots;
}

// =============================================================================
// Agents Root Resolution
// =============================================================================

/**
 * Default agents root directory
 */
export const DEFAULT_AGENTS_ROOT = path.join(process.env.HOME || '~', '.claude');

/**
 * Resolve agents root from environment or default
 */
export function resolveAgentsRoot(): string {
  const agentsRoot = process.env.AGENTS_ROOT || DEFAULT_AGENTS_ROOT;

  if (!fs.existsSync(agentsRoot)) {
    console.warn(`Warning: Agents root does not exist: ${agentsRoot}`);
  }

  return agentsRoot;
}

// =============================================================================
// Document Category Configuration
// =============================================================================

/**
 * Document category definitions with patterns for auto-classification
 */
export const DOC_CATEGORY_PATTERNS: Record<DocCategory, RegExp[]> = {
  'master-arch': [
    /master-architecture\//,
    /architecture\//,
    /adr-\d+/i,
  ],
  spec: [
    /specs?\//,
    /specifications?\//,
    /technical\//,
  ],
  journey: [
    /user-experience\//,
    /journeys?\//,
    /stories?\//,
    /personas?\//,
  ],
  schema: [
    /schema/,
    /database/,
    /drizzle/,
    /migrations?\//,
  ],
  work: [
    /work\//,
    /backlog/,
    /in-progress/,
    /done\./,
    /roadmap/,
  ],
};

/**
 * Classify a document path into a category
 */
export function classifyDocCategory(docPath: string): DocCategory {
  for (const [category, patterns] of Object.entries(DOC_CATEGORY_PATTERNS)) {
    if (patterns.some((p) => p.test(docPath))) {
      return category as DocCategory;
    }
  }
  return 'spec'; // Default category
}

// =============================================================================
// Topic Keywords Configuration
// =============================================================================

/**
 * Topic keywords for document classification
 * Maps topic names to patterns for matching
 */
export const TOPIC_PATTERNS: Record<string, RegExp[]> = {
  // Core domains
  auth: [/auth/i, /login/i, /signup/i, /session/i, /rls/i],
  evidence: [/evidence/i, /proof/i, /validation/i],
  vpc: [/vpc/i, /value-proposition/i, /canvas/i],
  brief: [/brief/i, /entrepreneur/i, /onboarding/i],
  approval: [/approval/i, /hitl/i, /checkpoint/i],
  hypothesis: [/hypothesis/i, /hypotheses/i, /assumption/i],
  experiment: [/experiment/i, /test-card/i, /learning-card/i],

  // Phases
  'phase-0': [/phase.?0/i, /onboarding/i, /brief/i],
  'phase-1': [/phase.?1/i, /discovery/i],
  'phase-2': [/phase.?2/i, /desirability/i],
  'phase-3': [/phase.?3/i, /feasibility/i],
  'phase-4': [/phase.?4/i, /viability/i],

  // Technical
  api: [/api/i, /endpoint/i, /route/i],
  schema: [/schema/i, /database/i, /drizzle/i, /table/i],
  webhook: [/webhook/i, /callback/i],
  modal: [/modal/i, /serverless/i],
  crewai: [/crewai/i, /crew/i, /agent/i, /flow/i],
  supabase: [/supabase/i, /postgres/i, /realtime/i],
  netlify: [/netlify/i, /edge/i, /deploy/i],
  analytics: [/analytics/i, /posthog/i, /metrics/i, /dashboard/i],
  pgvector: [/pgvector/i, /embeddings?/i, /vector search/i, /semantic search/i],
  slos: [/\bslo\b/i, /\bslos\b/i, /\bsla\b/i, /service level/i],
  'observability-unified': [/observability/i, /monitoring/i, /telemetry/i, /metrics/i, /logging/i],

  // Testing
  testing: [/test/i, /spec/i, /e2e/i, /jest/i, /playwright/i],
  quality: [/quality/i, /lint/i, /coverage/i],

  // User types
  founder: [/founder/i, /entrepreneur/i],
  consultant: [/consultant/i, /advisor/i],
  admin: [/admin/i, /management/i],
};

/**
 * Extract topics from document content or path
 */
export function extractTopics(text: string): string[] {
  const topics: Set<string> = new Set();

  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    if (patterns.some((p) => p.test(text))) {
      topics.add(topic);
    }
  }

  return Array.from(topics);
}

// =============================================================================
// Tool-API Mapping Configuration
// =============================================================================

/**
 * Explicit mapping of tools to API routes
 * Used for agent indexing to connect tools to relevant APIs
 */
export const TOOL_API_MAP: ToolApiMapping[] = [
  // Read tools → general data access
  { tool: 'Read', apis: [] }, // Generic, no specific mapping

  // Bash tools → CLI operations
  { tool: 'Bash', apis: [] },

  // Task tools → task management (no API)
  { tool: 'TaskCreate', apis: [] },
  { tool: 'TaskUpdate', apis: [] },
  { tool: 'TaskList', apis: [] },

  // Supabase tools → database APIs
  { tool: 'supabase', apis: ['/api/admin', '/api/projects', '/api/evidence'] },

  // Modal tools → AI/workflow APIs
  { tool: 'modal', apis: ['/api/crewai', '/api/analyze'] },

  // Playwright tools → E2E testing
  { tool: 'playwright', apis: [] },
];

/**
 * Get APIs associated with a tool
 */
export function getApisForTool(tool: string): string[] {
  const mapping = TOOL_API_MAP.find((m) =>
    m.tool.toLowerCase() === tool.toLowerCase()
  );
  return mapping?.apis || [];
}

// =============================================================================
// Agent Exclude Patterns
// =============================================================================

/**
 * Patterns for excluding agents from indexing
 * Default excludes archived agents
 */
export const DEFAULT_AGENT_EXCLUDE_PATTERNS = ['**/archive/**'];

/**
 * Get agent exclude patterns from environment or default
 */
export function getAgentExcludePatterns(): string[] {
  const envPatterns = process.env.AGENT_EXCLUDE_PATTERNS;
  if (envPatterns) {
    return envPatterns.split(',').map((p) => p.trim());
  }
  return DEFAULT_AGENT_EXCLUDE_PATTERNS;
}

/**
 * Check if an agent path should be excluded
 */
export function isAgentExcluded(agentPath: string): boolean {
  const patterns = getAgentExcludePatterns();
  return patterns.some((pattern) => {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    return new RegExp(regexPattern).test(agentPath);
  });
}

// =============================================================================
// Output Configuration
// =============================================================================

/**
 * Output directory for generated files
 */
export const OUTPUT_DIR = 'docs/traceability';

/**
 * Unified knowledge index path
 */
export const KNOWLEDGE_INDEX_PATH = path.join(OUTPUT_DIR, 'unified-knowledge-index.json');

/**
 * Docs registry path
 */
export const DOCS_REGISTRY_PATH = path.join(OUTPUT_DIR, 'docs-registry.json');

/**
 * Repo roots config path
 */
export const REPO_ROOTS_PATH = path.join(OUTPUT_DIR, 'repo-roots.json');

/**
 * Agent indexes directory
 */
export const AGENT_INDEXES_DIR = path.join(OUTPUT_DIR, 'agent-indexes');

// =============================================================================
// Existing Index Paths (Composition References)
// =============================================================================

/**
 * Paths to existing traceability artifacts
 */
export const EXISTING_INDEX_PATHS = {
  stories: './story-code-map.json',
  apis: './api-wiring/api-inventory.json',
  schemas: './schema-coverage-report.json',
} as const;

// =============================================================================
// Document Scanning Configuration
// =============================================================================

/**
 * Document directories to scan per repo
 */
export const DOC_SCAN_DIRS: Record<RepoId, string[]> = {
  app: [
    'docs',
    'README.md',
    'CLAUDE.md',
  ],
  crew: [
    'docs',
    'README.md',
    'CLAUDE.md',
  ],
  marketing: [
    'docs',
    'README.md',
  ],
};

/**
 * File extensions to include in doc scanning
 */
export const DOC_EXTENSIONS = ['.md', '.mdx'] as const;

/**
 * Directories to exclude from doc scanning
 */
export const DOC_EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  'dist',
  '.git',
  'coverage',
  '__pycache__',
] as const;

// =============================================================================
// Version
// =============================================================================

/**
 * Current index version
 */
export const INDEX_VERSION = '1.0.0';
