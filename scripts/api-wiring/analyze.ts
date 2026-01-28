#!/usr/bin/env tsx
/**
 * API Wiring Analyzer
 *
 * Generates api-wiring-map.json by:
 * 1. Discovering all API routes and Netlify functions
 * 2. Scanning for API callers in frontend code
 * 3. Loading external inventories for cross-repo validation
 * 4. Reconciling callers with routes
 * 5. Identifying orphan calls and E2E coverage gaps
 *
 * Usage:
 *   pnpm api-wiring:generate
 *   pnpm exec tsx scripts/api-wiring/analyze.ts [--json]
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PROJECT_ROOT,
  ROUTE_DIRS,
  NETLIFY_FUNCTION_DIRS,
  CALLER_DIRS,
  E2E_DIRS,
  EXCLUDE_DIRS,
  SCAN_EXTENSIONS,
  EXTERNAL_INVENTORIES,
  API_WIRING_MAP_PATH,
  ORPHAN_REPORT_PATH,
  E2E_COVERAGE_REPORT_PATH,
  OUTPUT_DIR,
  GENERATOR_VERSION,
  isOrphanExcluded,
} from './config';
import {
  extractRoutePath,
  extractHttpMethods,
  extractNetlifyFunction,
  determineRouteType,
  extractApiCalls,
  extractE2EMocks,
  extractOutboundDependencies,
  extractStoryAnnotations,
  loadInventory,
  checkInventoryFreshness,
  mergeInventories,
  findMatchingRoutes,
  findMatchingMergedRoute,
  findMatchingNetlifyFn,
  classifyOrphan,
  generateOrphanRecommendation,
  matchE2EMockToRoute,
  shouldExcludeCaller,
  isServerAllowlistCall,
  hasHighFanout,
} from './core';
import type {
  APIWiringMap,
  RouteEntry,
  NetlifyFunctionEntry,
  CallerReference,
  SkippedCall,
  OrphanEntry,
  MockReference,
  APIInventory,
  MergedRoute,
  CallExtractionResult,
} from './schema';

// =============================================================================
// Directory Walking
// =============================================================================

/**
 * Walk a directory recursively and return all matching files
 */
function walkDirectory(dir: string, extensions: readonly string[]): string[] {
  const files: string[] = [];
  const absoluteDir = path.resolve(PROJECT_ROOT, dir);

  if (!fs.existsSync(absoluteDir)) {
    return files;
  }

  const walk = (currentDir: string) => {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (EXCLUDE_DIRS.includes(entry.name as any)) {
            continue;
          }
          walk(path.join(currentDir, entry.name));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext as any)) {
            files.push(path.join(currentDir, entry.name));
          }
        }
      }
    } catch (error) {
      console.error(`Error walking directory ${currentDir}:`, error);
    }
  };

  walk(absoluteDir);
  return files;
}

// =============================================================================
// Route Discovery
// =============================================================================

/**
 * Discover all API routes
 */
function discoverRoutes(): Map<string, RouteEntry> {
  const routes = new Map<string, RouteEntry>();

  for (const dir of ROUTE_DIRS) {
    const files = walkDirectory(dir, SCAN_EXTENSIONS);

    for (const file of files) {
      const relativePath = path.relative(PROJECT_ROOT, file);
      const routePath = extractRoutePath(relativePath);

      if (routePath && !routes.has(routePath)) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const methods = extractHttpMethods(content);
          const routeType = determineRouteType(relativePath);
          const outbound = extractOutboundDependencies(content);
          const stories = extractStoryAnnotations(content);

          routes.set(routePath, {
            path: routePath,
            methods,
            type: routeType,
            source_file: relativePath,
            callers: [],
            outbound,
            e2e_coverage: [],
            stories,
          });
        } catch (error) {
          console.error(`Error reading route file ${file}:`, error);
        }
      }
    }
  }

  return routes;
}

/**
 * Discover all Netlify functions
 */
function discoverNetlifyFunctions(): Map<string, NetlifyFunctionEntry> {
  const functions = new Map<string, NetlifyFunctionEntry>();

  for (const dir of NETLIFY_FUNCTION_DIRS) {
    const files = walkDirectory(dir, SCAN_EXTENSIONS);

    for (const file of files) {
      const relativePath = path.relative(PROJECT_ROOT, file);
      const fnName = extractNetlifyFunction(relativePath);

      if (fnName && !functions.has(fnName)) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const outbound = extractOutboundDependencies(content);

          functions.set(fnName, {
            name: fnName,
            source_file: relativePath,
            callers: [],
            outbound,
          });
        } catch (error) {
          console.error(`Error reading Netlify function ${file}:`, error);
        }
      }
    }
  }

  return functions;
}

