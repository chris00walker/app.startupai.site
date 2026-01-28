/**
 * API Wiring Validation System - Core Functions
 *
 * Pure functions for route extraction, call extraction, reconciliation,
 * and inventory merging.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  DYNAMIC_SEGMENT_PATTERN,
  HTTP_METHOD_PATTERN,
  FETCH_API_PATTERN,
  FETCH_TEMPLATE_PATTERN,
  API_WRAPPER_PATTERN,
  NETLIFY_FUNCTION_PATTERN,
  EXTERNAL_FETCH_PATTERN,
  VARIABLE_URL_PATTERN,
  RUNTIME_FUNCTION_PATTERN,
  E2E_ANY_MOCK_PATTERN,
  E2E_WILDCARD_PATTERN,
  EXTERNAL_BASE_URLS,
  EXTERNAL_ENV_BASE_URLS,
  isOrphanExcluded,
  isInServerAllowlist,
  HIGH_FANOUT_THRESHOLD,
  SUPPORTED_SCHEMA_VERSIONS,
} from './config';
import type {
  RouteDefinition,
  RouteType,
  APIInventory,
  CallStyle,
  CallerReference,
  SkippedCall,
  CallExtractionResult,
  MockExtractionResult,
  MergedRoute,
  NormalizedExternalCall,
  OrphanClassification,
  RouteEntry,
  OutboundDependencies,
  SchemaVersion,
  FreshnessCheckResult,
} from './schema';
import { SUPPORTED_SCHEMA_VERSIONS as SCHEMA_VERSIONS } from './schema';

// =============================================================================
// Route Path Extraction
// =============================================================================

/**
 * Extract route path from a file path
 * e.g., frontend/src/app/api/projects/[id]/route.ts -> /api/projects/[id]
 */
export function extractRoutePath(filePath: string): string | null {
  // App Router: frontend/src/app/api/.../route.ts
  const appRouterMatch = filePath.match(/frontend\/src\/app\/api\/(.+)\/route\.[tj]s$/);
  if (appRouterMatch) {
    return `/api/${appRouterMatch[1]}`;
  }

  // Pages Router: frontend/src/pages/api/...
  const pagesRouterMatch = filePath.match(/frontend\/src\/pages\/api\/(.+)\.[tj]s$/);
  if (pagesRouterMatch) {
    // Remove index from path
    const routePath = pagesRouterMatch[1].replace(/\/index$/, '');
    return `/api/${routePath}`;
  }

  return null;
}

/**
 * Extract HTTP methods from route file content
 */
