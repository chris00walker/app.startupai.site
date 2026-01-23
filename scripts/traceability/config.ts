/**
 * Story-Code Traceability System - Configuration
 *
 * Defines scan scope, paths, and patterns for the traceability generator.
 */

import * as path from 'path';

// =============================================================================
// Project Root
// =============================================================================

/**
 * Project root directory (resolved from this file's location)
 */
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

// =============================================================================
// Scan Configuration
// =============================================================================

/**
 * Directories to scan for @story annotations
 */
export const SCAN_DIRS = [
  'frontend/src', // All frontend source (components, app, pages, hooks, lib, etc.)
  'frontend/tests/e2e', // E2E tests
  'backend/netlify/functions', // Backend functions
  'netlify/functions', // Serverless functions
  '../startupai.site/src', // Marketing site (cross-repo)
  '../startupai-crew/src', // CrewAI backend (cross-repo)
] as const;

/**
 * File extensions to scan
 */
export const SCAN_EXTENSIONS = ['.ts', '.tsx', '.py'] as const;

/**
 * Directories to exclude from scanning
 */
export const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'venv',
  '__mocks__',
] as const;

// =============================================================================
// Story Source Configuration
// =============================================================================

/**
 * Story definition source files (markdown)
 */
export const STORY_SOURCES = [
  'docs/user-experience/stories/founder.md',
  'docs/user-experience/stories/consultant.md',
  'docs/user-experience/stories/trials.md',
  'docs/user-experience/stories/agent-journeys.md',
  'docs/user-experience/stories/platform.md',
  'docs/user-experience/stories/admin.md',
] as const;

/**
 * Story ID pattern for validation
 * Matches: US-F01, US-C07, US-FT01, US-CT05, US-H01, US-P04, US-AJ01, US-E06, US-A12, etc.
 */
export const STORY_ID_PATTERN = /^US-[A-Z]{1,3}\d{1,2}$/;

/**
 * Annotation pattern for parsing @story tags
 * Matches: @story US-F01, US-FT01 or @story US-H01
 */
export const ANNOTATION_PATTERN = /@story\s+(US-[A-Z]{1,3}\d{1,2}(?:\s*,\s*US-[A-Z]{1,3}\d{1,2})*)/g;

// =============================================================================
// Baseline Source Configuration
// =============================================================================

/**
 * Journey-test matrix path (baseline for test mappings)
 */
export const JOURNEY_TEST_MATRIX_PATH = 'docs/testing/journey-test-matrix.md';

/**
 * Feature inventory path (baseline for code hints)
 */
export const FEATURE_INVENTORY_PATH = 'docs/features/feature-inventory.md';

// =============================================================================
// Output Configuration
// =============================================================================

/**
 * Output directory for generated files
 */
export const OUTPUT_DIR = 'docs/traceability';

/**
 * Generated story-code-map path
 */
export const STORY_CODE_MAP_PATH = path.join(OUTPUT_DIR, 'story-code-map.json');

/**
 * Override file path (manual metadata)
 */
export const OVERRIDES_PATH = path.join(OUTPUT_DIR, 'story-code-overrides.yaml');

/**
 * Gap report path
 */
export const GAP_REPORT_PATH = path.join(OUTPUT_DIR, 'gap-report.md');

/**
 * Orphan report path
 */
export const ORPHAN_REPORT_PATH = path.join(OUTPUT_DIR, 'orphan-report.md');

// =============================================================================
// File Type Classification
// =============================================================================

/**
 * Patterns to classify file types based on path
 */
export const FILE_TYPE_PATTERNS = {
  component: [
    /^frontend\/src\/components\//,
    /^\.\.\/startupai\.site\/src\/components\//,
    /\.tsx$/,
  ],
  api_route: [
    /^frontend\/src\/app\/api\//,
    /^\.\.\/startupai\.site\/src\/app\/api\//,
    /route\.ts$/,
    /^backend\/netlify\/functions\//,
    /^netlify\/functions\//,
    /^\.\.\/startupai-crew\/src\/modal_app\//,
  ],
  page: [
    /^frontend\/src\/app\/.*\/page\.tsx$/,
    /^frontend\/src\/pages\//,
    /^\.\.\/startupai\.site\/src\/app\/.*\/page\.tsx$/,
    /^\.\.\/startupai\.site\/src\/pages\//,
  ],
  hook: [
    /^frontend\/src\/hooks\//,
    /^\.\.\/startupai\.site\/src\/hooks\//,
    /^use[A-Z]/,
  ],
  lib: [
    /^frontend\/src\/lib\//,
    /^\.\.\/startupai\.site\/src\/lib\//,
    /^\.\.\/startupai-crew\/src\//,
  ],
  e2e_test: [
    /^frontend\/tests\/e2e\//,
    /\.spec\.ts$/,
  ],
  unit_test: [
    /\.test\.tsx?$/,
    /__tests__\//,
  ],
} as const;

/**
 * Classify a file path into a file type
 */
export function classifyFileType(
  filePath: string
): 'component' | 'api_route' | 'page' | 'hook' | 'lib' | 'e2e_test' | 'unit_test' {
  // Check in priority order (most specific first)
  if (FILE_TYPE_PATTERNS.e2e_test.some((p) => p.test(filePath))) {
    return 'e2e_test';
  }
  if (FILE_TYPE_PATTERNS.unit_test.some((p) => p.test(filePath))) {
    return 'unit_test';
  }
  if (FILE_TYPE_PATTERNS.api_route.some((p) => p.test(filePath))) {
    return 'api_route';
  }
  if (FILE_TYPE_PATTERNS.page.some((p) => p.test(filePath))) {
    return 'page';
  }
  if (FILE_TYPE_PATTERNS.hook.some((p) => p.test(filePath))) {
    return 'hook';
  }
  if (FILE_TYPE_PATTERNS.lib.some((p) => p.test(filePath))) {
    return 'lib';
  }
  // Default: component
  return 'component';
}

// =============================================================================
// Story Category Patterns
// =============================================================================

/**
 * Story ID prefix to category mapping
 */
export const STORY_CATEGORIES: Record<string, string> = {
  'US-F': 'Founder',
  'US-C': 'Consultant',
  'US-FT': 'Founder Trial',
  'US-CT': 'Consultant Trial',
  'US-H': 'HITL Checkpoint',
  'US-P': 'Pivot Flow',
  'US-AJ': 'Agent Journey',
  'US-E': 'Edge Case',
  'US-AU': 'Authentication',
  'US-CP': 'Core Product',
  'US-A': 'Admin',
  'US-S': 'Support',
  'US-O': 'Offboarding',
  'US-B': 'Billing',
  'US-N': 'Notification',
  'US-AS': 'Account Settings',
  'US-MF': 'Marketing Funnel',
};

/**
 * Get category for a story ID
 */
export function getCategoryForStory(storyId: string): string {
  // Try longer prefixes first (US-AS before US-A)
  const prefixes = Object.keys(STORY_CATEGORIES).sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    if (storyId.startsWith(prefix)) {
      return STORY_CATEGORIES[prefix];
    }
  }
  return 'Unknown';
}

// =============================================================================
// Validation Rules
// =============================================================================

/**
 * Fields that are NOT allowed in overrides (must come from annotations)
 */
export const OVERRIDE_FORBIDDEN_FIELDS = [
  'components',
  'api_routes',
  'pages',
  'hooks',
  'lib',
  'e2e_tests',
  'unit_tests',
] as const;

/**
 * Fields that ARE allowed in overrides
 */
export const OVERRIDE_ALLOWED_FIELDS = [
  'db_tables',
  'notes',
  'implementation_status',
] as const;
