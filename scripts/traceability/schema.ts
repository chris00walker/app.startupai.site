/**
 * Story-Code Traceability System - TypeScript Schema
 *
 * This module defines the types for the story-code-map.json output.
 * The map provides bidirectional links between user stories and implementation files.
 */

// =============================================================================
// Story Entry Types
// =============================================================================

/**
 * Implementation status for a story
 */
export type ImplementationStatus =
  | 'complete' // All acceptance criteria implemented and tested
  | 'partial' // Some criteria implemented, others pending
  | 'planned' // Specification exists, implementation not started
  | 'gap'; // No implementation or specification

/**
 * E2E test reference with file and optional test name
 */
export interface E2ETestReference {
  file: string; // Relative path from frontend/tests/e2e/
  test_name?: string; // Specific test description (optional)
}

/**
 * Story entry in the story-code-map
 */
export interface StoryEntry {
  /** Story title from the markdown definition */
  title: string;

  /** React components implementing this story */
  components: string[];

  /** API route files implementing this story */
  api_routes: string[];

  /** Page files (app router or pages router) */
  pages: string[];

  /** Custom hooks used by this story */
  hooks: string[];

  /** Library/utility files */
  lib: string[];

  /** E2E test files covering this story */
  e2e_tests: E2ETestReference[];

  /** Unit test files covering this story */
  unit_tests: string[];

  /** Database tables this story reads/writes */
  db_tables: string[];

  /** Implementation status */
  implementation_status: ImplementationStatus;

  /** Optional notes (from overrides) */
  notes?: string;
}

// =============================================================================
// File Entry Types
// =============================================================================

/**
 * File entry for reverse lookup (file -> stories)
 */
export interface FileEntry {
  /** Story IDs this file implements */
  stories: string[];
}

// =============================================================================
// Story Code Map (Main Output)
// =============================================================================

/**
 * The complete story-code-map structure
 */
export interface StoryCodeMap {
  /** Metadata about the generated map */
  metadata: {
    /** When the map was generated */
    generated_at: string;
    /** Generator version */
    version: string;
    /** Total story count */
    story_count: number;
    /** Files with annotations */
    annotated_file_count: number;
  };

  /** Story ID -> StoryEntry mapping */
  stories: Record<string, StoryEntry>;

  /** File path -> FileEntry mapping (reverse index) */
  files: Record<string, FileEntry>;
}

// =============================================================================
// Override Types (Manual Input)
// =============================================================================

/**
 * Fields allowed in story-code-overrides.yaml
 * These are metadata that can't be expressed via code annotations
 */
export interface StoryOverride {
  /** Database tables (annotations can't express this) */
  db_tables?: string[];

  /** Notes about the story (e.g., ADR references) */
  notes?: string;

  /** Override implementation status */
  implementation_status?: ImplementationStatus;
}

/**
 * Override file structure
 */
export type StoryOverrides = Record<string, StoryOverride>;

// =============================================================================
// Parser Types (Internal)
// =============================================================================

/**
 * Parsed annotation from source code
 */
export interface ParsedAnnotation {
  /** File path (relative to project root) */
  file: string;

  /** Line number of the annotation */
  line: number;

  /** Story IDs found in the annotation */
  story_ids: string[];

  /** File type inferred from path */
  file_type: 'component' | 'api_route' | 'page' | 'hook' | 'lib' | 'e2e_test' | 'unit_test';
}

/**
 * Story definition parsed from markdown files
 */
export interface StoryDefinition {
  /** Story ID (e.g., US-F01) */
  id: string;

  /** Story title */
  title: string;

  /** Source file path */
  source_file: string;
}

// =============================================================================
// Report Types
// =============================================================================

/**
 * Gap report entry - stories without implementations
 */
export interface GapReportEntry {
  story_id: string;
  title: string;
  category: string;
  priority?: string;
}

/**
 * Orphan report entry - files without story links
 */
export interface OrphanReportEntry {
  file: string;
  file_type: string;
  recommendation: string;
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation result for a single item
 */
export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  file?: string;
  line?: number;
  story_id?: string;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    stories_with_annotations: number;
    stories_without_annotations: number;
    files_with_annotations: number;
    unknown_story_ids: number;
  };
}
