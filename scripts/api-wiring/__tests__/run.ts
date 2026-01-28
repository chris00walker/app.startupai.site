#!/usr/bin/env tsx
/**
 * API Wiring Validation System - Test Suite
 *
 * Tests for route extraction, call extraction, inventory merge, and reconciliation.
 *
 * Usage:
 *   pnpm api-wiring:test
 *   pnpm exec tsx scripts/api-wiring/__tests__/run.ts
 */

import {
  extractRoutePath,
  extractHttpMethods,
  extractNetlifyFunction,
  determineRouteType,
  extractApiCalls,
  extractE2EMocks,
  normalizePath,
  normalizeTemplatePath,
  normalizeExternalUrl,
  routePathToRegex,
  findMatchingRoutes,
  findMatchingMergedRoute,
  mergeInventories,
  isCompatibleSchema,
  extractSupabaseTables,
  extractModalEndpoints,
  classifyOrphan,
  extractStoryAnnotations,
} from '../core';
import type { RouteEntry, APIInventory, MergedRoute, CallerReference } from '../schema';

// =============================================================================
// Test Runner
// =============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } catch (error) {
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    ${error}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      message || `Expected ${expectedStr}, got ${actualStr}`
    );
  }
}

function assertIncludes<T>(array: T[], item: T, message?: string) {
  if (!array.includes(item)) {
    throw new Error(
      message || `Expected array to include ${JSON.stringify(item)}`
    );
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true');
  }
}

function assertFalse(condition: boolean, message?: string) {
  if (condition) {
    throw new Error(message || 'Expected condition to be false');
  }
}

// =============================================================================
// Route Extraction Tests
// =============================================================================

function testRouteExtraction() {
  console.log('\nRoute Extraction:');

  test('extracts App Router route path', () => {
    assertEqual(
      extractRoutePath('frontend/src/app/api/projects/route.ts'),
      '/api/projects'
    );
  });

  test('extracts App Router route with dynamic segment', () => {
    assertEqual(
      extractRoutePath('frontend/src/app/api/projects/[id]/route.ts'),
      '/api/projects/[id]'
    );
  });

  test('extracts nested App Router route', () => {
    assertEqual(
      extractRoutePath('frontend/src/app/api/clients/[id]/tasks/route.ts'),
      '/api/clients/[id]/tasks'
    );
  });

  test('extracts Pages Router route path', () => {
    assertEqual(
      extractRoutePath('frontend/src/pages/api/auth/login.ts'),
      '/api/auth/login'
    );
  });

  test('handles Pages Router index file', () => {
    assertEqual(
      extractRoutePath('frontend/src/pages/api/projects/index.ts'),
      '/api/projects'
    );
  });

  test('returns null for non-route files', () => {
    assertEqual(
      extractRoutePath('frontend/src/components/Button.tsx'),
      null
    );
  });
}

// =============================================================================
// HTTP Method Extraction Tests
// =============================================================================

function testHttpMethodExtraction() {
  console.log('\nHTTP Method Extraction:');

  test('extracts single GET method', () => {
    const content = 'export async function GET(request: Request) { }';
    assertIncludes(extractHttpMethods(content), 'GET');
  });

  test('extracts multiple methods', () => {
    const content = `
      export async function GET(request: Request) { }
      export async function POST(request: Request) { }
      export async function DELETE(request: Request) { }
    `;
    const methods = extractHttpMethods(content);
    assertIncludes(methods, 'GET');
    assertIncludes(methods, 'POST');
    assertIncludes(methods, 'DELETE');
  });

  test('extracts const-style handlers', () => {
    const content = 'export const PUT = async (request: Request) => { }';
    assertIncludes(extractHttpMethods(content), 'PUT');
  });

  test('defaults to GET when no methods found', () => {
    const content = 'console.log("no methods")';
    assertEqual(extractHttpMethods(content), ['GET']);
  });
}

// =============================================================================
// Netlify Function Extraction Tests
// =============================================================================

