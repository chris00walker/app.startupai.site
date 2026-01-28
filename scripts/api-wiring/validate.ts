#!/usr/bin/env tsx
/**
 * API Wiring Validator
 *
 * Validates the API wiring map for CI enforcement.
 *
 * Modes:
 *   --ci           Single-repo mode: warns on missing external inventories
 *   --ci --ecosystem  Ecosystem mode: fails on missing/stale external inventories
 *
 * Usage:
 *   pnpm api-wiring:validate           # Interactive validation
 *   pnpm api-wiring:ci                 # CI mode (single-repo)
 *   pnpm api-wiring:ci:ecosystem       # CI mode (ecosystem)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  PROJECT_ROOT,
  EXTERNAL_INVENTORIES,
  API_WIRING_MAP_PATH,
  API_INVENTORY_PATH,
  ROUTE_DIRS,
  CALLER_DIRS,
  MAX_SKIPPED_CALLS_WARNING,
  HIGH_FANOUT_THRESHOLD,
} from './config';
import {
  loadInventory,
  checkInventoryFreshness,
  getLatestMtime,
  hasHighFanout,
} from './core';
import type {
  APIWiringMap,
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  ValidationCode,
} from './schema';

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Load and parse the API wiring map
 */
function loadWiringMap(): APIWiringMap | null {
  const mapPath = path.resolve(PROJECT_ROOT, API_WIRING_MAP_PATH);

  if (!fs.existsSync(mapPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(mapPath, 'utf-8');
    return JSON.parse(content) as APIWiringMap;
  } catch (error) {
    console.error(`Error loading wiring map: ${error}`);
    return null;
  }
}

/**
 * Check if the wiring map is stale
 */
function isMapStale(): boolean {
  const mapPath = path.resolve(PROJECT_ROOT, API_WIRING_MAP_PATH);

  if (!fs.existsSync(mapPath)) {
    return true;
  }

  const mapMtime = fs.statSync(mapPath).mtime;

  // Check route directories
  for (const dir of ROUTE_DIRS) {
    const latestMtime = getLatestMtime(path.resolve(PROJECT_ROOT, dir));
    if (latestMtime && latestMtime > mapMtime) {
      return true;
    }
  }

  // Check caller directories
  for (const dir of CALLER_DIRS) {
    const latestMtime = getLatestMtime(path.resolve(PROJECT_ROOT, dir));
    if (latestMtime && latestMtime > mapMtime) {
      return true;
    }
  }

  return false;
}

/**
 * Load baseline route count from the committed map (git HEAD)
 */
function getBaselineRouteCount(): number | null {
  const gitDir = path.resolve(PROJECT_ROOT, '.git');
  if (!fs.existsSync(gitDir)) {
    return null;
  }

  try {
    const output = execSync(`git show HEAD:${API_WIRING_MAP_PATH}`, {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    const baseline = JSON.parse(output) as APIWiringMap;
    return baseline?.metadata?.route_count ?? null;
  } catch {
    return null;
  }
}

/**
 * Validate orphan calls
 */
function validateOrphans(map: APIWiringMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const orphan of map.orphans) {
    if (orphan.excluded) {
      issues.push({
        severity: 'warning',
        code: 'EXCLUDED_ORPHAN',
        message: `Excluded orphan: ${orphan.route} (${orphan.classification})`,
      });
    } else {
      issues.push({
        severity: 'error',
        code: 'ORPHAN_CALL',
        message: `Orphan call: ${orphan.route}\n  ${orphan.recommendation}`,
        file: orphan.callers[0]?.file,
        line: orphan.callers[0]?.line,
      });
    }
  }

  return issues;
}

/**
 * Validate external inventories
 */
function validateExternalInventories(ecosystemMode: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const config of EXTERNAL_INVENTORIES) {
    const fullPath = path.resolve(PROJECT_ROOT, config.path);
    const required = config.required !== false;
    const freshness = checkInventoryFreshness(
      fullPath,
      config.source_dir ? path.resolve(PROJECT_ROOT, config.source_dir) : undefined,
      config.repo
    );

    if (!freshness.exists) {
      const severity: ValidationSeverity =
        ecosystemMode && required ? 'error' : 'warning';
      const code: ValidationCode =
        ecosystemMode && required ? 'INVENTORY_MISSING' : 'INVENTORY_MISSING_LOCAL';
      issues.push({
        severity,
        code,
        message: `External inventory missing: ${config.repo} (${config.path})`,
        repo: config.repo,
      });
    } else if (!freshness.fresh) {
      issues.push({
        severity: ecosystemMode && required ? 'error' : 'warning',
        code: 'INVENTORY_STALE',
        message: `External inventory stale: ${config.repo} (${config.path})`,
        repo: config.repo,
      });
    } else if (!freshness.schema_compatible) {
      issues.push({
        severity: 'error',
        code: 'INVENTORY_SCHEMA_MISMATCH',
        message: `External inventory has incompatible schema: ${config.repo} (version ${freshness.schema_version})`,
        repo: config.repo,
      });
    }
  }

  return issues;
}

/**
 * Validate skipped calls
 */
function validateSkippedCalls(map: APIWiringMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (map.skipped_calls.length > MAX_SKIPPED_CALLS_WARNING) {
    issues.push({
      severity: 'warning',
      code: 'SKIPPED_CALLS',
      message: `${map.skipped_calls.length} calls could not be statically resolved. Consider reviewing manually.`,
    });
  }

  return issues;
}

/**
 * Validate E2E coverage gaps
 */
function validateE2ECoverage(map: APIWiringMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const gap of map.e2e_gaps.specific) {
    issues.push({
      severity: 'warning',
      code: 'E2E_SPECIFIC_GAP',
      message: `E2E mock does not match any route: ${gap.pattern}`,
      file: gap.file,
      line: gap.line,
    });
  }

  // Wildcards are informational only
  for (const wildcard of map.e2e_gaps.wildcards) {
    issues.push({
      severity: 'info',
      code: 'E2E_WILDCARD',
      message: `E2E wildcard mock: ${wildcard}`,
    });
  }

  return issues;
}

