/**
 * API Wiring Validation System - Configuration
 *
 * Defines scan scope, paths, patterns, and external inventory configuration.
 */

import * as path from 'path';
import type { ExternalInventoryConfig, ServerRouteAllowlistEntry } from './schema';

// =============================================================================
// Project Root
// =============================================================================

/**
 * Project root directory (resolved from this file's location)
 */
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

// =============================================================================
// Route Discovery Configuration
// =============================================================================

/**
 * Directories containing API routes (Next.js App Router and Pages Router)
 */
export const ROUTE_DIRS = [
  'frontend/src/app/api', // App Router API routes
  'frontend/src/pages/api', // Pages Router API routes (legacy, may be empty)
] as const;

/**
 * Directories containing Netlify functions
 */
export const NETLIFY_FUNCTION_DIRS = [
  'netlify/functions',
  'backend/netlify/functions',
] as const;

// =============================================================================
// Caller Scan Configuration
// =============================================================================

/**
 * Directories to scan for API callers
 */
export const CALLER_DIRS = [
  'frontend/src/components',
  'frontend/src/hooks',
  'frontend/src/lib',
  'frontend/src/pages',
  'frontend/src/app',
  'frontend/src/services',
] as const;

/**
 * Directories containing E2E tests
 */
export const E2E_DIRS = [
  'frontend/tests/e2e',
  'frontend/src/__tests__/e2e',
] as const;

/**
 * File extensions to scan
 */
export const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const;

// =============================================================================
// Exclusion Patterns
// =============================================================================

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

/**
 * Patterns to exclude from orphan reporting (allowlist)
 * These are known test files or dead code tracked elsewhere
 */
export const ORPHAN_EXCLUDE_PATTERNS = [
  // Test files (intentional orphans - they test routes that may not exist yet)
  /\/__tests__\/.*\.(spec|test)\.[tj]sx?$/,
  /\/tests\/e2e\/.*\.(spec|test)\.[tj]sx?$/,
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,

  // Known dead code (tracked in cleanup tasks)
  /\/useOnboardingRecovery\.ts$/,
  /\/useCrewAIState\.ts$/,

  // Legacy directories
  /\/legacy\//,

  // Mock files
  /\/__mocks__\//,
  /\/mocks\//,

  // API wrapper file - defines endpoints for features not yet implemented
  /\/services\/api\.ts$/,

  // Pages with Netlify function calls (Netlify functions not in scope)
  /\/pages\/ai-analysis\.tsx$/,
  /\/hooks\/useGateEvaluation\.ts$/,

  // Known orphan callers tracked for cleanup
  /\/components\/Dashboard\/MetricsPanel\.tsx$/,  // US-CP06: /api/metrics/tasks not implemented
  /\/pages\/client\/\[id\]\.tsx$/,                // Workflow trigger endpoints not implemented
] as const;

/**
 * Check if a file path should be excluded from orphan reporting
 */
export function isOrphanExcluded(filePath: string): boolean {
  return ORPHAN_EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

// =============================================================================
// Server-Side Route Allowlist
// =============================================================================

/**
 * Known server-side route-to-route calls (formal allowlist)
 * These are internal API calls that don't need external callers
 */
export const SERVER_ROUTE_ALLOWLIST: ServerRouteAllowlistEntry[] = [
  { from: 'vpc/[projectId]/route.ts', to: '/api/copy-bank/[projectId]' },
  { from: 'cron/sync-projects/route.ts', to: '/api/integrations/[type]/sync' },
  { from: 'assistant/chat/route.ts', to: '/api/analyze' },
];

/**
 * Check if a route call is in the server allowlist
 */
export function isInServerAllowlist(fromFile: string, toRoute: string): boolean {
  return SERVER_ROUTE_ALLOWLIST.some(
    (entry) => fromFile.endsWith(entry.from) && toRoute === entry.to
  );
}

// =============================================================================
// External URL Configuration
// =============================================================================

/**
 * Known external base URLs mapped to repository names
 */
export const EXTERNAL_BASE_URLS: Record<string, string> = {
  'https://startupai--crew.modal.run': 'startupai-crew',
  'https://startupai--crew-dev.modal.run': 'startupai-crew',
  'https://startupai.site': 'startupai.site',
  'https://www.startupai.site': 'startupai.site',
};

/**
 * Environment variables that may hold external base URLs
 * These are treated as dynamic unless resolved
 */
export const EXTERNAL_ENV_BASE_URLS = [
  'MODAL_BASE_URL',
  'NEXT_PUBLIC_MODAL_BASE_URL',
  'NEXT_PUBLIC_MARKETING_API_URL',
] as const;

// =============================================================================
// External Inventory Configuration
// =============================================================================

/**
 * External API inventories to load for cross-repo validation
 */
export const EXTERNAL_INVENTORIES: ExternalInventoryConfig[] = [
  {
    repo: 'startupai-crew',
    path: '../startupai-crew/docs/traceability/api-wiring/api-inventory.json',
    source_dir: '../startupai-crew/src/modal_app',
    required: true,
  },
  {
    repo: 'startupai.site',
    path: '../startupai.site/docs/traceability/api-wiring/api-inventory.json',
    source_dir: '../startupai.site/src/app/api',
    required: false, // Marketing site may not have API routes
  },
];

// =============================================================================
// Regex Patterns for Call Extraction
// =============================================================================

/**
 * Pattern to extract direct fetch calls to /api/* routes (single/double quotes only)
 * Matches: fetch('/api/...'), fetch("/api/...")
 */
export const FETCH_API_PATTERN = /fetch\s*\(\s*['"]\/api\/([^'"]+)['"]/g;

/**
 * Pattern to extract template literal fetch calls (backticks, may have variables)
 * Matches: fetch(`/api/projects`), fetch(`/api/projects/${id}`)
 */
export const FETCH_TEMPLATE_PATTERN = /fetch\s*\(\s*`\/api\/([^`]+)`/g;

/**
 * Pattern to extract API wrapper calls
 * Matches: api.get('/...'), api.post(`/...`)
 */
export const API_WRAPPER_PATTERN = /api\.(get|post|put|patch|delete)\s*\(\s*[`'"]([^`'"]+)[`'"]/gi;