function testNetlifyFunctionExtraction() {
  console.log('\nNetlify Function Extraction:');

  test('extracts Netlify function name', () => {
    assertEqual(
      extractNetlifyFunction('netlify/functions/crew-analyze.ts'),
      'crew-analyze'
    );
  });

  test('extracts from backend directory', () => {
    assertEqual(
      extractNetlifyFunction('backend/netlify/functions/gate-evaluate.ts'),
      'gate-evaluate'
    );
  });

  test('returns null for non-function files', () => {
    assertEqual(
      extractNetlifyFunction('frontend/src/lib/utils.ts'),
      null
    );
  });
}

// =============================================================================
// Call Extraction Tests
// =============================================================================

function testCallExtraction() {
  console.log('\nCall Extraction:');

  test('extracts direct fetch call', () => {
    const content = `fetch('/api/projects')`;
    const calls = extractApiCalls(content, 'test.ts');
    assertTrue(calls.some(c => c.type === 'resolved' && c.path === '/api/projects'));
  });

  test('extracts fetch with double quotes', () => {
    const content = `fetch("/api/users")`;
    const calls = extractApiCalls(content, 'test.ts');
    assertTrue(calls.some(c => c.type === 'resolved' && c.path === '/api/users'));
  });

  test('extracts template literal fetch', () => {
    const content = 'fetch(`/api/projects/${id}`)';
    const calls = extractApiCalls(content, 'test.ts');
    assertTrue(calls.some(c => c.type === 'resolved' && c.path === '/api/projects/[param]'));
  });

  test('extracts API wrapper call', () => {
    const content = `api.get('/projects')`;
    const calls = extractApiCalls(content, 'test.ts');
    assertTrue(calls.some(c => c.type === 'resolved' && c.path === '/api/projects'));
  });

  test('extracts API wrapper with template literal', () => {
    const content = 'api.post(`/projects/${projectId}`)';
    const calls = extractApiCalls(content, 'test.ts');
    assertTrue(calls.some(c => c.type === 'resolved' && c.path === '/api/projects/[param]'));
  });

  test('extracts Netlify function call', () => {
    const content = `fetch('/.netlify/functions/crew-analyze')`;
    const calls = extractApiCalls(content, 'test.ts');
    assertTrue(calls.some(c =>
      c.type === 'resolved' &&
      c.path === '/.netlify/functions/crew-analyze' &&
      c.style === 'netlify'
    ));
  });

  test('extracts external URL call', () => {
    const content = `fetch('https://startupai--crew.modal.run/kickoff')`;
    const calls = extractApiCalls(content, 'test.ts');
    assertTrue(calls.some(c =>
      c.type === 'resolved' &&
      c.path === 'external://startupai-crew/kickoff' &&
      c.style === 'external'
    ));
  });

  test('skips variable-based URLs', () => {
    const content = 'fetch(`${baseUrl}/api/projects`)';
    const calls = extractApiCalls(content, 'test.ts');
    assertTrue(calls.some(c => c.type === 'skipped' && c.reason === 'variable_prefix'));
  });

  test('skips runtime function calls', () => {
    const content = 'fetch(`/api/${getEndpoint()}`)';
    const calls = extractApiCalls(content, 'test.ts');
    assertTrue(calls.some(c => c.type === 'skipped' && c.reason === 'runtime_function'));
  });
}

// =============================================================================
// Path Normalization Tests
// =============================================================================

function testPathNormalization() {
  console.log('\nPath Normalization:');

  test('removes trailing slash', () => {
    assertEqual(normalizePath('/api/projects/'), '/api/projects');
  });

  test('removes query string', () => {
    assertEqual(normalizePath('/api/projects?page=1'), '/api/projects');
  });

  test('normalizes template variables', () => {
    assertEqual(normalizeTemplatePath('/api/projects/${id}'), '/api/projects/[param]');
  });

  test('handles multiple template variables', () => {
    assertEqual(
      normalizeTemplatePath('/api/projects/${projectId}/tasks/${taskId}'),
      '/api/projects/[param]/tasks/[param]'
    );
  });
}

// =============================================================================
// External URL Normalization Tests
// =============================================================================