export function extractHttpMethods(content: string): string[] {
  const methods: string[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  HTTP_METHOD_PATTERN.lastIndex = 0;

  while ((match = HTTP_METHOD_PATTERN.exec(content)) !== null) {
    methods.push(match[1].toUpperCase());
  }

  // Default to GET if no methods found (static routes)
  return methods.length > 0 ? [...new Set(methods)] : ['GET'];
}

/**
 * Extract Netlify function name from file path
 * e.g., netlify/functions/crew-analyze.ts -> crew-analyze
 */
export function extractNetlifyFunction(filePath: string): string | null {
  const match = filePath.match(/(?:netlify|backend\/netlify)\/functions\/([^/]+)\.[tj]s$/);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Determine route type from file path
 */
export function determineRouteType(filePath: string): RouteType {
  if (filePath.includes('/netlify/functions/')) {
    return 'netlify';
  }
  if (filePath.includes('/pages/api/') || filePath.includes('/app/api/')) {
    return 'nextjs';
  }
  return 'static';
}

// =============================================================================
// Call Extraction
// =============================================================================

/**
 * Extract API calls from source code content
 */
export function extractApiCalls(
  content: string,
  filePath: string
): CallExtractionResult[] {
  const results: CallExtractionResult[] = [];
  const lines = content.split('\n');

  // Track which lines we've already processed to avoid duplicates
  const processedLines = new Set<number>();

  // Helper to get line number from character index
  const getLineNumber = (index: number): number => {
    let line = 1;
    for (let i = 0; i < index && i < content.length; i++) {
      if (content[i] === '\n') line++;
    }
    return line;
  };

  // Helper to get context around a match
  const getContext = (lineNum: number): string => {
    const start = Math.max(0, lineNum - 2);
    const end = Math.min(lines.length, lineNum + 1);
    return lines.slice(start, end).join('\n').trim().slice(0, 200);
  };

  // Check for unresolvable patterns first
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip if already processed
    if (processedLines.has(lineNum)) continue;

    // Check for variable-based URLs
    if (VARIABLE_URL_PATTERN.test(line)) {
      const fetchMatch = line.match(/fetch\s*\(\s*`([^`]+)`/);
      if (fetchMatch) {
        const hasExternalEnv = EXTERNAL_ENV_BASE_URLS.some((env) =>
          fetchMatch[1].includes(env)
        );
        results.push({
          type: 'skipped',
          reason: hasExternalEnv ? 'external_unresolved' : 'variable_prefix',
          raw: fetchMatch[1],
          line: lineNum,
        });
        processedLines.add(lineNum);
        continue;
      }
    }

    // Check for runtime function calls
    if (RUNTIME_FUNCTION_PATTERN.test(line)) {
      const fetchMatch = line.match(/fetch\s*\(\s*`([^`]+)`/);
      if (fetchMatch) {
        results.push({
          type: 'skipped',
          reason: 'runtime_function',
          raw: fetchMatch[1],
          line: lineNum,
        });
        processedLines.add(lineNum);
        continue;
      }
    }
  }

  // Extract direct fetch calls: fetch('/api/...')
  FETCH_API_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = FETCH_API_PATTERN.exec(content)) !== null) {
    const lineNum = getLineNumber(match.index);
    if (processedLines.has(lineNum)) continue;
    processedLines.add(lineNum);

    const apiPath = normalizePath(`/api/${match[1]}`);
    results.push({
      type: 'resolved',
      path: apiPath,
      style: 'fetch',
      line: lineNum,
      context: getContext(lineNum),
    });
  }

  // Extract template literal fetch calls: fetch(`/api/projects/${id}`)
  FETCH_TEMPLATE_PATTERN.lastIndex = 0;

  while ((match = FETCH_TEMPLATE_PATTERN.exec(content)) !== null) {
    const lineNum = getLineNumber(match.index);
    if (processedLines.has(lineNum)) continue;

    // Check if it has runtime function calls (already handled above)
    if (match[1].includes('${') && match[1].match(/\$\{[^}]+\(\)/)) {
      continue;
    }

    processedLines.add(lineNum);

    // Normalize template variables to [param]
    const apiPath = normalizeTemplatePath(`/api/${match[1]}`);
    results.push({
      type: 'resolved',
      path: apiPath,
      style: 'fetch',
      line: lineNum,
      context: getContext(lineNum),
    });
  }

  // Extract API wrapper calls: api.get('/...')
  API_WRAPPER_PATTERN.lastIndex = 0;

  while ((match = API_WRAPPER_PATTERN.exec(content)) !== null) {
    const lineNum = getLineNumber(match.index);
    if (processedLines.has(lineNum)) continue;
    processedLines.add(lineNum);

    // API wrapper paths are relative, prepend /api
    let endpoint = match[2];

    // Skip if wrapper is invoked with a full external URL
    if (/^https?:\/\//.test(endpoint)) {
      results.push({
        type: 'skipped',
        reason: 'external_unresolved',
        raw: endpoint,
        line: lineNum,
      });
      processedLines.add(lineNum);
      continue;
    }

    // Normalize template variables if present (api.get(`/projects/${id}`))
    if (endpoint.includes('${')) {
      endpoint = endpoint.replace(/\$\{[^}]+\}/g, '[param]');
    }

    const apiPath = endpoint.startsWith('/api/')
      ? normalizePath(endpoint)
      : normalizePath(`/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);

    results.push({
      type: 'resolved',
      path: apiPath,
      style: 'api_wrapper',
      line: lineNum,
      context: getContext(lineNum),
    });
  }

  // Extract Netlify function calls
  NETLIFY_FUNCTION_PATTERN.lastIndex = 0;

  while ((match = NETLIFY_FUNCTION_PATTERN.exec(content)) !== null) {
    const lineNum = getLineNumber(match.index);
    if (processedLines.has(lineNum)) continue;
    processedLines.add(lineNum);

    results.push({
      type: 'resolved',
      path: `/.netlify/functions/${match[1]}`,
      style: 'netlify',
      line: lineNum,
      context: getContext(lineNum),
    });
  }

  // Extract external URL calls
  EXTERNAL_FETCH_PATTERN.lastIndex = 0;

  while ((match = EXTERNAL_FETCH_PATTERN.exec(content)) !== null) {
    const lineNum = getLineNumber(match.index);
    if (processedLines.has(lineNum)) continue;

    const url = match[1];
    const normalized = normalizeExternalUrl(url);

    if (normalized) {
      processedLines.add(lineNum);
      results.push({
        type: 'resolved',
        path: `external://${normalized.repo}${normalized.route}`,
        style: 'external',
        line: lineNum,
        context: getContext(lineNum),
      });
    } else {
      // Unknown external URL - skip it (not our responsibility)
      // Don't add to results - it's truly external
    }
  }

  return results;
}