/**
 * Pattern to extract Netlify function calls
 * Matches: fetch('/.netlify/functions/...')
 */
export const NETLIFY_FUNCTION_PATTERN = /fetch\s*\(\s*[`'"].*\.netlify\/functions\/([^`'"/?]+)/g;

/**
 * Pattern to extract external URL fetch calls
 * Matches: fetch('https://startupai--crew.modal.run/...')
 */
export const EXTERNAL_FETCH_PATTERN = /fetch\s*\(\s*[`'"](https?:\/\/[^`'"]+)[`'"]/g;

/**
 * Pattern to detect variable-based URLs (unresolvable)
 * Matches: fetch(`${baseUrl}/api/...`)
 */
export const VARIABLE_URL_PATTERN = /fetch\s*\(\s*`\$\{[^}]+\}/;

/**
 * Pattern to detect runtime function calls (unresolvable)
 * Matches: fetch(`/api/${getEndpoint()}`)
 */
export const RUNTIME_FUNCTION_PATTERN = /fetch\s*\(\s*`[^`]*\$\{[^}]+\(\)[^}]*\}/;

// =============================================================================
// E2E Mock Extraction Patterns
// =============================================================================

/**
 * Pattern to extract specific E2E route mocks
 * Matches: page.route('**\/api\/projects\/**', ...)
 */
export const E2E_SPECIFIC_MOCK_PATTERN = /page\.route\s*\(\s*[`'"]\*\*\/api\/([^*][^`'"]*)[`'"]/g;

/**
 * Pattern to detect wildcard E2E mocks
 * Matches: page.route('**\/api\/**', ...)
 */
export const E2E_WILDCARD_PATTERN = /page\.route\s*\(\s*[`'"]\*\*\/api\/\*\*[`'"]/g;

/**
 * Pattern to extract any E2E route mock
 * Matches: page.route('...', ...)
 */
export const E2E_ANY_MOCK_PATTERN = /page\.route\s*\(\s*[`'"]([^`'"]+)[`'"]/g;

// =============================================================================
// Route Path Extraction
// =============================================================================

/**
 * Pattern to extract HTTP method exports from route files
 * Matches: export async function GET, export const POST
 */
export const HTTP_METHOD_PATTERN = /export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/g;

/**
 * Pattern to match dynamic route segments
 * Matches: [id], [projectId], [...slug]
 */
export const DYNAMIC_SEGMENT_PATTERN = /\[([^\]]+)\]/g;

// =============================================================================
// Output Configuration
// =============================================================================

/**
 * Output directory for generated files
 */
export const OUTPUT_DIR = 'docs/traceability/api-wiring';

/**
 * Generated API inventory path (this repo)
 */
export const API_INVENTORY_PATH = path.join(OUTPUT_DIR, 'api-inventory.json');

/**
 * Generated API wiring map path
 */
export const API_WIRING_MAP_PATH = path.join(OUTPUT_DIR, 'api-wiring-map.json');

/**
 * Orphan report path
 */
export const ORPHAN_REPORT_PATH = path.join(OUTPUT_DIR, 'orphan-report.md');

/**
 * E2E coverage report path
 */
export const E2E_COVERAGE_REPORT_PATH = path.join(OUTPUT_DIR, 'e2e-coverage-report.md');

// =============================================================================
// Validation Thresholds
// =============================================================================

/**
 * Maximum number of skipped calls before warning
 */
export const MAX_SKIPPED_CALLS_WARNING = 10;

/**
 * Maximum number of Supabase tables for HIGH_FANOUT warning
 */
export const HIGH_FANOUT_THRESHOLD = 5;

// =============================================================================
// Generator Version
// =============================================================================

/**
 * Current generator version (for tracking in output)
 */
export const GENERATOR_VERSION = '1.0.0';
