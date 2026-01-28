#!/usr/bin/env tsx
/**
 * API Inventory Generator
 *
 * Generates api-inventory.json for this repository by scanning route directories.
 * This inventory is committed and used by the validator to cross-reference API calls.
 *
 * Usage:
 *   pnpm api-inventory:generate
 *   pnpm exec tsx scripts/api-wiring/generate-inventory.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PROJECT_ROOT,
  ROUTE_DIRS,
  NETLIFY_FUNCTION_DIRS,
  EXCLUDE_DIRS,
  SCAN_EXTENSIONS,
  API_INVENTORY_PATH,
  OUTPUT_DIR,
} from './config';
import {
  extractRoutePath,
  extractHttpMethods,
  extractNetlifyFunction,
  determineRouteType,
  extractStoryAnnotations,
} from './core';
import type { APIInventory, RouteDefinition } from './schema';

// =============================================================================
// Directory Walking
// =============================================================================

/**
 * Walk a directory recursively and return all matching files
 */
function walkDirectory(
  dir: string,
  extensions: readonly string[]
): string[] {
  const files: string[] = [];
  const absoluteDir = path.resolve(PROJECT_ROOT, dir);

  if (!fs.existsSync(absoluteDir)) {
    return files;
  }

  const walk = (currentDir: string) => {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip excluded directories
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
 * Discover all API routes in the project
 */
function discoverRoutes(): RouteDefinition[] {
  const routes: RouteDefinition[] = [];
  const seenPaths = new Set<string>();

  for (const dir of ROUTE_DIRS) {
    const files = walkDirectory(dir, SCAN_EXTENSIONS);

    for (const file of files) {
      const relativePath = path.relative(PROJECT_ROOT, file);
      const routePath = extractRoutePath(relativePath);

      if (routePath && !seenPaths.has(routePath)) {
        seenPaths.add(routePath);

        try {
          const content = fs.readFileSync(file, 'utf-8');
          const methods = extractHttpMethods(content);
          const routeType = determineRouteType(relativePath);

          // Extract description from JSDoc if available
          const jsdocMatch = content.match(/\/\*\*\s*\n([^*]*(?:\*[^/][^*]*)*)\*\//);
          let description: string | undefined;
          if (jsdocMatch) {
            const docLines = jsdocMatch[1]
              .split('\n')
              .map((line) => line.replace(/^\s*\*\s?/, '').trim())
              .filter((line) => line && !line.startsWith('@'));
            if (docLines.length > 0) {
              description = docLines[0].slice(0, 200);
            }
          }

          routes.push({
            path: routePath,
            methods,
            type: routeType,
            description,
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
 * Discover all Netlify functions in the project
 */
function discoverNetlifyFunctions(): RouteDefinition[] {
  const functions: RouteDefinition[] = [];
  const seenNames = new Set<string>();

  for (const dir of NETLIFY_FUNCTION_DIRS) {
    const files = walkDirectory(dir, SCAN_EXTENSIONS);

    for (const file of files) {
      const relativePath = path.relative(PROJECT_ROOT, file);
      const fnName = extractNetlifyFunction(relativePath);

      if (fnName && !seenNames.has(fnName)) {
        seenNames.add(fnName);

        try {
          const content = fs.readFileSync(file, 'utf-8');

          // Netlify functions typically handle multiple methods
          // Check for explicit method handling
          const methods: string[] = [];
          if (content.includes('GET') || content.includes('event.httpMethod')) {
            methods.push('GET');
          }
          if (content.includes('POST')) {
            methods.push('POST');
          }
          if (methods.length === 0) {
            methods.push('GET', 'POST'); // Default assumption
          }

          // Extract description from JSDoc
          const jsdocMatch = content.match(/\/\*\*\s*\n([^*]*(?:\*[^/][^*]*)*)\*\//);
          let description: string | undefined;
          if (jsdocMatch) {
            const docLines = jsdocMatch[1]
              .split('\n')
              .map((line) => line.replace(/^\s*\*\s?/, '').trim())
              .filter((line) => line && !line.startsWith('@'));
            if (docLines.length > 0) {
              description = docLines[0].slice(0, 200);
            }
          }

          functions.push({
            path: `/.netlify/functions/${fnName}`,
            methods,
            type: 'netlify',
            description,
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
// Main Generator
// =============================================================================

/**
 * Generate the API inventory
 */
function generateInventory(): APIInventory {
  console.log('Discovering API routes...');
  const apiRoutes = discoverRoutes();
  console.log(`  Found ${apiRoutes.length} API routes`);

  console.log('Discovering Netlify functions...');
  const netlifyFunctions = discoverNetlifyFunctions();
  console.log(`  Found ${netlifyFunctions.length} Netlify functions`);

  // Combine all routes
  const allRoutes = [...apiRoutes, ...netlifyFunctions];

  // Sort by path for consistent output
  allRoutes.sort((a, b) => a.path.localeCompare(b.path));

  return {
    schema_version: '1.0',
    repo: 'app.startupai.site',
    generated_at: new Date().toISOString(),
    routes: allRoutes,
  };
}

/**
 * Main entry point
 */
function main() {
  console.log('='.repeat(60));
  console.log('API Inventory Generator');
  console.log('='.repeat(60));
  console.log();

  // Generate inventory
  const inventory = generateInventory();

  // Ensure output directory exists
  const outputDir = path.resolve(PROJECT_ROOT, OUTPUT_DIR);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write inventory file
  const outputPath = path.resolve(PROJECT_ROOT, API_INVENTORY_PATH);
  fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2) + '\n');

  console.log();
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total routes: ${inventory.routes.length}`);
  console.log(`  - API routes: ${inventory.routes.filter((r) => r.type === 'nextjs').length}`);
  console.log(`  - Netlify functions: ${inventory.routes.filter((r) => r.type === 'netlify').length}`);
  console.log();
  console.log(`Inventory written to: ${API_INVENTORY_PATH}`);
  console.log();

  // Print route type breakdown
  const byMethod: Record<string, number> = {};
  for (const route of inventory.routes) {
    for (const method of route.methods) {
      byMethod[method] = (byMethod[method] || 0) + 1;
    }
  }
  console.log('Methods breakdown:');
  for (const [method, count] of Object.entries(byMethod).sort()) {
    console.log(`  ${method}: ${count}`);
  }
}

// Run main
main();