/**
 * Normalize a route path (remove trailing slashes, handle query strings)
 */
export function normalizePath(path: string): string {
  // Remove query string
  const pathWithoutQuery = path.split('?')[0];
  // Remove trailing slash (except for root)
  return pathWithoutQuery.replace(/\/$/, '') || '/';
}

/**
 * Normalize a template literal path by converting ${var} to [param]
 */
export function normalizeTemplatePath(path: string): string {
  // Convert ${variable} to [param]
  let normalized = path.replace(/\$\{[^}]+\}/g, '[param]');
  // Clean up
  return normalizePath(normalized);
}

/**
 * Normalize an external URL to repo + route
 */
export function normalizeExternalUrl(url: string): NormalizedExternalCall | null {
  for (const [baseUrl, repo] of Object.entries(EXTERNAL_BASE_URLS)) {
    if (url.startsWith(baseUrl)) {
      const route = url.slice(baseUrl.length) || '/';
      return {
        repo,
        route: normalizePath(route),
        original_url: url,
      };
    }
  }
  return null;
}

// =============================================================================
// E2E Mock Extraction
// =============================================================================

/**
 * Extract E2E mocks from test file content
 */
export function extractE2EMocks(
  content: string,
  filePath: string
): MockExtractionResult[] {
  const results: MockExtractionResult[] = [];

  const getLineNumber = (index: number): number => {
    let line = 1;
    for (let i = 0; i < index && i < content.length; i++) {
      if (content[i] === '\n') line++;
    }
    return line;
  };

  E2E_ANY_MOCK_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  const normalizeExternalPattern = (
    pattern: string
  ): { normalizedPath: string | null; isWildcard: boolean } | null => {
    for (const [baseUrl, repo] of Object.entries(EXTERNAL_BASE_URLS)) {
      let host: string;
      try {
        host = new URL(baseUrl).host;
      } catch {
        continue;
      }

      const hostIndex = pattern.indexOf(host);
      if (hostIndex === -1) continue;

      const remainder = pattern.slice(hostIndex + host.length);
      const cleaned = remainder.trim();

      // Wildcard on domain only (e.g., **/modal.run/**)
      if (cleaned === '' || cleaned === '/' || cleaned === '/**') {
        return { normalizedPath: null, isWildcard: true };
      }

      let routePart = cleaned;
      if (!routePart.startsWith('/')) {
        routePart = `/${routePart}`;
      }

      // If the pattern ends with /** but includes a specific path, treat as specific
      const hasSpecificPath = routePart.replace(/\/\*\*$/, '') !== '';
      const isWildcard = !hasSpecificPath;
      const normalizedRoute = normalizePath(routePart.replace(/\/\*\*$/, ''));

      return {
        normalizedPath: normalizedRoute
          ? `external://${repo}${normalizedRoute}`
          : null,
        isWildcard,
      };
    }
    return null;
  };

  while ((match = E2E_ANY_MOCK_PATTERN.exec(content)) !== null) {
    const pattern = match[1];
    const lineNum = getLineNumber(match.index);

    // Check if it's a known wildcard pattern
    E2E_WILDCARD_PATTERN.lastIndex = 0;
    const isApiWildcard = E2E_WILDCARD_PATTERN.test(pattern);

    // Try external normalization first
    const external = normalizeExternalPattern(pattern);
    if (external) {
      results.push({
        pattern,
        normalized_path: external.normalizedPath,
        line: lineNum,
        is_wildcard: external.isWildcard,
      });
      continue;
    }

    // Try to normalize the pattern to a route path (local /api)
    let normalizedPath: string | null = null;
    if (pattern.includes('/api/')) {
      // Extract the API path from patterns like **/api/projects/**
      const apiMatch = pattern.match(/\*\*\/api\/([^*]+)/);
      if (apiMatch) {
        normalizedPath = `/api/${apiMatch[1].replace(/\*\*$/, '').replace(/\/$/, '')}`;
      }
    }

    results.push({
      pattern,
      normalized_path: normalizedPath,
      line: lineNum,
      is_wildcard: isApiWildcard,
    });
  }

  return results;
}