function testExternalUrlNormalization() {
  console.log('\nExternal URL Normalization:');

  test('normalizes Modal URL', () => {
    const result = normalizeExternalUrl('https://startupai--crew.modal.run/kickoff');
    assertEqual(result?.repo, 'startupai-crew');
    assertEqual(result?.route, '/kickoff');
  });

  test('normalizes Modal dev URL', () => {
    const result = normalizeExternalUrl('https://startupai--crew-dev.modal.run/status');
    assertEqual(result?.repo, 'startupai-crew');
    assertEqual(result?.route, '/status');
  });

  test('normalizes marketing URL', () => {
    const result = normalizeExternalUrl('https://startupai.site/api/newsletter');
    assertEqual(result?.repo, 'startupai.site');
    assertEqual(result?.route, '/api/newsletter');
  });

  test('returns null for unknown external URL', () => {
    const result = normalizeExternalUrl('https://api.stripe.com/v1/charges');
    assertEqual(result, null);
  });
}

// =============================================================================
// Route Matching Tests
// =============================================================================

function testRouteMatching() {
  console.log('\nRoute Matching:');

  test('matches exact route', () => {
    const regex = routePathToRegex('/api/projects');
    assertTrue(regex.test('/api/projects'));
    assertFalse(regex.test('/api/projects/123'));
  });

  test('matches dynamic segment', () => {
    const regex = routePathToRegex('/api/projects/[id]');
    assertTrue(regex.test('/api/projects/123'));
    assertTrue(regex.test('/api/projects/abc'));
    assertFalse(regex.test('/api/projects'));
    assertFalse(regex.test('/api/projects/123/tasks'));
  });

  test('matches nested dynamic segments', () => {
    const regex = routePathToRegex('/api/projects/[id]/tasks/[taskId]');
    assertTrue(regex.test('/api/projects/123/tasks/456'));
  });

  test('matches spread segment', () => {
    const regex = routePathToRegex('/api/files/[...path]');
    assertTrue(regex.test('/api/files/foo'));
    assertTrue(regex.test('/api/files/foo/bar/baz'));
  });

  test('matches [param] from normalized calls', () => {
    const regex = routePathToRegex('/api/projects/[id]');
    // [param] should match [id]
    assertTrue(regex.test('/api/projects/test-id'));
  });
}

// =============================================================================
// Inventory Merge Tests
// =============================================================================

function testInventoryMerge() {
  console.log('\nInventory Merge:');

  test('merges local routes', () => {
    const localRoutes: RouteEntry[] = [
      {
        path: '/api/projects',
        methods: ['GET', 'POST'],
        type: 'nextjs',
        source_file: 'test.ts',
        callers: [],
        outbound: { supabase_tables: [], modal_endpoints: [], api_routes: [] },
        e2e_coverage: [],
        stories: [],
      },
    ];
    const merged = mergeInventories(localRoutes, []);
    assertEqual(merged.length, 1);
    assertEqual(merged[0].repo, 'app.startupai.site');
  });

  test('merges external inventory', () => {
    const localRoutes: RouteEntry[] = [];
    const external: APIInventory[] = [
      {
        schema_version: '1.0',
        repo: 'startupai-crew',
        generated_at: '2024-01-01T00:00:00Z',
        routes: [
          { path: '/kickoff', methods: ['POST'], type: 'modal' },
        ],
      },
    ];
    const merged = mergeInventories(localRoutes, external);
    assertEqual(merged.length, 1);
    assertEqual(merged[0].repo, 'startupai-crew');
    assertEqual(merged[0].path, '/kickoff');
  });

  test('merges both local and external', () => {
    const localRoutes: RouteEntry[] = [
      {
        path: '/api/projects',
        methods: ['GET'],
        type: 'nextjs',
        source_file: 'test.ts',
        callers: [],
        outbound: { supabase_tables: [], modal_endpoints: [], api_routes: [] },
        e2e_coverage: [],
        stories: [],
      },
    ];
    const external: APIInventory[] = [
      {
        schema_version: '1.0',
        repo: 'startupai-crew',
        generated_at: '2024-01-01T00:00:00Z',
        routes: [
          { path: '/kickoff', methods: ['POST'], type: 'modal' },
          { path: '/status', methods: ['GET'], type: 'modal' },
        ],
      },
    ];
    const merged = mergeInventories(localRoutes, external);
    assertEqual(merged.length, 3);
    assertTrue(merged.some(r => r.repo === 'app.startupai.site'));
    assertTrue(merged.some(r => r.repo === 'startupai-crew'));
  });
}