// =============================================================================
// Caller Scanning
// =============================================================================

interface CallerScanResult {
  callers: Map<string, CallerReference[]>; // route path -> callers
  netlifyCallers: Map<string, CallerReference[]>; // function name -> callers
  skippedCalls: SkippedCall[];
  externalCallers: Map<string, CallerReference[]>; // external:// path -> callers
}

/**
 * Scan for API callers in frontend code
 */
function scanCallers(): CallerScanResult {
  const callers = new Map<string, CallerReference[]>();
  const netlifyCallers = new Map<string, CallerReference[]>();
  const externalCallers = new Map<string, CallerReference[]>();
  const skippedCalls: SkippedCall[] = [];

  for (const dir of CALLER_DIRS) {
    const files = walkDirectory(dir, SCAN_EXTENSIONS);

    for (const file of files) {
      const relativePath = path.relative(PROJECT_ROOT, file);

      try {
        const content = fs.readFileSync(file, 'utf-8');
        const calls = extractApiCalls(content, relativePath);

        for (const call of calls) {
          if (call.type === 'resolved') {
            const callerRef: CallerReference = {
              file: relativePath,
              line: call.line,
              context: call.context,
              call_style: call.style,
            };

            if (call.style === 'netlify') {
              // Extract function name from path
              const fnMatch = call.path.match(/\/.netlify\/functions\/([^/?]+)/);
              if (fnMatch) {
                const fnName = fnMatch[1];
                if (!netlifyCallers.has(fnName)) {
                  netlifyCallers.set(fnName, []);
                }
                netlifyCallers.get(fnName)!.push(callerRef);
              }
            } else if (call.path.startsWith('external://')) {
              if (!externalCallers.has(call.path)) {
                externalCallers.set(call.path, []);
              }
              externalCallers.get(call.path)!.push(callerRef);
            } else {
              if (!callers.has(call.path)) {
                callers.set(call.path, []);
              }
              callers.get(call.path)!.push(callerRef);
            }
          } else {
            skippedCalls.push({
              file: relativePath,
              line: call.line,
              raw: call.raw,
              reason: call.reason,
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning file ${file}:`, error);
      }
    }
  }

  return { callers, netlifyCallers, skippedCalls, externalCallers };
}

// =============================================================================
// E2E Mock Scanning
// =============================================================================

interface E2EScanResult {
  mocks: Array<MockReference & { normalized_path: string | null }>;
  wildcards: string[];
}

/**
 * Scan for E2E route mocks
 */
function scanE2EMocks(): E2EScanResult {
  const mocks: MockReference[] = [];
  const wildcards: string[] = [];

  for (const dir of E2E_DIRS) {
    const files = walkDirectory(dir, SCAN_EXTENSIONS);

    for (const file of files) {
      const relativePath = path.relative(PROJECT_ROOT, file);

      try {
        const content = fs.readFileSync(file, 'utf-8');
        const extracted = extractE2EMocks(content, relativePath);

        for (const mock of extracted) {
          if (mock.is_wildcard) {
            wildcards.push(mock.pattern);
          } else {
            mocks.push({
              file: relativePath,
              line: mock.line,
              pattern: mock.pattern,
              is_wildcard: mock.is_wildcard,
              normalized_path: mock.normalized_path,
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning E2E file ${file}:`, error);
      }
    }
  }

  return { mocks, wildcards: [...new Set(wildcards)] };
}

// =============================================================================
// Reconciliation
// =============================================================================

interface ReconciliationResult {
  routes: Map<string, RouteEntry>;
  netlifyFunctions: Map<string, NetlifyFunctionEntry>;
  orphans: OrphanEntry[];
  e2eGaps: MockReference[];
}

/**
 * Reconcile callers with routes
 */
function reconcile(
  routes: Map<string, RouteEntry>,
  netlifyFunctions: Map<string, NetlifyFunctionEntry>,
  scanResult: CallerScanResult,
  e2eScanResult: E2EScanResult,
  mergedRoutes: MergedRoute[]
): ReconciliationResult {
  const orphans: OrphanEntry[] = [];
  const e2eGaps: MockReference[] = [];

  // Match local API callers to routes
  for (const [callPath, callerRefs] of scanResult.callers) {
    const matchingRoutes = findMatchingRoutes(callPath, routes);

    if (matchingRoutes.length > 0) {
      // Add callers to matched routes
      for (const routePath of matchingRoutes) {
        const route = routes.get(routePath)!;
        route.callers.push(...callerRefs);
      }
    } else {
      // Check if it matches external routes
      const externalMatch = findMatchingMergedRoute(callPath, mergedRoutes);
      if (!externalMatch) {
        // This is an orphan call
        const allowlistedCallers = callerRefs.filter((c) =>
          isServerAllowlistCall(c.file, callPath)
        );
        const nonAllowlistedCallers = callerRefs.filter(
          (c) => !isServerAllowlistCall(c.file, callPath)
        );

        // If all callers are allowlisted, skip orphan reporting
        if (nonAllowlistedCallers.length === 0 && allowlistedCallers.length > 0) {
          continue;
        }

        const filteredCallers = nonAllowlistedCallers.filter(
          (c) => !shouldExcludeCaller(c.file)
        );

        if (filteredCallers.length > 0) {
          const classification = classifyOrphan(callPath, filteredCallers);
          orphans.push({
            route: callPath,
            callers: filteredCallers,
            classification,
            recommendation: generateOrphanRecommendation(callPath, classification),
            excluded: false,
          });
        } else if (nonAllowlistedCallers.length > 0) {
          // All non-allowlisted callers were excluded
          const classification = classifyOrphan(callPath, nonAllowlistedCallers);
          orphans.push({
            route: callPath,
            callers: nonAllowlistedCallers,
            classification,
            recommendation: generateOrphanRecommendation(callPath, classification),
            excluded: true,
          });
        }
      }
    }
  }

  // Match Netlify function callers
  for (const [fnName, callerRefs] of scanResult.netlifyCallers) {
    const fn = netlifyFunctions.get(fnName);
    if (fn) {
      fn.callers.push(...callerRefs);
    } else {
      // Netlify function doesn't exist
      const filteredCallers = callerRefs.filter((c) => !shouldExcludeCaller(c.file));
      if (filteredCallers.length > 0) {
        orphans.push({
          route: `/.netlify/functions/${fnName}`,
          callers: filteredCallers,
          classification: 'unknown',
          recommendation: `Create Netlify function at netlify/functions/${fnName}.ts`,
          excluded: false,
        });
      }
    }
  }

  // Match external callers
  for (const [externalPath, callerRefs] of scanResult.externalCallers) {
    const externalMatch = findMatchingMergedRoute(externalPath, mergedRoutes);
    if (!externalMatch) {
      // External route not found in inventory
      const filteredCallers = callerRefs.filter((c) => !shouldExcludeCaller(c.file));
      if (filteredCallers.length > 0) {
        orphans.push({
          route: externalPath,
          callers: filteredCallers,
          classification: 'unknown',
          recommendation: `External route not found in inventory. Verify external service is running or update inventory.`,
          excluded: false,
        });
      }
    }
  }

  // Match E2E mocks to routes
  for (const mock of e2eScanResult.mocks) {
    if (mock.is_wildcard) continue;

    const matchedRoute = matchE2EMockToRoute(
      {
        pattern: mock.pattern,
        normalized_path: mock.normalized_path,
        line: mock.line,
        is_wildcard: false,
      },
      mergedRoutes
    );

    if (matchedRoute) {
      // Add to route's E2E coverage
      const localRoute = routes.get(matchedRoute.path);
      if (localRoute) {
        localRoute.e2e_coverage.push({
          file: mock.file,
          line: mock.line,
          pattern: mock.pattern,
          is_wildcard: mock.is_wildcard,
        });
      }
    } else {
      // E2E mock doesn't match any route
      e2eGaps.push({
        file: mock.file,
        line: mock.line,
        pattern: mock.pattern,
        is_wildcard: mock.is_wildcard,
      });
    }
  }

  return { routes, netlifyFunctions, orphans, e2eGaps };
}

// =============================================================================
// External Inventory Loading
// =============================================================================

interface ExternalInventoryStatus {
  repo: string;
  route_count: number;
  status: 'loaded' | 'missing' | 'stale' | 'invalid';
}

/**
 * Load external inventories
 */
function loadExternalInventories(): {
  inventories: APIInventory[];
  statuses: ExternalInventoryStatus[];
} {
  const inventories: APIInventory[] = [];
  const statuses: ExternalInventoryStatus[] = [];

  for (const config of EXTERNAL_INVENTORIES) {
    const fullPath = path.resolve(PROJECT_ROOT, config.path);
    const freshness = checkInventoryFreshness(fullPath, config.source_dir, config.repo);

    if (!freshness.exists) {
      statuses.push({
        repo: config.repo,
        route_count: 0,
        status: 'missing',
      });
      console.warn(`Warning: External inventory not found: ${config.path}`);
      continue;
    }

    if (!freshness.fresh) {
      console.warn(`Warning: External inventory may be stale: ${config.path}`);
    }

    const inventory = loadInventory(fullPath);
    if (inventory) {
      inventories.push(inventory);
      statuses.push({
        repo: config.repo,
        route_count: inventory.routes.length,
        status: freshness.fresh ? 'loaded' : 'stale',
      });
    } else {
      statuses.push({
        repo: config.repo,
        route_count: 0,
        status: 'invalid',
      });
    }
  }

  return { inventories, statuses };
}

// =============================================================================
// Report Generation
// =============================================================================

/**
 * Generate orphan report markdown
 */
function generateOrphanReport(orphans: OrphanEntry[]): string {
  const lines: string[] = [
    '# API Wiring - Orphan Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total orphan calls: ${orphans.length}`,
    `- Non-excluded: ${orphans.filter((o) => !o.excluded).length}`,
    `- Excluded (test-only): ${orphans.filter((o) => o.excluded).length}`,
    '',
  ];

  // Non-excluded orphans
  const nonExcluded = orphans.filter((o) => !o.excluded);
  if (nonExcluded.length > 0) {
    lines.push('## Non-Excluded Orphans (Action Required)');
    lines.push('');

    for (const orphan of nonExcluded) {
      lines.push(`### \`${orphan.route}\``);
      lines.push('');
      lines.push(`**Classification:** ${orphan.classification}`);
      lines.push(`**Recommendation:** ${orphan.recommendation}`);
      lines.push('');
      lines.push('**Callers:**');
      for (const caller of orphan.callers) {
        lines.push(`- \`${caller.file}:${caller.line}\` (${caller.call_style})`);
      }
      lines.push('');
    }
  }

  // Excluded orphans
  const excluded = orphans.filter((o) => o.excluded);
  if (excluded.length > 0) {
    lines.push('## Excluded Orphans (Informational)');
    lines.push('');
    lines.push('These orphans are from excluded files (tests, known dead code) and do not block CI.');
    lines.push('');

    for (const orphan of excluded) {
      lines.push(`- \`${orphan.route}\` - ${orphan.callers.length} caller(s) from excluded files`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate E2E coverage report markdown
 */
function generateE2ECoverageReport(
  routes: Map<string, RouteEntry>,
  e2eGaps: MockReference[],
  wildcards: string[]
): string {
  const lines: string[] = [
    '# API Wiring - E2E Coverage Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
  ];

  // Routes with E2E coverage
  const routesWithCoverage = [...routes.values()].filter((r) => r.e2e_coverage.length > 0);
  const routesWithoutCoverage = [...routes.values()].filter((r) => r.e2e_coverage.length === 0);

  lines.push(`- Routes with E2E coverage: ${routesWithCoverage.length}`);
  lines.push(`- Routes without E2E coverage: ${routesWithoutCoverage.length}`);
  lines.push(`- E2E mocks with no matching route: ${e2eGaps.length}`);
  lines.push(`- Wildcard mocks (not validated): ${wildcards.length}`);
  lines.push('');

  // E2E gaps
  if (e2eGaps.length > 0) {
    lines.push('## E2E Mocks Without Matching Routes');
    lines.push('');
    lines.push('These mocks may be testing routes that do not exist or have incorrect patterns.');
    lines.push('');

    for (const gap of e2eGaps) {
      lines.push(`- \`${gap.pattern}\` in \`${gap.file}:${gap.line}\``);
    }
    lines.push('');
  }

  // Routes without coverage
  if (routesWithoutCoverage.length > 0) {
    lines.push('## Routes Without E2E Coverage');
    lines.push('');
    lines.push('Consider adding E2E tests for these routes.');
    lines.push('');

    for (const route of routesWithoutCoverage.slice(0, 20)) {
      lines.push(`- \`${route.path}\` (${route.methods.join(', ')})`);
    }
    if (routesWithoutCoverage.length > 20) {
      lines.push(`- ... and ${routesWithoutCoverage.length - 20} more`);
    }
    lines.push('');
  }

  // Wildcards (informational)
  if (wildcards.length > 0) {
    lines.push('## Wildcard Mocks (Informational)');
    lines.push('');
    lines.push('These wildcard patterns match multiple routes and are not validated against the inventory.');
    lines.push('');

    for (const wildcard of wildcards) {
      lines.push(`- \`${wildcard}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// =============================================================================
// Main Analyzer
// =============================================================================

/**
 * Main analysis pipeline
 */
function analyze(): APIWiringMap {
  console.log('Discovering API routes...');
  const routes = discoverRoutes();
  console.log(`  Found ${routes.size} routes`);

  console.log('Discovering Netlify functions...');
  const netlifyFunctions = discoverNetlifyFunctions();
  console.log(`  Found ${netlifyFunctions.size} functions`);

  console.log('Loading external inventories...');
  const { inventories: externalInventories, statuses: inventoryStatuses } =
    loadExternalInventories();
  console.log(`  Loaded ${externalInventories.length} external inventories`);

  // Merge all routes for reconciliation
  const mergedRoutes = mergeInventories([...routes.values()], externalInventories);
  console.log(`  Total merged routes: ${mergedRoutes.length}`);

  console.log('Scanning for API callers...');
  const callerScanResult = scanCallers();
  console.log(`  Found ${callerScanResult.callers.size} unique API call paths`);
  console.log(`  Skipped ${callerScanResult.skippedCalls.length} unresolvable calls`);

  console.log('Scanning for E2E mocks...');
  const e2eScanResult = scanE2EMocks();
  console.log(`  Found ${e2eScanResult.mocks.length} specific mocks`);
  console.log(`  Found ${e2eScanResult.wildcards.length} wildcard patterns`);

  console.log('Reconciling callers with routes...');
  const reconciled = reconcile(
    routes,
    netlifyFunctions,
    callerScanResult,
    e2eScanResult,
    mergedRoutes
  );
  console.log(`  Orphan calls: ${reconciled.orphans.length}`);
  console.log(`  E2E gaps: ${reconciled.e2eGaps.length}`);

  // Calculate totals
  let totalCallers = 0;
  for (const route of reconciled.routes.values()) {
    totalCallers += route.callers.length;
  }
  for (const fn of reconciled.netlifyFunctions.values()) {
    totalCallers += fn.callers.length;
  }

  // Build map
  const map: APIWiringMap = {
    metadata: {
      generated_at: new Date().toISOString(),
      version: GENERATOR_VERSION,
      route_count: reconciled.routes.size,
      caller_count: totalCallers,
      skipped_count: callerScanResult.skippedCalls.length,
      orphan_count: reconciled.orphans.filter((o) => !o.excluded).length,
      external_inventories: inventoryStatuses,
    },
    routes: Object.fromEntries(reconciled.routes),
    netlify_functions: Object.fromEntries(reconciled.netlifyFunctions),
    orphans: reconciled.orphans,
    skipped_calls: callerScanResult.skippedCalls,
    e2e_gaps: {
      specific: reconciled.e2eGaps,
      wildcards: e2eScanResult.wildcards,
    },
  };

  return map;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');

  if (!jsonOutput) {
    console.log('='.repeat(60));
    console.log('API Wiring Analyzer');
    console.log('='.repeat(60));
    console.log();
  }

  // Run analysis
  const map = analyze();

  // Ensure output directory exists
  const outputDir = path.resolve(PROJECT_ROOT, OUTPUT_DIR);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (jsonOutput) {
    // JSON output to stdout
    console.log(JSON.stringify(map, null, 2));
  } else {
    // Write map file
    const mapPath = path.resolve(PROJECT_ROOT, API_WIRING_MAP_PATH);
    fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');

    // Write orphan report
    const orphanReport = generateOrphanReport(map.orphans);
    const orphanPath = path.resolve(PROJECT_ROOT, ORPHAN_REPORT_PATH);
    fs.writeFileSync(orphanPath, orphanReport);

    // Write E2E coverage report
    const e2eReport = generateE2ECoverageReport(
      new Map(Object.entries(map.routes)),
      map.e2e_gaps.specific,
      map.e2e_gaps.wildcards
    );
    const e2ePath = path.resolve(PROJECT_ROOT, E2E_COVERAGE_REPORT_PATH);
    fs.writeFileSync(e2ePath, e2eReport);

    // Print summary
    console.log();
    console.log('='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Routes: ${map.metadata.route_count}`);
    console.log(`Netlify functions: ${Object.keys(map.netlify_functions).length}`);
    console.log(`Total callers: ${map.metadata.caller_count}`);
    console.log(`Skipped calls: ${map.metadata.skipped_count}`);
    console.log(`Orphan calls: ${map.metadata.orphan_count}`);
    console.log(`E2E gaps: ${map.e2e_gaps.specific.length}`);
    console.log();
    console.log('External inventories:');
    for (const inv of map.metadata.external_inventories) {
      console.log(`  ${inv.repo}: ${inv.status} (${inv.route_count} routes)`);
    }
    console.log();
    console.log('Generated files:');
    console.log(`  ${API_WIRING_MAP_PATH}`);
    console.log(`  ${ORPHAN_REPORT_PATH}`);
    console.log(`  ${E2E_COVERAGE_REPORT_PATH}`);
  }
}

// Run main
main();