// =============================================================================
// Inventory Loading and Merging
// =============================================================================

/**
 * Check if a schema version is compatible
 */
export function isCompatibleSchema(version: string): boolean {
  // Support exact matches and 1.x pattern
  if ((SCHEMA_VERSIONS as readonly string[]).includes(version)) {
    return true;
  }
  // Support any 1.x version
  return /^1\.\d+$/.test(version);
}

/**
 * Load and parse an API inventory file
 */
export function loadInventory(inventoryPath: string): APIInventory | null {
  try {
    if (!fs.existsSync(inventoryPath)) {
      return null;
    }

    const content = fs.readFileSync(inventoryPath, 'utf-8');
    const inventory = JSON.parse(content) as APIInventory;

    // Validate schema version
    if (!isCompatibleSchema(inventory.schema_version)) {
      console.warn(
        `Warning: Inventory at ${inventoryPath} has incompatible schema version ${inventory.schema_version}`
      );
      return null;
    }

    return inventory;
  } catch (error) {
    console.error(`Error loading inventory at ${inventoryPath}:`, error);
    return null;
  }
}

/**
 * Check inventory freshness
 */
export function checkInventoryFreshness(
  inventoryPath: string,
  sourceDir?: string,
  repo?: string
): FreshnessCheckResult {
  const result: FreshnessCheckResult = {
    repo: repo || 'unknown',
    exists: false,
    fresh: true,
  };

  if (!fs.existsSync(inventoryPath)) {
    return result;
  }

  result.exists = true;

  try {
    const inventory = loadInventory(inventoryPath);
    if (inventory) {
      result.schema_version = inventory.schema_version;
      result.schema_compatible = isCompatibleSchema(inventory.schema_version);
    }

    result.inventory_mtime = fs.statSync(inventoryPath).mtime;

    // Check against source directory if provided and accessible
    if (sourceDir && fs.existsSync(sourceDir)) {
      const sourceMtime = getLatestMtime(sourceDir);
      if (sourceMtime) {
        result.source_mtime = sourceMtime;
        result.fresh = result.inventory_mtime >= sourceMtime;
      }
    }
  } catch (error) {
    console.error(`Error checking freshness for ${inventoryPath}:`, error);
  }

  return result;
}

/**
 * Get the latest modification time in a directory (recursive)
 */
export function getLatestMtime(dir: string): Date | null {
  let latest: Date | null = null;

  const walk = (currentDir: string) => {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Skip excluded directories
          if (['node_modules', '.next', 'dist', '__pycache__'].includes(entry.name)) {
            continue;
          }
          walk(fullPath);
        } else if (entry.isFile()) {
          const stat = fs.statSync(fullPath);
          if (!latest || stat.mtime > latest) {
            latest = stat.mtime;
          }
        }
      }
    } catch {
      // Ignore errors (permission issues, etc.)
    }
  };

  walk(dir);
  return latest;
}

/**
 * Merge local routes with external inventories
 */