// =============================================================================
// Schema Version Tests
// =============================================================================

function testSchemaVersion() {
  console.log('\nSchema Version:');

  test('accepts 1.0', () => {
    assertTrue(isCompatibleSchema('1.0'));
  });

  test('accepts 1.1', () => {
    assertTrue(isCompatibleSchema('1.1'));
  });

  test('accepts 1.x pattern', () => {
    assertTrue(isCompatibleSchema('1.2'));
    assertTrue(isCompatibleSchema('1.9'));
  });

  test('rejects 2.0', () => {
    assertFalse(isCompatibleSchema('2.0'));
  });

  test('rejects invalid version', () => {
    assertFalse(isCompatibleSchema('invalid'));
  });
}

// =============================================================================
// Dependency Extraction Tests
// =============================================================================

function testDependencyExtraction() {
  console.log('\nDependency Extraction:');

  test('extracts Supabase table from .from()', () => {
    const content = `const data = await supabase.from('projects').select()`;
    const tables = extractSupabaseTables(content);
    assertIncludes(tables, 'projects');
  });

  test('extracts multiple Supabase tables', () => {
    const content = `
      await supabase.from('projects').select()
      await supabase.from('users').select()
      await supabase.from('tasks').insert({})
    `;
    const tables = extractSupabaseTables(content);
    assertIncludes(tables, 'projects');
    assertIncludes(tables, 'users');
    assertIncludes(tables, 'tasks');
  });

  test('extracts Modal endpoints', () => {
    const content = `fetch('https://startupai--crew.modal.run/kickoff')`;
    const endpoints = extractModalEndpoints(content);
    assertIncludes(endpoints, 'kickoff');
  });
}

// =============================================================================
// Orphan Classification Tests
// =============================================================================

function testOrphanClassification() {
  console.log('\nOrphan Classification:');

  test('classifies test-only orphan', () => {
    const callers: CallerReference[] = [
      { file: 'src/__tests__/api.test.ts', line: 10, context: '', call_style: 'fetch' },
    ];
    assertEqual(classifyOrphan('/api/test', callers), 'test_only');
  });

  test('classifies webhook as external_caller', () => {
    const callers: CallerReference[] = [
      { file: 'src/components/Button.tsx', line: 10, context: '', call_style: 'fetch' },
    ];
    assertEqual(classifyOrphan('/api/webhook/stripe', callers), 'external_caller');
  });

  test('classifies dead code', () => {
    assertEqual(classifyOrphan('/api/unused', []), 'dead_code');
  });

  test('classifies unknown', () => {
    const callers: CallerReference[] = [
      { file: 'src/components/Button.tsx', line: 10, context: '', call_style: 'fetch' },
    ];
    assertEqual(classifyOrphan('/api/unknown', callers), 'unknown');
  });
}

// =============================================================================
// Story Annotation Tests
// =============================================================================

function testStoryAnnotations() {
  console.log('\nStory Annotations:');

  test('extracts single story annotation', () => {
    const content = `
      /**
       * Component description
       * @story US-F01
       */
    `;
    const stories = extractStoryAnnotations(content);
    assertIncludes(stories, 'US-F01');
  });

  test('extracts multiple story annotations', () => {
    const content = `
      /**
       * @story US-F01, US-F02
       */
    `;
    const stories = extractStoryAnnotations(content);
    assertIncludes(stories, 'US-F01');
    assertIncludes(stories, 'US-F02');
  });

  test('handles various story prefixes', () => {
    const content = `
      /**
       * @story US-FT01, US-CT02, US-H03
       */
    `;
    const stories = extractStoryAnnotations(content);
    assertIncludes(stories, 'US-FT01');
    assertIncludes(stories, 'US-CT02');
    assertIncludes(stories, 'US-H03');
  });
}

