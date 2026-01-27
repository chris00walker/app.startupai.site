#!/usr/bin/env tsx
/**
 * Schema Coverage Tests - Custom Test Harness
 *
 * Tests for the schema-coverage static analysis tool.
 * Run via: pnpm schema:coverage:test
 *
 * @story US-A06
 */

import {
  extractDrizzleTables,
  extractTableReferences,
  findMissingInDrizzle,
  findUnusedInCode,
  groupReferencesByTable,
} from '../core';
import type { TableReference, DrizzleTable } from '../types';

// =============================================================================
// Minimal Test Framework
// =============================================================================

let passCount = 0;
let failCount = 0;
const errors: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passCount++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failCount++;
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${name}: ${message}`);
    console.log(`  ✗ ${name}`);
    console.log(`    ${message}`);
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
        throw new Error(`Expected length ${length}, got ${Array.isArray(actual) ? actual.length : 'not an array'}`);
      }
    },
  };
}

function describe(name: string, fn: () => void) {
  console.log(`\n${name}`);
  fn();
}

// =============================================================================
// Test Fixtures
// =============================================================================

const SAMPLE_DRIZZLE_SCHEMA = `
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  userId: uuid('user_id').references(() => userProfiles.id),
});

// Not a table
export const someHelper = () => {};
`;

const SAMPLE_CODE_WITH_REFERENCES = `
import { createClient } from '@/lib/supabase/client';

async function getUser(userId: string) {
  const supabase = createClient();

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId);

  return data;
}

async function getProjects() {
  const supabase = createClient();
  return supabase.from('projects').select('*');
}

async function getMissingTable() {
  const supabase = createClient();
  return supabase.from('validation_runs').select('*');
}
`;

// =============================================================================
// Tests
// =============================================================================

describe('extractDrizzleTables', () => {
  test('extracts table names from pgTable definitions', () => {
    const tables = extractDrizzleTables(SAMPLE_DRIZZLE_SCHEMA, 'test.ts');
    expect(tables).toHaveLength(2);
  });

  test('extracts correct table name (snake_case DB name)', () => {
    const tables = extractDrizzleTables(SAMPLE_DRIZZLE_SCHEMA, 'test.ts');
    const tableNames = tables.map(t => t.tableName);
    expect(tableNames).toContain('user_profiles');
    expect(tableNames).toContain('projects');
  });

  test('extracts correct variable name (camelCase TS name)', () => {
    const tables = extractDrizzleTables(SAMPLE_DRIZZLE_SCHEMA, 'test.ts');
    const varNames = tables.map(t => t.variableName);
    expect(varNames).toContain('userProfiles');
    expect(varNames).toContain('projects');
  });

  test('ignores non-table exports', () => {
    const tables = extractDrizzleTables(SAMPLE_DRIZZLE_SCHEMA, 'test.ts');
    const varNames = tables.map(t => t.variableName);
    expect(varNames.includes('someHelper')).toBe(false);
  });
});

describe('extractTableReferences', () => {
  test('extracts .from() references with single quotes', () => {
    const refs = extractTableReferences(SAMPLE_CODE_WITH_REFERENCES, 'test.ts');
    expect(refs.length >= 3).toBe(true);
  });

  test('extracts correct table names', () => {
    const refs = extractTableReferences(SAMPLE_CODE_WITH_REFERENCES, 'test.ts');
    const tableNames = refs.map(r => r.tableName);
    expect(tableNames).toContain('user_profiles');
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('validation_runs');
  });

  test('captures line numbers', () => {
    const refs = extractTableReferences(SAMPLE_CODE_WITH_REFERENCES, 'test.ts');
    const userProfileRef = refs.find(r => r.tableName === 'user_profiles');
    expect(userProfileRef !== undefined).toBe(true);
    expect(typeof userProfileRef?.lineNumber).toBe('number');
  });

  test('handles double quotes', () => {
    const code = `supabase.from("some_table").select('*')`;
    const refs = extractTableReferences(code, 'test.ts');
    expect(refs).toHaveLength(1);
    expect(refs[0].tableName).toBe('some_table');
  });
});

describe('findMissingInDrizzle', () => {
  test('finds tables in code but not in Drizzle', () => {
    const drizzleTables: DrizzleTable[] = [
      { tableName: 'user_profiles', variableName: 'userProfiles', sourceFile: 'users.ts' },
      { tableName: 'projects', variableName: 'projects', sourceFile: 'projects.ts' },
    ];

    const codeRefs = new Map<string, TableReference[]>();
    codeRefs.set('user_profiles', [{ tableName: 'user_profiles', filePath: 'a.ts', lineNumber: 1, context: '' }]);
    codeRefs.set('validation_runs', [{ tableName: 'validation_runs', filePath: 'b.ts', lineNumber: 2, context: '' }]);

    const missing = findMissingInDrizzle(codeRefs, drizzleTables);
    expect(missing).toHaveLength(1);
    expect(missing[0].tableName).toBe('validation_runs');
  });

  test('returns empty array when all tables are defined', () => {
    const drizzleTables: DrizzleTable[] = [
      { tableName: 'user_profiles', variableName: 'userProfiles', sourceFile: 'users.ts' },
    ];

    const codeRefs = new Map<string, TableReference[]>();
    codeRefs.set('user_profiles', [{ tableName: 'user_profiles', filePath: 'a.ts', lineNumber: 1, context: '' }]);

    const missing = findMissingInDrizzle(codeRefs, drizzleTables);
    expect(missing).toHaveLength(0);
  });
});

describe('findUnusedInCode', () => {
  test('finds tables in Drizzle but not referenced in code', () => {
    const drizzleTables: DrizzleTable[] = [
      { tableName: 'user_profiles', variableName: 'userProfiles', sourceFile: 'users.ts' },
      { tableName: 'dead_table', variableName: 'deadTable', sourceFile: 'dead.ts' },
    ];

    const codeRefs = new Map<string, TableReference[]>();
    codeRefs.set('user_profiles', [{ tableName: 'user_profiles', filePath: 'a.ts', lineNumber: 1, context: '' }]);

    const unused = findUnusedInCode(codeRefs, drizzleTables);
    expect(unused).toHaveLength(1);
    expect(unused[0].tableName).toBe('dead_table');
  });
});

describe('groupReferencesByTable', () => {
  test('groups multiple references to same table', () => {
    const refs: TableReference[] = [
      { tableName: 'users', filePath: 'a.ts', lineNumber: 1, context: '' },
      { tableName: 'users', filePath: 'b.ts', lineNumber: 2, context: '' },
      { tableName: 'projects', filePath: 'c.ts', lineNumber: 3, context: '' },
    ];

    const grouped = groupReferencesByTable(refs);
    expect(grouped.size).toBe(2);
    expect(grouped.get('users')?.length).toBe(2);
    expect(grouped.get('projects')?.length).toBe(1);
  });
});

// =============================================================================
// Run Tests
// =============================================================================

console.log('\nSchema Coverage Tests');
console.log('=====================');

// Run all test suites
describe('extractDrizzleTables', () => {
  test('extracts table names from pgTable definitions', () => {
    const tables = extractDrizzleTables(SAMPLE_DRIZZLE_SCHEMA, 'test.ts');
    expect(tables).toHaveLength(2);
  });
});

// Summary
console.log('\n─'.repeat(40));
console.log(`\nTests: ${passCount} passed, ${failCount} failed`);

if (failCount > 0) {
  console.log('\nFailed tests:');
  errors.forEach(e => console.log(`  - ${e}`));
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