export function mergeInventories(
  localRoutes: RouteEntry[],
  externalInventories: APIInventory[]
): MergedRoute[] {
  const merged: MergedRoute[] = [];

  // Add local routes
  for (const route of localRoutes) {
    merged.push({
      path: route.path,
      methods: route.methods,
      type: route.type,
      repo: 'app.startupai.site',
    });
  }

  // Add external routes
  for (const inventory of externalInventories) {
    for (const route of inventory.routes) {
      merged.push({
        path: route.path,
        methods: route.methods,
        type: route.type,
        repo: inventory.repo,
        base_url: route.base_url,
      });
    }
  }

  return merged;
}

// =============================================================================
// Route Matching and Reconciliation
// =============================================================================

/**
 * Convert a route path with dynamic segments to a regex pattern
 */
export function routePathToRegex(routePath: string): RegExp {
  // Escape special regex characters, but handle [...slug] spread segments
  let pattern = routePath
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // Handle spread segments [...slug]
    .replace(/\\\[\\\.\\\.\\\.[^\]]+\\\]/g, '.+')
    // Handle regular dynamic segments [id]
    .replace(/\\\[[^\]]+\\\]/g, '[^/]+');

  // Also match [param] from normalized template paths
  pattern = pattern.replace(/\[param\]/g, '[^/]+');

  return new RegExp(`^${pattern}$`);
}

/**
 * Find matching routes for a call path
 */
export function findMatchingRoutes(
  callPath: string,
  routes: Map<string, RouteEntry>
): string[] {
  const matches: string[] = [];

  // Handle external:// prefix
  if (callPath.startsWith('external://')) {
    return []; // External calls are matched separately
  }

  // Direct match first
  if (routes.has(callPath)) {
    return [callPath];
  }

  // Normalize the call path for matching
  const normalizedCall = normalizePath(callPath);

  // Check against all route patterns
  for (const [routePath, _] of routes) {
    const regex = routePathToRegex(routePath);
    if (regex.test(normalizedCall)) {
      matches.push(routePath);
    }
  }

  return matches;
}

/**
 * Find matching routes in merged inventory (includes external routes)
 */
export function findMatchingMergedRoute(
  callPath: string,
  mergedRoutes: MergedRoute[]
): MergedRoute | null {
  // Handle external:// prefix
  if (callPath.startsWith('external://')) {
    const externalPath = callPath.replace(/^external:\/\/[^/]+/, '');
    const repo = callPath.match(/^external:\/\/([^/]+)/)?.[1];

    for (const route of mergedRoutes) {
      if (route.repo === repo) {
        const regex = routePathToRegex(route.path);
        if (regex.test(externalPath)) {
          return route;
        }
      }
    }
    return null;
  }

  // Local route matching
  for (const route of mergedRoutes) {
    if (route.repo === 'app.startupai.site') {
      const regex = routePathToRegex(route.path);
      if (regex.test(callPath)) {
        return route;
      }
    }
  }

  return null;
}

/**
 * Find matching Netlify function
 */
export function findMatchingNetlifyFn(
  callPath: string,
  functions: Map<string, { name: string; source_file: string }>
): string | null {
  // Extract function name from path
  const match = callPath.match(/\/.netlify\/functions\/([^/?]+)/);
  if (match && functions.has(match[1])) {
    return match[1];
  }
  return null;
}

/**
 * Classify an orphan call
 */
export function classifyOrphan(
  route: string,
  callers: CallerReference[]
): OrphanClassification {
  // Check if no callers exist (dead code)
  if (callers.length === 0) {
    return 'dead_code';
  }

  // Check if all callers are from test files
  const allFromTests = callers.every(
    (c) =>
      c.file.includes('__tests__') ||
      c.file.includes('/tests/') ||
      c.file.endsWith('.test.ts') ||
      c.file.endsWith('.test.tsx') ||
      c.file.endsWith('.spec.ts')
  );

  if (allFromTests) {
    return 'test_only';
  }

  // Check if route looks like a webhook endpoint
  if (
    route.includes('/webhook') ||
    route.includes('/callback') ||
    route.includes('/cron')
  ) {
    return 'external_caller';
  }

  return 'unknown';
}

/**
 * Generate recommendation for an orphan
 */
