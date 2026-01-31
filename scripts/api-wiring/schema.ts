/**
 * API Wiring Validation System - TypeScript Schema
 *
 * This module defines types for the api-wiring-map.json and api-inventory.json outputs.
 * The map provides bidirectional links between API routes and their callers.
 */

// =============================================================================
// API Inventory Schema (Cross-Repo)
// =============================================================================

/**
 * Supported schema versions (semver-like)
 * - MAJOR change (2.0) = breaking, requires validator update
 * - MINOR change (1.1) = additive, backward compatible
 */
export const SUPPORTED_SCHEMA_VERSIONS = ['1.0', '1.1'] as const;
export type SchemaVersion = (typeof SUPPORTED_SCHEMA_VERSIONS)[number];

/**
 * Route type classification
 */
export type RouteType = 'nextjs' | 'netlify' | 'modal' | 'static';

/**
 * Route definition in the API inventory
 */
export interface RouteDefinition {
  /** Route path (e.g., "/api/projects/[id]" or "/kickoff") */
  path: string;

  /** HTTP methods supported */
  methods: string[];

  /** Route type */
  type: RouteType;

  /** Base URL for external routes (e.g., "https://startupai--crew.modal.run") */
  base_url?: string;

  /** Optional documentation */
  description?: string;
}

/**
 * API inventory structure (generated per-repo, committed)
 */
export interface APIInventory {
  /** Schema version for compatibility checking */
  schema_version: SchemaVersion;

  /** Repository identifier */
  repo: string;

  /** ISO timestamp of generation (optional - git history provides this) */
  generated_at?: string;

  /** Route definitions */
  routes: RouteDefinition[];
}

// =============================================================================
// Caller Reference Types
// =============================================================================

/**
 * Call style classification
 */
export type CallStyle = 'fetch' | 'api_wrapper' | 'netlify' | 'external';

/**
 * Reference to a caller location
 */
export interface CallerReference {
  /** File path (relative to project root) */
  file: string;

  /** Line number of the call */
  line: number;

  /** Surrounding code context */
  context: string;

  /** How the call was made */
  call_style: CallStyle;
}

/**
 * Skipped call that couldn't be statically resolved
 */
export interface SkippedCall {
  /** File path */
  file: string;

  /** Line number */
  line: number;

  /** Raw call text */
  raw: string;

  /** Why it was skipped */
  reason: 'variable_prefix' | 'runtime_function' | 'complex_expression' | 'external_unresolved';
}

// =============================================================================
// Route Entry Types
// =============================================================================

/**
 * Outbound dependencies from a route
 */
export interface OutboundDependencies {
  /** Supabase tables accessed */
  supabase_tables: string[];

  /** Modal endpoints called */
  modal_endpoints: string[];

  /** Other API routes called */
  api_routes: string[];
}

/**
 * E2E test mock reference
 */
export interface MockReference {
  /** Test file path */
  file: string;

  /** Line number of the mock */
  line: number;

  /** Mock pattern (e.g., "**\/api\/projects\/**") */
  pattern: string;

  /** Whether this is a wildcard mock */
  is_wildcard: boolean;
}

/**
 * Route entry in the wiring map
 */
export interface RouteEntry {
  /** Route path */
  path: string;

  /** HTTP methods */
  methods: string[];

  /** Route type */
  type: RouteType;

  /** Source file path */
  source_file: string;

  /** Files that call this route */
  callers: CallerReference[];

  /** Outbound dependencies */
  outbound: OutboundDependencies;

  /** E2E test coverage */
  e2e_coverage: MockReference[];

  /** Story IDs from annotations */
  stories: string[];
}

/**
 * Netlify function entry
 */
export interface NetlifyFunctionEntry {
  /** Function name */
  name: string;

  /** Source file path */
  source_file: string;

  /** Files that call this function */
  callers: CallerReference[];

  /** Outbound dependencies */
  outbound: OutboundDependencies;
}

// =============================================================================
// Orphan Types
// =============================================================================

/**
 * Orphan classification
 */
export type OrphanClassification =
  | 'dead_code' // Route exists but no callers (may need cleanup)
  | 'test_only' // Only called from test files
  | 'external_caller' // May be called from external sources (webhooks, etc.)
  | 'unknown'; // Caller exists but route doesn't

/**
 * Orphan call entry
 */
export interface OrphanEntry {
  /** Called route path */
  route: string;

  /** Callers referencing this route */
  callers: CallerReference[];

  /** Classification */
  classification: OrphanClassification;

  /** Actionable recommendation */
  recommendation: string;

  /** Whether this is excluded from CI errors */
  excluded: boolean;
}

// =============================================================================
// E2E Coverage Types
// =============================================================================

/**
 * E2E gap entry
 */
export interface E2EGap {
  /** Specific mocks that don't match any route */
  specific: MockReference[];

  /** Wildcard patterns (informational) */
  wildcards: string[];
}

// =============================================================================
// External Inventory Types
// =============================================================================

/**
 * External inventory source configuration
 */