/**
 * Validate high-fanout routes
 */
function validateHighFanout(map: APIWiringMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [routePath, route] of Object.entries(map.routes)) {
    if (hasHighFanout(route.outbound)) {
      issues.push({
        severity: 'info',
        code: 'HIGH_FANOUT',
        message: `Route ${routePath} touches ${route.outbound.supabase_tables.length} Supabase tables`,
        file: route.source_file,
      });
    }
  }

  return issues;
}

/**
 * Run full validation
 */
function validate(ecosystemMode: boolean): ValidationResult {
  const issues: ValidationIssue[] = [];
  let routesValidated = 0;
  let callersValidated = 0;
  let orphansFound = 0;
  let orphansExcluded = 0;
  let externalLoaded = 0;
  let externalMissing = 0;

  // Check if map exists
  const map = loadWiringMap();
  if (!map) {
    issues.push({
      severity: 'error',
      code: 'STALE_MAP',
      message: 'API wiring map not found. Run: pnpm api-wiring:generate',
    });
    return {
      valid: false,
      issues,
      stats: {
        routes_validated: 0,
        callers_validated: 0,
        orphans_found: 0,
        orphans_excluded: 0,
        external_inventories_loaded: 0,
        external_inventories_missing: 0,
      },
    };
  }

  // Check if map is stale
  if (isMapStale()) {
    issues.push({
      severity: 'warning',
      code: 'STALE_MAP',
      message: 'API wiring map may be stale. Run: pnpm api-wiring:generate',
    });
  }

  // Check for route count regression against committed baseline
  const baselineRouteCount = getBaselineRouteCount();
  if (
    baselineRouteCount !== null &&
    map.metadata.route_count < baselineRouteCount
  ) {
    issues.push({
      severity: 'warning',
      code: 'ROUTE_REGRESSION',
      message: `Route count decreased: ${map.metadata.route_count} (baseline ${baselineRouteCount}). Verify intentional removals.`,
    });
  }

  // Validate orphans
  issues.push(...validateOrphans(map));
  orphansFound = map.orphans.filter((o) => !o.excluded).length;
  orphansExcluded = map.orphans.filter((o) => o.excluded).length;

  // Validate external inventories
  issues.push(...validateExternalInventories(ecosystemMode));
  for (const inv of map.metadata.external_inventories) {
    if (inv.status === 'loaded') {
      externalLoaded++;
    } else {
      externalMissing++;
    }
  }

  // Validate skipped calls
  issues.push(...validateSkippedCalls(map));

  // Validate E2E coverage
  issues.push(...validateE2ECoverage(map));

  // Validate high fanout
  issues.push(...validateHighFanout(map));

  // Calculate stats
  routesValidated = map.metadata.route_count;
  callersValidated = map.metadata.caller_count;

  // Check if valid (no errors)
  const valid = !issues.some((i) => i.severity === 'error');

  return {
    valid,
    issues,
    stats: {
      routes_validated: routesValidated,
      callers_validated: callersValidated,
      orphans_found: orphansFound,
      orphans_excluded: orphansExcluded,
      external_inventories_loaded: externalLoaded,
      external_inventories_missing: externalMissing,
    },
  };
}