// =============================================================================
// E2E Mock Extraction Tests
// =============================================================================

function testE2EMockExtraction() {
  console.log('\nE2E Mock Extraction:');

  test('extracts specific mock', () => {
    const content = `page.route('**/api/projects/**', async route => {})`;
    const mocks = extractE2EMocks(content, 'test.spec.ts');
    assertTrue(mocks.some(m => m.pattern.includes('api/projects')));
  });

  test('identifies wildcard mock', () => {
    const content = `page.route('**/api/**', async route => {})`;
    const mocks = extractE2EMocks(content, 'test.spec.ts');
    assertTrue(mocks.some(m => m.is_wildcard));
  });

  test('extracts normalized path', () => {
    const content = `page.route('**/api/projects/123', async route => {})`;
    const mocks = extractE2EMocks(content, 'test.spec.ts');
    assertTrue(mocks.some(m => m.normalized_path?.includes('/api/projects')));
  });

  test('extracts external mock normalization', () => {
    const content = `page.route('**/startupai--crew.modal.run/kickoff', async route => {})`;
    const mocks = extractE2EMocks(content, 'test.spec.ts');
    assertTrue(mocks.some(m => m.normalized_path === 'external://startupai-crew/kickoff'));
  });

  test('treats external domain wildcard as wildcard', () => {
    const content = `page.route('**/startupai--crew.modal.run/**', async route => {})`;
    const mocks = extractE2EMocks(content, 'test.spec.ts');
    assertTrue(mocks.some(m => m.is_wildcard));
  });
}

// =============================================================================
// Merged Route Matching Tests
// =============================================================================

function testMergedRouteMatching() {
  console.log('\nMerged Route Matching:');

  const mergedRoutes: MergedRoute[] = [
    { path: '/api/projects', methods: ['GET'], type: 'nextjs', repo: 'app.startupai.site' },
    { path: '/api/projects/[id]', methods: ['GET'], type: 'nextjs', repo: 'app.startupai.site' },
    { path: '/kickoff', methods: ['POST'], type: 'modal', repo: 'startupai-crew', base_url: 'https://startupai--crew.modal.run' },
    { path: '/status', methods: ['GET'], type: 'modal', repo: 'startupai-crew', base_url: 'https://startupai--crew.modal.run' },
  ];

  test('matches local route', () => {
    const match = findMatchingMergedRoute('/api/projects', mergedRoutes);
    assertEqual(match?.path, '/api/projects');
    assertEqual(match?.repo, 'app.startupai.site');
  });

  test('matches local route with dynamic segment', () => {
    const match = findMatchingMergedRoute('/api/projects/123', mergedRoutes);
    assertEqual(match?.path, '/api/projects/[id]');
  });

  test('matches external route', () => {
    const match = findMatchingMergedRoute('external://startupai-crew/kickoff', mergedRoutes);
    assertEqual(match?.path, '/kickoff');
    assertEqual(match?.repo, 'startupai-crew');
  });

  test('returns null for unmatched route', () => {
    const match = findMatchingMergedRoute('/api/nonexistent', mergedRoutes);
    assertEqual(match, null);
  });
}

// =============================================================================
// Main Test Runner
// =============================================================================

function main() {
  console.log('='.repeat(60));
  console.log('API Wiring Validation System - Test Suite');
  console.log('='.repeat(60));

  testRouteExtraction();
  testHttpMethodExtraction();
  testNetlifyFunctionExtraction();
  testCallExtraction();
  testPathNormalization();
  testExternalUrlNormalization();
  testRouteMatching();
  testInventoryMerge();
  testSchemaVersion();
  testDependencyExtraction();
  testOrphanClassification();
  testStoryAnnotations();
  testE2EMockExtraction();
  testMergedRouteMatching();

  console.log();
  console.log('='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

main();