export function generateOrphanRecommendation(
  route: string,
  classification: OrphanClassification
): string {
  switch (classification) {
    case 'dead_code':
      return `Route ${route} has no callers. Consider removing if unused.`;
    case 'test_only':
      return `Route ${route} is only called from tests. Verify implementation exists or mark as planned.`;
    case 'external_caller':
      return `Route ${route} may be called externally (webhook/callback). Document external callers.`;
    case 'unknown':
      return `Create route at frontend/src/app${route}/route.ts or remove fetch call if feature not ready.`;
  }
}

// =============================================================================
// Dependency Extraction
// =============================================================================

/**
 * Extract Supabase table references from content
 */
export function extractSupabaseTables(content: string): string[] {
  const tables = new Set<string>();

  // Pattern: from(tableName) or .from('tableName')
  const fromPattern = /\.from\s*\(\s*[`'"]([^`'"]+)[`'"]\s*\)/g;
  let match: RegExpExecArray | null;

  while ((match = fromPattern.exec(content)) !== null) {
    tables.add(match[1]);
  }

  // Pattern: drizzle table imports/references
  const drizzlePattern = /(?:from|insert|update|delete)\s*\(\s*(\w+Table)\s*\)/g;
  while ((match = drizzlePattern.exec(content)) !== null) {
    // Convert TableName to table_name
    const tableName = match[1]
      .replace(/Table$/, '')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    tables.add(tableName);
  }

  return [...tables];
}

/**
 * Extract Modal endpoint references from content
 */
export function extractModalEndpoints(content: string): string[] {
  const endpoints = new Set<string>();

  // Look for Modal base URL + path
  for (const [baseUrl, repo] of Object.entries(EXTERNAL_BASE_URLS)) {
    if (repo === 'startupai-crew') {
      const pattern = new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^'"\`\\s]+)`, 'g');
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        endpoints.add(match[1]);
      }
    }
  }

  // Look for MODAL_BASE_URL patterns
  const envPattern = /MODAL_BASE_URL[^`'"]*[`'"]([^`'"]+)[`'"]/g;
  let match: RegExpExecArray | null;
  while ((match = envPattern.exec(content)) !== null) {
    if (!match[1].startsWith('http')) {
      endpoints.add(match[1]);
    }
  }

  return [...endpoints];
}

/**
 * Extract outbound dependencies from route content
 */
export function extractOutboundDependencies(content: string): OutboundDependencies {
  return {
    supabase_tables: extractSupabaseTables(content),
    modal_endpoints: extractModalEndpoints(content),
    api_routes: [], // Could extract internal API calls if needed
  };
}

/**
 * Check if route has high fanout
 */
export function hasHighFanout(outbound: OutboundDependencies): boolean {
  return outbound.supabase_tables.length > HIGH_FANOUT_THRESHOLD;
}

// =============================================================================
// Story Extraction
// =============================================================================

/**
 * Extract @story annotations from content
 */
export function extractStoryAnnotations(content: string): string[] {
  const stories = new Set<string>();
  const pattern = /@story\s+(US-[A-Z]{1,3}\d{1,3}(?:\s*,\s*US-[A-Z]{1,3}\d{1,3})*)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const storyIds = match[1].split(/\s*,\s*/);
    for (const id of storyIds) {
      if (/^US-[A-Z]{1,3}\d{1,3}$/.test(id)) {
        stories.add(id);
      }
    }
  }

  return [...stories];
}

// =============================================================================
// E2E Coverage Matching
// =============================================================================

/**
 * Match E2E mock to merged routes
 */
export function matchE2EMockToRoute(
  mock: MockExtractionResult,
  mergedRoutes: MergedRoute[]
): MergedRoute | null {
  if (!mock.normalized_path) {
    return null;
  }
  return findMatchingMergedRoute(mock.normalized_path, mergedRoutes);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if a caller should be excluded from orphan detection
 */
export function shouldExcludeCaller(filePath: string): boolean {
  return isOrphanExcluded(filePath);
}

/**
 * Check if a route-to-route call is in the server allowlist
 */
export function isServerAllowlistCall(fromFile: string, toRoute: string): boolean {
  return isInServerAllowlist(fromFile, toRoute);
}
