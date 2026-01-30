/**
 * Unified Knowledge Index System - TypeScript Schema
 *
 * Defines the types for the unified-knowledge-index.json output.
 * The index provides ≤3 hop navigation to any authoritative source.
 */

// =============================================================================
// Registry Entry Types
// =============================================================================

/**
 * Document category classification
 */
export type DocCategory = 'master-arch' | 'spec' | 'journey' | 'schema' | 'work';

/**
 * Repository identifier
 */
export type RepoId = 'app' | 'crew' | 'marketing';

/**
 * Registry entry for a canonical document
 */
export interface DocRegistryEntry {
  /** Repository containing this document */
  repo: RepoId;

  /** Path relative to repo root */
  path: string;

  /** Document title */
  title: string;

  /** Document category */
  category: DocCategory;

  /** Topic keywords for navigation */
  topics: string[];

  /** Cross-references to other index entries */
  references?: {
    stories?: string[];    // US-XXX links
    schemas?: string[];    // Drizzle table names
    apis?: string[];       // API route paths
    agents?: string[];     // Agent names that reference this
  };

  /** Cross-repo connections for fast navigation (repo:path) */
  cross_repo_connections?: string[];
}

/**
 * Document frontmatter (optional, for validation)
 */
export interface DocFrontmatter {
  canonical?: boolean;
  category?: DocCategory;
  owner?: string;
  last_reviewed?: string;
}

// =============================================================================
// Index Composition Types
// =============================================================================

/**
 * References to existing traceability artifacts
 */
export interface IndexReferences {
  /** Canonical doc list + metadata */
  docs_registry: string;

  /** Story-code mapping (262 stories, 565 files) */
  stories: string;

  /** API wiring inventory (103 routes, 86 callers) */
  apis: string;

  /** Schema coverage report (45 tables) */
  schemas: string;
}

// =============================================================================
// Agent Index Types
// =============================================================================

/**
 * Per-agent index entry
 */
export interface AgentIndexEntry {
  /** Path to context.md file */
  generated_from: string;

  /** Doc paths relevant to this agent's domain */
  relevant_docs: string[];

  /** Schema tables relevant to this agent */
  relevant_schemas: string[];

  /** API routes relevant to this agent */
  relevant_apis: string[];

  /** User stories relevant to this agent */
  relevant_stories: string[];

  /** Skills this agent owns (from team-config.json) */
  skills: string[];
}

// =============================================================================
// Navigation Types
// =============================================================================

/**
 * Navigation graph for ≤3 hop discovery
 */
export interface NavigationGraph {
  /** Topic keyword → doc paths */
  by_topic: Record<string, string[]>;

  /** Phase (0-4) → resources */
  by_phase: Record<string, string[]>;

  /** Agent name → all resources */
  by_agent: Record<string, string[]>;
}

// =============================================================================
// Main Index Types
// =============================================================================

/**
 * Index metadata
 */
export interface IndexMetadata {
  /** When the index was generated */
  generated_at: string;

  /** Index version */
  version: string;

  /** File checksums for drift detection (path → checksum) */
  checksums: Record<string, string>;
}

/**
 * The complete unified knowledge index structure
 *
 * NOTE: This uses composition-only approach (no embedded docs map).
 * Consumers should follow `indexes.docs_registry` reference to get doc details.
 * This design choice avoids duplication and potential drift between sources.
 * (See plan Issue 9 for rationale)
 */
export interface UnifiedKnowledgeIndex {
  /** Index metadata */
  metadata: IndexMetadata;

  /** Composition references to existing artifacts (docs, stories, APIs, schemas) */
  indexes: IndexReferences;

  /** Per-agent indexes (generated from context.md + team-config.json) */
  agent_indexes: Record<string, AgentIndexEntry>;

  /** Navigation graph for ≤3 hop discovery */
  navigation: NavigationGraph;
}

// =============================================================================
// Config Types
// =============================================================================

/**
 * Repo root configuration
 */
export interface RepoRoots {
  app: string;
  crew: string;
  marketing: string;
}

/**
 * Tool to API mapping entry
 */
export interface ToolApiMapping {
  tool: string;
  apis: string[];
}

/**
 * Team config agent entry (from team-config.json)
 */
export interface TeamConfigAgent {
  type: 'teammate' | 'subagent';
  model: string;
  team: string;
  isLeader?: boolean;
  isEntryPoint?: boolean;
  contextFile: string;
  tools: string[];
  bashAllowed?: string[];
  skills?: string[];
  /** If true, agent is archived and should be skipped during indexing */
  archived?: boolean;
}

/**
 * Team config structure
 */
export interface TeamConfig {
  name: string;
  description: string;
  version: string;
  entryPoint: string;
  teams: Record<string, {
    name: string;
    leader: string;
    members: string[];
    responsibilities: string[];
  }>;
  agents: Record<string, TeamConfigAgent>;
}

// =============================================================================
// Drift Detection Types
// =============================================================================

/**
 * Drift detection result
 */
export interface DriftResult {
  /** Whether drift was detected */
  hasDrift: boolean;

  /** Files that have changed */
  changedFiles: string[];

  /** Files that are new (not in checksums) */
  newFiles: string[];

  /** Files that are missing (in checksums but not on disk) */
  missingFiles: string[];
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation issue
 */
export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  path?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    total_docs: number;
    indexed_docs: number;
    total_agents: number;
    indexed_agents: number;
    topics_count: number;
    phases_count: number;
  };
}
