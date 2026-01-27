#!/usr/bin/env tsx
/**
 * Schema Drift Tests - Custom Test Harness
 *
 * A lightweight test harness for the schema drift scripts.
 * Uses simple assertions instead of a full test framework.
 * Same pattern as scripts/traceability/__tests__/run.ts
 *
 * Usage:
 *   pnpm schema:test
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
  console.log(`\n${name}`);
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
          console.log(`  OK ${name}`);
        })
        .catch((err) => {
          results.push({ name: fullName, passed: false, error: String(err) });
          console.log(`  FAIL ${name}: ${err}`);
        });
    } else {
      results.push({ name: fullName, passed: true });
      console.log(`  OK ${name}`);
    }
  } catch (err) {
    results.push({ name: fullName, passed: false, error: String(err) });
    console.log(`  FAIL ${name}: ${err}`);
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
        throw new Error(
          `Expected length ${length}, got ${Array.isArray(actual) ? actual.length : 'non-array'}`
        );
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
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

// Expose test helpers globally
Object.assign(globalThis, { describe, test, expect });

// =============================================================================
// Import modules under test
// =============================================================================

import { extractColumns, parseSchemaFile, discoverSchemaFiles } from '../core';

// =============================================================================
// Tests
// =============================================================================

describe('extractColumns', () => {
  test('extracts standard Drizzle types', () => {
    const content = `
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
`;
    const columns = extractColumns(content);
    expect(columns).toContain('id');
    expect(columns).toContain('name');
    expect(columns).toContain('description');
    expect(columns).toContain('created_at');
    expect(columns).toHaveLength(4);
  });

  test('extracts custom pgEnum types', () => {
    const content = `
  id: uuid('id').primaryKey(),
  role: userRoleEnum('role').default('founder'),
  platform: adPlatformEnum('platform').notNull(),
  status: adPlatformStatusEnum('status').default('active'),
`;
    const columns = extractColumns(content);
    expect(columns).toContain('id');
    expect(columns).toContain('role');
    expect(columns).toContain('platform');
    expect(columns).toContain('status');
    expect(columns).toHaveLength(4);
  });

  test('extracts complex types with options', () => {
    const content = `
  id: uuid('id').primaryKey(),
  budget: numeric('budget', { precision: 10, scale: 2 }).default(0),
  hints: jsonb('hints').$type<QuickStartHints>(),
`;
    const columns = extractColumns(content);
    expect(columns).toContain('id');
    expect(columns).toContain('budget');
    expect(columns).toContain('hints');
    expect(columns).toHaveLength(3);
  });

  test('ignores comments', () => {
    const content = `
  // id: uuid('commented_out').primaryKey(),
  name: text('name').notNull(),
  /* description: text('block_comment'), */
`;
    const columns = extractColumns(content);
    expect(columns).toContain('name');
    // Single-line comments should NOT match due to line-start anchor
    expect(columns).toHaveLength(1);
  });

  test('handles timestamp with options', () => {
    const content = `
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
`;
    const columns = extractColumns(content);
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
    expect(columns).toHaveLength(2);
  });
});

describe('parseSchemaFile', () => {
  test('parses simple table', () => {
    const content = `
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
});
`;
    const tables = parseSchemaFile(content, 'users.ts');
    expect(tables).toHaveLength(1);
    expect(tables[0].tableName).toBe('users');
    expect(tables[0].variableName).toBe('users');
    expect(tables[0].columns).toContain('id');
    expect(tables[0].columns).toContain('name');
  });

  test('parses table with custom enum', () => {
    const content = `
import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'user']);

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  role: roleEnum('role').default('user'),
});
`;
    const tables = parseSchemaFile(content, 'users.ts');
    expect(tables).toHaveLength(1);
    expect(tables[0].tableName).toBe('user_profiles');
    expect(tables[0].variableName).toBe('userProfiles');
    expect(tables[0].columns).toContain('id');
    expect(tables[0].columns).toContain('email');
    expect(tables[0].columns).toContain('role');
  });

  test('parses multiple tables in one file', () => {
    const content = `
export const tableA = pgTable('table_a', {
  id: uuid('id').primaryKey(),
});

export const tableB = pgTable('table_b', {
  id: uuid('id').primaryKey(),
  aId: uuid('a_id'),
});
`;
    const tables = parseSchemaFile(content, 'multi.ts');
    expect(tables).toHaveLength(2);
    expect(tables[0].tableName).toBe('table_a');
    expect(tables[1].tableName).toBe('table_b');
  });
});

describe('discoverSchemaFiles', () => {
  test('discovers files from export statements', () => {
    const indexContent = `
export * from './users';
export * from './projects';
export * from './evidence';
`;
    const files = discoverSchemaFiles(indexContent);
    expect(files).toContain('users.ts');
    expect(files).toContain('projects.ts');
    expect(files).toContain('evidence.ts');
    expect(files).toHaveLength(3);
  });

  test('handles double-quoted exports', () => {
    const indexContent = `
export * from "./users";
export * from "./projects";
`;
    const files = discoverSchemaFiles(indexContent);
    expect(files).toContain('users.ts');
    expect(files).toContain('projects.ts');
    expect(files).toHaveLength(2);
  });

  test('ignores non-export lines', () => {
    const indexContent = `
/**
 * Database Schema Index
 */
import { something } from './helper';

export * from './users';
`;
    const files = discoverSchemaFiles(indexContent);
    expect(files).toContain('users.ts');
    expect(files).toHaveLength(1);
  });
});

// =============================================================================
// Run Summary
// =============================================================================

// Wait for any async tests
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

  console.log('\nAll tests passed');
}, 100);
