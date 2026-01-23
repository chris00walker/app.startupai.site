#!/usr/bin/env tsx
/**
 * Traceability Tests - Custom Test Harness
 *
 * A lightweight test harness for the traceability scripts.
 * Uses simple assertions instead of a full test framework.
 *
 * Usage:
 *   pnpm tsx scripts/traceability/__tests__/run.ts
 */

// =============================================================================
// Test Utilities
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];
let currentSuite = '';

function describe(name: string, fn: () => void | Promise<void>) {
  currentSuite = name;
  console.log(`\n📦 ${name}`);
  fn();
}

function test(name: string, fn: () => void | Promise<void>) {
  const fullName = `${currentSuite} > ${name}`;
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          results.push({ name: fullName, passed: true });
          console.log(`  ✅ ${name}`);
        })
        .catch((err) => {
          results.push({ name: fullName, passed: false, error: String(err) });
          console.log(`  ❌ ${name}: ${err}`);
        });
    } else {
      results.push({ name: fullName, passed: true });
      console.log(`  ✅ ${name}`);
    }
  } catch (err) {
    results.push({ name: fullName, passed: false, error: String(err) });
    console.log(`  ❌ ${name}: ${err}`);
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(item: unknown) {
      if (!Array.isArray(actual) || !actual.includes(item)) {
        throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
      }
    },
    toHaveLength(length: number) {
      if (!Array.isArray(actual) || actual.length !== length) {
        throw new Error(`Expected length ${length}, got ${Array.isArray(actual) ? actual.length : 'non-array'}`);
      }
    },
    toMatch(pattern: RegExp) {
      if (typeof actual !== 'string' || !pattern.test(actual)) {
        throw new Error(`Expected string to match ${pattern}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
      }
    },
  };
}

// Expose test helpers for imported test modules
Object.assign(globalThis, { describe, test, expect });

// =============================================================================
// Import modules under test
// =============================================================================

import { ANNOTATION_PATTERN, STORY_ID_PATTERN, classifyFileType, getCategoryForStory } from '../config';

// =============================================================================
// Tests
// =============================================================================

describe('STORY_ID_PATTERN', () => {
  test('matches valid story IDs', () => {
    expect(STORY_ID_PATTERN.test('US-F01')).toBe(true);
    expect(STORY_ID_PATTERN.test('US-C07')).toBe(true);
    expect(STORY_ID_PATTERN.test('US-FT01')).toBe(true);
    expect(STORY_ID_PATTERN.test('US-CT05')).toBe(true);
    expect(STORY_ID_PATTERN.test('US-H09')).toBe(true);
    expect(STORY_ID_PATTERN.test('US-AS01')).toBe(true);
    expect(STORY_ID_PATTERN.test('US-MF03')).toBe(true);
    expect(STORY_ID_PATTERN.test('US-AG01')).toBe(true);
  });

  test('rejects invalid story IDs', () => {
    expect(STORY_ID_PATTERN.test('US-123')).toBe(false);
    expect(STORY_ID_PATTERN.test('F01')).toBe(false);
    expect(STORY_ID_PATTERN.test('US-ABCD01')).toBe(false);
    expect(STORY_ID_PATTERN.test('US-F')).toBe(false);
    expect(STORY_ID_PATTERN.test('')).toBe(false);
  });
});

describe('ANNOTATION_PATTERN', () => {
  test('matches single story annotation', () => {
    const line = '* @story US-F01';
    const pattern = new RegExp(ANNOTATION_PATTERN.source, 'g');
    const match = pattern.exec(line);
    expect(match !== null).toBe(true);
    expect(match![1]).toBe('US-F01');
  });

  test('matches multiple story annotation', () => {
    const line = '* @story US-F01, US-FT01, US-H01';
    const pattern = new RegExp(ANNOTATION_PATTERN.source, 'g');
    const match = pattern.exec(line);
    expect(match !== null).toBe(true);
    expect(match![1]).toBe('US-F01, US-FT01, US-H01');
  });

  test('extracts all IDs from comma-separated list', () => {
    const annotation = 'US-F01, US-FT01, US-H01';
    const ids = annotation.split(/\s*,\s*/).map((id) => id.trim());
    expect(ids).toEqual(['US-F01', 'US-FT01', 'US-H01']);
  });
});

describe('classifyFileType', () => {
  test('classifies component files', () => {
    expect(classifyFileType('frontend/src/components/onboarding/QuickStartForm.tsx')).toBe('component');
    expect(classifyFileType('frontend/src/components/approvals/ApprovalList.tsx')).toBe('component');
  });

  test('classifies API routes', () => {
    expect(classifyFileType('frontend/src/app/api/approvals/route.ts')).toBe('api_route');
    expect(classifyFileType('frontend/src/app/api/projects/[id]/route.ts')).toBe('api_route');
  });

  test('classifies page files', () => {
    expect(classifyFileType('frontend/src/app/approvals/page.tsx')).toBe('page');
    expect(classifyFileType('frontend/src/pages/founder-dashboard.tsx')).toBe('page');
  });

  test('classifies hooks', () => {
    expect(classifyFileType('frontend/src/hooks/useApprovals.ts')).toBe('hook');
    expect(classifyFileType('frontend/src/hooks/useProjects.ts')).toBe('hook');
  });

  test('classifies E2E tests', () => {
    expect(classifyFileType('frontend/tests/e2e/16-quick-start-founder.spec.ts')).toBe('e2e_test');
    expect(classifyFileType('frontend/tests/e2e/05-hitl-approval-flow.spec.ts')).toBe('e2e_test');
  });

  test('classifies unit tests', () => {
    expect(classifyFileType('frontend/src/__tests__/hooks/useApprovals.test.ts')).toBe('unit_test');
    expect(classifyFileType('frontend/src/components/foo.test.tsx')).toBe('unit_test');
  });

  test('classifies lib files', () => {
    expect(classifyFileType('frontend/src/lib/utils.ts')).toBe('lib');
    expect(classifyFileType('frontend/src/lib/supabase/client.ts')).toBe('lib');
  });
});

describe('getCategoryForStory', () => {
  test('returns correct categories', () => {
    expect(getCategoryForStory('US-F01')).toBe('Founder');
    expect(getCategoryForStory('US-C03')).toBe('Consultant');
    expect(getCategoryForStory('US-FT01')).toBe('Founder Trial');
    expect(getCategoryForStory('US-CT03')).toBe('Consultant Trial');
    expect(getCategoryForStory('US-H01')).toBe('HITL Checkpoint');
    expect(getCategoryForStory('US-P01')).toBe('Pivot Flow');
    expect(getCategoryForStory('US-AJ01')).toBe('Agent Journey');
    expect(getCategoryForStory('US-AG01')).toBe('Agent Specs');
    expect(getCategoryForStory('US-E01')).toBe('Edge Case');
    expect(getCategoryForStory('US-A01')).toBe('Admin');
    expect(getCategoryForStory('US-AS01')).toBe('Account Settings');
    expect(getCategoryForStory('US-MF01')).toBe('Marketing Funnel');
  });

  test('returns Unknown for invalid prefixes', () => {
    expect(getCategoryForStory('US-X01')).toBe('Unknown');
    expect(getCategoryForStory('INVALID')).toBe('Unknown');
  });
});

// =============================================================================
// Load Additional Tests
// =============================================================================

async function loadAdditionalTests() {
  await import('./parse-annotations.test');
  await import('./merge-sources.test');
  await import('./validate-overrides.test');
}

loadAdditionalTests()
  .catch((err) => {
    console.log(`\n❌ Failed to load additional tests: ${err}`);
    process.exit(1);
  })
  .finally(() => {
    // Wait for async tests
    setTimeout(() => {
      console.log('\n' + '='.repeat(60));
      const passed = results.filter((r) => r.passed).length;
      const failed = results.filter((r) => !r.passed).length;

      console.log(`Tests: ${passed} passed, ${failed} failed`);

      if (failed > 0) {
        console.log('\nFailed tests:');
        for (const result of results.filter((r) => !r.passed)) {
          console.log(`  - ${result.name}: ${result.error}`);
        }
        process.exit(1);
      }

      console.log('\n✅ All tests passed');
    }, 100);
  });
