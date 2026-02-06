/**
 * Export Access Control Integration Tests
 *
 * Validates that the migration SQL and API route code contain
 * correct access control logic for narrative exports and public verification.
 *
 * Since we cannot run against a live Supabase instance, these tests
 * verify the structure of migration SQL and API route source code
 * to ensure security policies are correctly defined.
 *
 * Coverage:
 * - RLS policies on narrative_exports table
 * - Export API ownership + auth checks
 * - Verify endpoint public access pattern
 * - Evidence package resolution order
 * - fit_score exclusion from verification response
 * - Exports list API auth requirements
 * - Drizzle schema alignment with migration
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :3092-3199
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const MIGRATION_PATH = path.join(
  REPO_ROOT,
  'supabase',
  'migrations',
  '20260206000001_narrative_layer_schema.sql'
);

const EXPORT_ROUTE_PATH = path.join(
  __dirname, '..', '..', 'app', 'api', 'narrative', '[id]', 'export', 'route.ts'
);

const EXPORTS_LIST_ROUTE_PATH = path.join(
  __dirname, '..', '..', 'app', 'api', 'narrative', '[id]', 'exports', 'route.ts'
);

const VERIFY_ROUTE_PATH = path.join(
  __dirname, '..', '..', 'app', 'api', 'verify', '[token]', 'route.ts'
);

const DRIZZLE_SCHEMA_PATH = path.join(
  __dirname, '..', '..', 'db', 'schema', 'narrative-exports.ts'
);

const VERIFY_TYPES_PATH = path.join(
  __dirname, '..', '..', 'lib', 'narrative', 'types.ts'
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeReadFile(filePath: string): string {
  if (!existsSync(filePath)) {
    return '';
  }
  return readFileSync(filePath, 'utf-8');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Export Access Control', () => {
  let migrationSql: string;

  beforeAll(() => {
    migrationSql = safeReadFile(MIGRATION_PATH);
  });

  // =========================================================================
  // Migration file existence
  // =========================================================================

  it('migration file exists and is non-empty', () => {
    expect(migrationSql.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // narrative_exports RLS policies
  // =========================================================================

  describe('narrative_exports RLS', () => {
    it('enables RLS on narrative_exports table', () => {
      expect(migrationSql).toContain(
        'ALTER TABLE narrative_exports ENABLE ROW LEVEL SECURITY'
      );
    });

    it('defines a SELECT policy on narrative_exports', () => {
      // The migration should have a SELECT policy that restricts reads
      // to rows where the parent pitch_narrative belongs to the auth user.
      expect(migrationSql).toMatch(
        /CREATE POLICY[\s\S]*ON narrative_exports FOR SELECT/
      );
    });

    it('SELECT policy joins to pitch_narratives to check user_id ownership', () => {
      // Extract the SELECT policy block for narrative_exports
      const selectPolicyMatch = migrationSql.match(
        /CREATE POLICY[^;]*ON narrative_exports FOR SELECT[^;]*;/
      );
      expect(selectPolicyMatch).not.toBeNull();

      const selectPolicy = selectPolicyMatch![0];
      // Must reference pitch_narratives and auth.uid()
      expect(selectPolicy).toContain('pitch_narratives');
      expect(selectPolicy).toContain('auth.uid()');
      expect(selectPolicy).toContain('user_id');
    });

    it('defines an INSERT policy on narrative_exports', () => {
      expect(migrationSql).toMatch(
        /CREATE POLICY[\s\S]*ON narrative_exports FOR INSERT/
      );
    });

    it('INSERT policy checks ownership via pitch_narratives join', () => {
      const insertPolicyMatch = migrationSql.match(
        /CREATE POLICY[^;]*ON narrative_exports FOR INSERT[^;]*;/
      );
      expect(insertPolicyMatch).not.toBeNull();

      const insertPolicy = insertPolicyMatch![0];
      expect(insertPolicy).toContain('pitch_narratives');
      expect(insertPolicy).toContain('auth.uid()');
      expect(insertPolicy).toContain('user_id');
    });

    it('does NOT define UPDATE or DELETE policies on narrative_exports', () => {
      // Exports are immutable once created -- no update or delete policy
      expect(migrationSql).not.toMatch(
        /CREATE POLICY[^;]*ON narrative_exports FOR UPDATE/
      );
      expect(migrationSql).not.toMatch(
        /CREATE POLICY[^;]*ON narrative_exports FOR DELETE/
      );
    });

    it('has a unique index on verification_token', () => {
      expect(migrationSql).toContain('idx_narrative_exports_verification_token');
      // Also verify it is a UNIQUE index
      expect(migrationSql).toMatch(
        /CREATE UNIQUE INDEX.*idx_narrative_exports_verification_token/
      );
    });

    it('has an index on narrative_id for efficient lookups', () => {
      expect(migrationSql).toContain('idx_narrative_exports_narrative_id');
    });

    it('verification_token column is UNIQUE at the table level', () => {
      // The CREATE TABLE statement should have UNIQUE on verification_token
      const createTableMatch = migrationSql.match(
        /CREATE TABLE.*narrative_exports[^;]*;/
      );
      expect(createTableMatch).not.toBeNull();
      const createTable = createTableMatch![0];
      expect(createTable).toMatch(/verification_token.*UNIQUE/);
    });
  });

  // =========================================================================
  // Export API access control (POST /api/narrative/:id/export)
  // =========================================================================

  describe('Export API access control', () => {
    let exportRouteCode: string;

    beforeAll(() => {
      exportRouteCode = safeReadFile(EXPORT_ROUTE_PATH);
    });

    it('export route file exists', () => {
      expect(exportRouteCode.length).toBeGreaterThan(0);
    });

    it('requires authentication via supabase.auth.getUser()', () => {
      expect(exportRouteCode).toContain('auth.getUser()');
    });

    it('returns UNAUTHORIZED when user is not authenticated', () => {
      // The route should call narrativeError with UNAUTHORIZED code
      expect(exportRouteCode).toContain("'UNAUTHORIZED'");
    });

    it('checks narrative ownership by comparing user_id', () => {
      // Must verify the narrative belongs to the requesting user
      expect(exportRouteCode).toMatch(
        /narrative\.user_id\s*!==\s*user\.id/
      );
    });

    it('returns FORBIDDEN when user does not own the narrative', () => {
      expect(exportRouteCode).toContain("'FORBIDDEN'");
    });

    it('checks feature flag via checkNarrativeLayerEnabled', () => {
      expect(exportRouteCode).toContain('checkNarrativeLayerEnabled');
    });

    it('validates request body with Zod schema', () => {
      expect(exportRouteCode).toContain('exportSchema.safeParse');
    });

    it('resolves evidence_package_id from narrative-linked package first', () => {
      // Step 1: Query evidence_packages WHERE pitch_narrative_id = :id
      expect(exportRouteCode).toContain("'evidence_packages'");
      expect(exportRouteCode).toContain("'pitch_narrative_id'");
    });

    it('falls back to primary evidence package for the project', () => {
      // Step 2: Fallback to is_primary = TRUE
      expect(exportRouteCode).toContain("'is_primary'");
      expect(exportRouteCode).toContain('true');
    });

    it('returns EVIDENCE_PACKAGE_MISSING when no package exists', () => {
      // Step 3: 422 error
      expect(exportRouteCode).toContain("'EVIDENCE_PACKAGE_MISSING'");
    });

    it('computes generation_hash from narrative data', () => {
      expect(exportRouteCode).toContain('computeNarrativeHash');
    });

    it('uploads export to narrative-exports storage bucket', () => {
      expect(exportRouteCode).toContain("'narrative-exports'");
    });

    it('generates a signed download URL with time-limited access', () => {
      expect(exportRouteCode).toContain('createSignedUrl');
      // Verify a time limit is set (86400 seconds = 24 hours)
      expect(exportRouteCode).toContain('86400');
    });

    it('returns verification_token in the response', () => {
      expect(exportRouteCode).toContain('verification_token');
    });

    it('returns verification_url in the response', () => {
      expect(exportRouteCode).toContain('verification_url');
    });

    it('uses admin client for storage upload and export row insertion', () => {
      // The export route should use an admin/service-role client for writes
      expect(exportRouteCode).toContain('createAdminClient');
    });

    it('exports only pdf and json formats', () => {
      // Verify the Zod schema restricts format
      expect(exportRouteCode).toMatch(/z\.enum\(\[[\s\S]*'pdf'[\s\S]*'json'[\s\S]*\]\)/);
    });
  });

  // =========================================================================
  // Verify endpoint public access (GET /api/verify/:token)
  // =========================================================================

  describe('Verify endpoint public access', () => {
    let verifyRouteCode: string;

    beforeAll(() => {
      verifyRouteCode = safeReadFile(VERIFY_ROUTE_PATH);
    });

    it('verify route file exists', () => {
      expect(verifyRouteCode.length).toBeGreaterThan(0);
    });

    it('does NOT require user authentication', () => {
      // The verify endpoint is public. It should NOT call
      // supabase.auth.getUser() as an access gate.
      // It may import createClient but should NOT use the user-auth version for gating.
      expect(verifyRouteCode).not.toMatch(
        /supabase\.auth\.getUser|createClient\(\)[\s\S]*auth\.getUser/
      );
    });

    it('uses admin/service-role client for token lookup', () => {
      // Should use createAdminClient to bypass RLS
      expect(verifyRouteCode).toContain('createAdminClient');
    });

    it('queries narrative_exports by verification_token', () => {
      expect(verifyRouteCode).toContain("'narrative_exports'");
      expect(verifyRouteCode).toContain("'verification_token'");
    });

    it('returns 404 with status not_found for invalid tokens', () => {
      expect(verifyRouteCode).toContain("'not_found'");
      expect(verifyRouteCode).toMatch(/status:\s*404/);
    });

    it('computes current hash for tamper detection', () => {
      expect(verifyRouteCode).toContain('computeNarrativeHash');
    });

    it('compares generation_hash with current_hash', () => {
      expect(verifyRouteCode).toContain('generation_hash');
      expect(verifyRouteCode).toContain('currentHashMatches');
    });

    it('increments verification_request_count on lookup', () => {
      expect(verifyRouteCode).toContain('verification_request_count');
    });

    it('does NOT expose fit_score in the response', () => {
      // Per spec :3114, fit_score_at_export is intentionally excluded
      // The response construction should NOT contain fit_score as a response field
      const responseBlockMatch = verifyRouteCode.match(
        /const response:\s*VerificationResponse\s*=\s*\{[\s\S]*?\}/
      );
      expect(responseBlockMatch).not.toBeNull();

      const responseBlock = responseBlockMatch![0];
      expect(responseBlock).not.toContain('fit_score');
    });

    it('documents fit_score exclusion in code comments', () => {
      // The route should explicitly document this is intentional
      expect(verifyRouteCode).toMatch(/fit_score.*excluded|excluded.*fit_score/i);
    });

    it('returns request_access_url for portfolio holders', () => {
      expect(verifyRouteCode).toContain('request_access_url');
    });

    it('includes is_edited and alignment_status in response', () => {
      expect(verifyRouteCode).toContain('is_edited');
      expect(verifyRouteCode).toContain('alignment_status');
    });
  });

  // =========================================================================
  // Exports list API (GET /api/narrative/:id/exports)
  // =========================================================================

  describe('Exports list API', () => {
    let exportsListCode: string;

    beforeAll(() => {
      exportsListCode = safeReadFile(EXPORTS_LIST_ROUTE_PATH);
    });

    it('exports list route file exists', () => {
      expect(exportsListCode.length).toBeGreaterThan(0);
    });

    it('requires authentication', () => {
      expect(exportsListCode).toContain('auth.getUser');
    });

    it('checks narrative ownership before listing exports', () => {
      // Must verify the narrative belongs to the user before returning exports
      expect(exportsListCode).toMatch(
        /narrative\.user_id\s*!==\s*user\.id/
      );
    });

    it('returns FORBIDDEN for non-owners', () => {
      expect(exportsListCode).toContain("'FORBIDDEN'");
    });

    it('checks feature flag', () => {
      expect(exportsListCode).toContain('checkNarrativeLayerEnabled');
    });

    it('generates signed URLs for each export', () => {
      expect(exportsListCode).toContain('createSignedUrl');
    });

    it('orders exports by exported_at descending (newest first)', () => {
      expect(exportsListCode).toContain("'exported_at'");
      expect(exportsListCode).toContain('ascending: false');
    });
  });

  // =========================================================================
  // VerificationResponse type contract
  // =========================================================================

  describe('VerificationResponse type contract', () => {
    let typesCode: string;

    beforeAll(() => {
      typesCode = safeReadFile(VERIFY_TYPES_PATH);
    });

    it('types file exists', () => {
      expect(typesCode.length).toBeGreaterThan(0);
    });

    it('defines VerificationResponse interface', () => {
      expect(typesCode).toContain('export interface VerificationResponse');
    });

    it('VerificationResponse has status field with correct union', () => {
      expect(typesCode).toMatch(
        /status:\s*'verified'\s*\|\s*'outdated'\s*\|\s*'not_found'/
      );
    });

    it('VerificationResponse does NOT include fit_score field', () => {
      // Extract just the VerificationResponse interface
      const interfaceMatch = typesCode.match(
        /export interface VerificationResponse\s*\{[\s\S]*?\}/
      );
      expect(interfaceMatch).not.toBeNull();

      const interfaceBody = interfaceMatch![0];
      expect(interfaceBody).not.toContain('fit_score');
    });

    it('VerificationResponse includes all spec-required fields', () => {
      const interfaceMatch = typesCode.match(
        /export interface VerificationResponse\s*\{[\s\S]*?\}/
      );
      expect(interfaceMatch).not.toBeNull();

      const interfaceBody = interfaceMatch![0];
      const requiredFields = [
        'status',
        'exported_at',
        'venture_name',
        'evidence_id',
        'generation_hash',
        'current_hash',
        'current_hash_matches',
        'evidence_generated_at',
        'validation_stage_at_export',
        'is_edited',
        'alignment_status',
        'request_access_url',
      ];

      for (const field of requiredFields) {
        expect(interfaceBody).toContain(field);
      }
    });
  });

  // =========================================================================
  // Drizzle schema alignment
  // =========================================================================

  describe('Drizzle schema alignment', () => {
    let drizzleSchema: string;

    beforeAll(() => {
      drizzleSchema = safeReadFile(DRIZZLE_SCHEMA_PATH);
    });

    it('Drizzle schema file exists', () => {
      expect(drizzleSchema.length).toBeGreaterThan(0);
    });

    it('defines narrativeExports table', () => {
      expect(drizzleSchema).toContain("'narrative_exports'");
    });

    it('includes verification_token column with unique constraint', () => {
      expect(drizzleSchema).toContain('verification_token');
      expect(drizzleSchema).toContain('.unique()');
    });

    it('references pitchNarratives foreign key', () => {
      expect(drizzleSchema).toContain('pitchNarratives');
      expect(drizzleSchema).toContain("onDelete: 'cascade'");
    });

    it('references evidencePackages foreign key', () => {
      expect(drizzleSchema).toContain('evidencePackages');
    });

    it('includes all required columns from the migration', () => {
      const requiredColumns = [
        'narrative_id',
        'verification_token',
        'generation_hash',
        'evidence_package_id',
        'venture_name_at_export',
        'validation_stage_at_export',
        'export_format',
        'storage_path',
        'qr_code_included',
        'exported_at',
      ];

      for (const column of requiredColumns) {
        expect(drizzleSchema).toContain(column);
      }
    });

    it('defines both unique and non-unique indexes', () => {
      expect(drizzleSchema).toContain('uniqueIndex');
      expect(drizzleSchema).toContain("'idx_narrative_exports_verification_token'");
      expect(drizzleSchema).toContain("'idx_narrative_exports_narrative_id'");
    });

    it('exports type definitions for select and insert', () => {
      expect(drizzleSchema).toContain('NarrativeExportRow');
      expect(drizzleSchema).toContain('NewNarrativeExportRow');
    });
  });

  // =========================================================================
  // Migration: evidence_packages RLS (relevant for export flow)
  // =========================================================================

  describe('evidence_packages RLS (export dependency)', () => {
    it('enables RLS on evidence_packages table', () => {
      expect(migrationSql).toContain(
        'ALTER TABLE evidence_packages ENABLE ROW LEVEL SECURITY'
      );
    });

    it('founders can view their own packages', () => {
      const founderPolicyMatch = migrationSql.match(
        /CREATE POLICY "Founders can view own packages"[^;]*;/
      );
      expect(founderPolicyMatch).not.toBeNull();

      const policy = founderPolicyMatch![0];
      expect(policy).toContain('evidence_packages');
      expect(policy).toContain('auth.uid()');
      expect(policy).toContain('founder_id');
    });

    it('has a partial unique index for one primary package per project', () => {
      expect(migrationSql).toContain('idx_evidence_packages_primary_per_project');
      expect(migrationSql).toMatch(
        /CREATE UNIQUE INDEX[\s\S]*idx_evidence_packages_primary_per_project[\s\S]*WHERE is_primary = TRUE/
      );
    });
  });

  // =========================================================================
  // Cross-cutting: export format constraint in migration
  // =========================================================================

  describe('Export format constraints', () => {
    it('migration enforces valid_export_format CHECK constraint', () => {
      expect(migrationSql).toContain('valid_export_format');
      expect(migrationSql).toMatch(/CHECK[\s\S]*export_format[\s\S]*IN[\s\S]*'pdf'[\s\S]*'pptx'[\s\S]*'json'/);
    });

    it('narrative_exports requires evidence_package_id NOT NULL', () => {
      // Find the narrative_exports table definition by looking for the specific
      // column within a reasonable context window
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS narrative_exports');
      // evidence_package_id should appear with NOT NULL constraint
      const tableStart = migrationSql.indexOf('CREATE TABLE IF NOT EXISTS narrative_exports');
      const tableSection = migrationSql.substring(tableStart, tableStart + 1500);
      expect(tableSection).toMatch(/evidence_package_id\s+UUID\s+NOT NULL/);
    });

    it('narrative_exports has ON DELETE CASCADE from pitch_narratives', () => {
      const tableStart = migrationSql.indexOf('CREATE TABLE IF NOT EXISTS narrative_exports');
      expect(tableStart).toBeGreaterThan(-1);
      const tableSection = migrationSql.substring(tableStart, tableStart + 1500);
      expect(tableSection).toContain('ON DELETE CASCADE');
    });
  });
});
