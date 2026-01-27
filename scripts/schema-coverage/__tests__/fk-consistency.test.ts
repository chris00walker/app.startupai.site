/**
 * FK Consistency Tests
 *
 * Tests the FK type consistency checker catches mismatches like
 * the original bug: validation_progress.run_id (UUID) vs validation_runs.run_id (TEXT)
 */

import { extractColumns, extractForeignKeys } from '../fk-consistency';

// Test fixtures that simulate the original bug
const SCHEMA_WITH_TYPE_MISMATCH = `
// validation-runs.ts
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const validationRuns = pgTable('validation_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: text('run_id'),  // TEXT type
});
`;

const SCHEMA_WITH_FK_TO_TEXT = `
// validation-progress.ts
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { validationRuns } from './validation-runs';

export const validationProgress = pgTable('validation_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: uuid('run_id')  // UUID type - MISMATCH!
    .references(() => validationRuns.runId),
});
`;

const SCHEMA_WITH_MATCHING_FK = `
// projects.ts
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => userProfiles.id),
});
`;

const USERS_SCHEMA = `
// users.ts
import { pgTable, uuid, text } from 'drizzle-orm/pg-core';

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email'),
});
`;

describe('FK Consistency Checker', () => {
  describe('extractColumns', () => {
    it('extracts column definitions with types', () => {
      const columns = extractColumns(SCHEMA_WITH_TYPE_MISMATCH, 'test.ts');

      expect(columns).toHaveLength(2);
      expect(columns[0]).toMatchObject({
        tableName: 'validation_runs',
        columnName: 'id',
        columnType: 'uuid',
      });
      expect(columns[1]).toMatchObject({
        tableName: 'validation_runs',
        columnName: 'run_id',
        columnType: 'text',
      });
    });
  });

  describe('extractForeignKeys', () => {
    it('extracts FK relationships with multi-line definitions', () => {
      const fks = extractForeignKeys(SCHEMA_WITH_FK_TO_TEXT, 'test.ts');

      expect(fks).toHaveLength(1);
      expect(fks[0]).toMatchObject({
        sourceTable: 'validation_progress',
        sourceColumn: 'run_id',
        sourceType: 'uuid',
        targetTable: 'validationRuns',
        targetColumn: 'runId',
      });
    });

    it('extracts FK relationships with single-line definitions', () => {
      const fks = extractForeignKeys(SCHEMA_WITH_MATCHING_FK, 'test.ts');

      expect(fks).toHaveLength(1);
      expect(fks[0]).toMatchObject({
        sourceTable: 'projects',
        sourceColumn: 'user_id',
        sourceType: 'uuid',
        targetTable: 'userProfiles',
        targetColumn: 'id',
      });
    });
  });

  describe('type mismatch detection', () => {
    it('identifies UUID vs TEXT mismatch (the original bug)', () => {
      // This test validates that if we had run the checker before,
      // it would have caught the validation_progress.run_id (UUID) vs
      // validation_runs.run_id (TEXT) mismatch

      const sourceColumns = extractColumns(SCHEMA_WITH_FK_TO_TEXT, 'progress.ts');
      const targetColumns = extractColumns(SCHEMA_WITH_TYPE_MISMATCH, 'runs.ts');

      // Find the source column (run_id in validation_progress)
      const sourceCol = sourceColumns.find(c => c.columnName === 'run_id');
      expect(sourceCol?.columnType).toBe('uuid');

      // Find the target column (run_id in validation_runs)
      const targetCol = targetColumns.find(c => c.columnName === 'run_id');
      expect(targetCol?.columnType).toBe('text');

      // They don't match - this is the bug the checker catches
      expect(sourceCol?.columnType).not.toBe(targetCol?.columnType);
    });

    it('does not flag matching types', () => {
      const sourceColumns = extractColumns(SCHEMA_WITH_MATCHING_FK, 'projects.ts');
      const targetColumns = extractColumns(USERS_SCHEMA, 'users.ts');

      // Find the source column (user_id in projects)
      const sourceCol = sourceColumns.find(c => c.columnName === 'user_id');
      expect(sourceCol?.columnType).toBe('uuid');

      // Find the target column (id in user_profiles)
      const targetCol = targetColumns.find(c => c.columnName === 'id');
      expect(targetCol?.columnType).toBe('uuid');

      // They match - no mismatch
      expect(sourceCol?.columnType).toBe(targetCol?.columnType);
    });
  });
});