export interface ExternalInventoryConfig {
  /** Repository name */
  repo: string;

  /** Path to inventory file (relative to project root) */
  path: string;

  /** Source directory for freshness check (optional) */
  source_dir?: string;

  /** Whether this inventory is required (ecosystem mode) */
  required?: boolean;
}

/**
 * Merged route from multiple inventories
 */
export interface MergedRoute {
  /** Route path */
  path: string;

  /** HTTP methods */
  methods: string[];

  /** Route type */
  type: RouteType;

  /** Source repository */
  repo: string;

  /** Base URL for external routes */
  base_url?: string;
}

/**
 * Normalized external call
 */
export interface NormalizedExternalCall {
  /** Target repository */
  repo: string;

  /** Route path */
  route: string;

  /** Original URL */
  original_url: string;
}

// =============================================================================
// API Wiring Map (Main Output)
// =============================================================================

/**
 * Map metadata
 */
export interface APIWiringMapMetadata {
  /** ISO timestamp of generation */
  generated_at: string;

  /** Generator version */
  version: string;

  /** Total route count (local) */
  route_count: number;

  /** Total caller count */
  caller_count: number;

  /** Skipped calls count */
  skipped_count: number;

  /** Orphan count (non-excluded) */
  orphan_count: number;

  /** External inventories loaded */
  external_inventories: Array<{
    repo: string;
    route_count: number;
    status: 'loaded' | 'missing' | 'stale' | 'invalid';
  }>;
}

/**
 * The complete API wiring map structure
 */
export interface APIWiringMap {
  /** Map metadata */
  metadata: APIWiringMapMetadata;

  /** Route path -> RouteEntry mapping */
  routes: Record<string, RouteEntry>;

  /** Netlify function name -> FunctionEntry mapping */
  netlify_functions: Record<string, NetlifyFunctionEntry>;

  /** Orphan calls (non-matching callers) */
  orphans: OrphanEntry[];

  /** Skipped calls (couldn't be resolved) */
  skipped_calls: SkippedCall[];

  /** E2E coverage gaps */
  e2e_gaps: E2EGap;
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation issue severity
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue codes
 */
export type ValidationCode =
  | 'ORPHAN_CALL'
  | 'INVENTORY_MISSING'
  | 'INVENTORY_MISSING_LOCAL'
  | 'INVENTORY_STALE'
  | 'INVENTORY_SCHEMA_MISMATCH'
  | 'EXCLUDED_ORPHAN'
  | 'SKIPPED_CALLS'
  | 'E2E_SPECIFIC_GAP'
  | 'STALE_MAP'
  | 'ROUTE_REGRESSION'
  | 'EXTERNAL_MATCH'
  | 'HIGH_FANOUT'
  | 'E2E_WILDCARD';

/**
 * Validation issue
 */
export interface ValidationIssue {
  /** Issue severity */
  severity: ValidationSeverity;

  /** Issue code */
  code: ValidationCode;

  /** Human-readable message */
  message: string;

  /** File path (if applicable) */
  file?: string;

  /** Line number (if applicable) */
  line?: number;

  /** Repository (for external inventory issues) */
  repo?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed (no errors) */
  valid: boolean;

  /** All issues found */
  issues: ValidationIssue[];

  /** Summary statistics */
  stats: {
    routes_validated: number;
    callers_validated: number;
    orphans_found: number;
    orphans_excluded: number;
    external_inventories_loaded: number;
    external_inventories_missing: number;
  };
}

// =============================================================================
// Inventory Freshness Types
// =============================================================================

/**
 * Inventory freshness check result
 */
export interface FreshnessCheckResult {
  /** Repository name */
  repo: string;

  /** Whether inventory file exists */
  exists: boolean;

  /** Whether inventory is fresh (mtime vs sources) */
  fresh: boolean;

  /** Inventory modification time */
  inventory_mtime?: Date;

  /** Latest source modification time */
  source_mtime?: Date;

  /** Schema version in inventory */
  schema_version?: string;

  /** Whether schema version is compatible */
  schema_compatible?: boolean;
}

// =============================================================================
// Call Extraction Types
// =============================================================================

/**
 * Result of extracting a call from source code
 */
export type CallExtractionResult =
  | { type: 'resolved'; path: string; style: CallStyle; line: number; context: string }
  | { type: 'skipped'; reason: SkippedCall['reason']; raw: string; line: number };

/**
 * Result of extracting an E2E mock
 */
export interface MockExtractionResult {
  /** Mock pattern */
  pattern: string;

  /** Normalized route path (null for pure wildcards) */
  normalized_path: string | null;

  /** Line number */
  line: number;

  /** Whether this is a wildcard */
  is_wildcard: boolean;
}

// =============================================================================
// Server Route Allowlist Types
// =============================================================================

/**
 * Server-side route-to-route call allowlist entry
 */
export interface ServerRouteAllowlistEntry {
  /** Source route file (relative path suffix) */
  from: string;

  /** Target route path */
  to: string;
}