// =============================================================================
// Output Formatting
// =============================================================================

/**
 * Format issue for console output
 */
function formatIssue(issue: ValidationIssue): string {
  const prefix = {
    error: '\x1b[31mERROR\x1b[0m',
    warning: '\x1b[33mWARN\x1b[0m',
    info: '\x1b[36mINFO\x1b[0m',
  }[issue.severity];

  let location = '';
  if (issue.file) {
    location = issue.line ? ` ${issue.file}:${issue.line}` : ` ${issue.file}`;
  }

  return `${prefix} [${issue.code}]${location}\n  ${issue.message}`;
}

/**
 * Print validation result
 */
function printResult(result: ValidationResult, ciMode: boolean): void {
  if (!ciMode) {
    console.log('='.repeat(60));
    console.log('API Wiring Validation');
    console.log('='.repeat(60));
    console.log();
  }

  // Group issues by severity
  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');
  const infos = result.issues.filter((i) => i.severity === 'info');

  // Print errors
  if (errors.length > 0) {
    console.log('Errors:');
    for (const issue of errors) {
      console.log(formatIssue(issue));
      console.log();
    }
  }

  // Print warnings
  if (warnings.length > 0 && !ciMode) {
    console.log('Warnings:');
    for (const issue of warnings) {
      console.log(formatIssue(issue));
      console.log();
    }
  }

  // Print infos (only in non-CI mode)
  if (infos.length > 0 && !ciMode) {
    console.log('Info:');
    for (const issue of infos.slice(0, 10)) {
      console.log(formatIssue(issue));
    }
    if (infos.length > 10) {
      console.log(`  ... and ${infos.length - 10} more`);
    }
    console.log();
  }

  // Print summary
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Routes validated: ${result.stats.routes_validated}`);
  console.log(`Callers validated: ${result.stats.callers_validated}`);
  console.log(`Orphans found: ${result.stats.orphans_found}`);
  console.log(`Orphans excluded: ${result.stats.orphans_excluded}`);
  console.log(`External inventories: ${result.stats.external_inventories_loaded} loaded, ${result.stats.external_inventories_missing} missing`);
  console.log();
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Info: ${infos.length}`);
  console.log();

  if (result.valid) {
    console.log('\x1b[32mValidation PASSED\x1b[0m');
  } else {
    console.log('\x1b[31mValidation FAILED\x1b[0m');
  }
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const ciMode = args.includes('--ci');
  const ecosystemMode = args.includes('--ecosystem');

  // Run validation
  const result = validate(ecosystemMode);

  // Print results
  printResult(result, ciMode);

  // Exit with appropriate code
  if (!result.valid) {
    process.exit(1);
  }
}

// Run main
main();
