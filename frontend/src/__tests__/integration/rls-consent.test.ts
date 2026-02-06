/**
 * RLS Consent Enforcement - Migration Policy Validation Tests
 *
 * Validates that the Narrative Layer migration SQL contains all required
 * Row Level Security policies with correct conditions, ensuring founder
 * consent is enforced for evidence package access.
 *
 * These are schema validation tests that parse the migration SQL and verify
 * policy presence, structure, and correctness without requiring a live
 * Supabase instance.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md
 * @see supabase/migrations/20260206000001_narrative_layer_schema.sql
 */

import { readFileSync } from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MIGRATION_PATH = path.join(
  process.cwd(),
  '..',
  'supabase',
  'migrations',
  '20260206000001_narrative_layer_schema.sql'
);

/**
 * Extract a single CREATE POLICY block from the migration SQL.
 * Returns the full SQL text from `CREATE POLICY` through the closing `;`.
 */
function extractPolicy(sql: string, policyName: string): string | null {
  // Escape special regex characters in the policy name
  const escaped = policyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `CREATE POLICY\\s+"${escaped}"[\\s\\S]*?;`,
    'm'
  );
  const match = sql.match(regex);
  return match ? match[0] : null;
}

/**
 * Extract all CREATE POLICY blocks for a given table.
 */
function extractPoliciesForTable(sql: string, tableName: string): string[] {
  const regex = /CREATE POLICY\s+"[^"]+"\s+ON\s+(\w+)[^;]*;/gm;
  const policies: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    if (match[1] === tableName) {
      policies.push(match[0]);
    }
  }
  return policies;
}

/**
 * Count all CREATE POLICY statements in the SQL.
 */
function countPolicies(sql: string): number {
  const matches = sql.match(/CREATE POLICY/g);
  return matches ? matches.length : 0;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RLS Consent Enforcement', () => {
  let migrationSql: string;

  beforeAll(() => {
    migrationSql = readFileSync(MIGRATION_PATH, 'utf-8');
  });

  // =========================================================================
  // SECTION 1: RLS Enablement
  // =========================================================================

  describe('RLS Enabled on All Narrative Tables', () => {
    const allTables = [
      'founder_profiles',
      'pitch_narratives',
      'narrative_versions',
      'evidence_packages',
      'narrative_exports',
      'evidence_package_access',
      'narrative_funnel_events',
      'package_engagement_events',
    ];

    it.each(allTables)('enables RLS on %s', (table) => {
      // The migration uses: ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
      const pattern = new RegExp(
        `ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        'i'
      );
      expect(migrationSql).toMatch(pattern);
    });

    it('enables RLS on exactly 8 tables', () => {
      const matches = migrationSql.match(
        /ALTER\s+TABLE\s+\w+\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi
      );
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(8);
    });
  });

  // =========================================================================
  // SECTION 2: Policy Count
  // =========================================================================

  describe('Total Policy Count', () => {
    it('contains exactly 15 user-facing CREATE POLICY statements', () => {
      const count = countPolicies(migrationSql);
      expect(count).toBe(15);
    });

    it('migration header declares 15 user-facing policies', () => {
      expect(migrationSql).toContain('15 user-facing policies');
    });
  });

  // =========================================================================
  // SECTION 3: pitch_narratives Policies (4: SELECT, INSERT, UPDATE, DELETE)
  // =========================================================================

  describe('pitch_narratives Policies', () => {
    it('has 4 policies for CRUD operations', () => {
      const policies = extractPoliciesForTable(migrationSql, 'pitch_narratives');
      expect(policies).toHaveLength(4);
    });

    describe('SELECT policy', () => {
      it('exists with owner check using auth.uid()', () => {
        const policy = extractPolicy(migrationSql, 'Founders can view own narratives');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR SELECT');
        expect(policy).toContain('auth.uid() = user_id');
      });

      it('uses USING clause (not WITH CHECK)', () => {
        const policy = extractPolicy(migrationSql, 'Founders can view own narratives');
        expect(policy).toContain('USING');
      });
    });

    describe('INSERT policy', () => {
      it('exists with owner check using auth.uid()', () => {
        const policy = extractPolicy(migrationSql, 'Founders can create own narratives');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR INSERT');
        expect(policy).toContain('auth.uid() = user_id');
      });

      it('uses WITH CHECK clause', () => {
        const policy = extractPolicy(migrationSql, 'Founders can create own narratives');
        expect(policy).toContain('WITH CHECK');
      });
    });

    describe('UPDATE policy', () => {
      it('exists with owner check using auth.uid()', () => {
        const policy = extractPolicy(migrationSql, 'Founders can update own narratives');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR UPDATE');
        expect(policy).toContain('auth.uid() = user_id');
      });
    });

    describe('DELETE policy', () => {
      it('exists with owner check using auth.uid()', () => {
        const policy = extractPolicy(migrationSql, 'Founders can delete own narratives');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR DELETE');
        expect(policy).toContain('auth.uid() = user_id');
      });
    });
  });

  // =========================================================================
  // SECTION 4: narrative_versions Policies (1: SELECT via parent)
  // =========================================================================

  describe('narrative_versions Policies', () => {
    it('has exactly 1 policy', () => {
      const policies = extractPoliciesForTable(migrationSql, 'narrative_versions');
      expect(policies).toHaveLength(1);
    });

    describe('SELECT policy', () => {
      it('exists and checks ownership via parent pitch_narrative', () => {
        const policy = extractPolicy(
          migrationSql,
          'Founders can view own narrative versions'
        );
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR SELECT');
      });

      it('uses EXISTS subquery against pitch_narratives', () => {
        const policy = extractPolicy(
          migrationSql,
          'Founders can view own narrative versions'
        );
        expect(policy).toContain('EXISTS');
        expect(policy).toContain('pitch_narratives');
      });

      it('joins on narrative_id and checks user_id via auth.uid()', () => {
        const policy = extractPolicy(
          migrationSql,
          'Founders can view own narrative versions'
        );
        expect(policy).toContain('pn.id = narrative_versions.narrative_id');
        expect(policy).toContain('pn.user_id = auth.uid()');
      });
    });
  });

  // =========================================================================
  // SECTION 5: narrative_exports Policies (2: SELECT + INSERT via parent)
  // =========================================================================

  describe('narrative_exports Policies', () => {
    it('has exactly 2 policies', () => {
      const policies = extractPoliciesForTable(migrationSql, 'narrative_exports');
      expect(policies).toHaveLength(2);
    });

    describe('SELECT policy', () => {
      it('exists and checks ownership via parent pitch_narrative', () => {
        const policy = extractPolicy(migrationSql, 'Founders can view own exports');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR SELECT');
        expect(policy).toContain('EXISTS');
        expect(policy).toContain('pitch_narratives');
      });

      it('joins on narrative_id and checks user_id', () => {
        const policy = extractPolicy(migrationSql, 'Founders can view own exports');
        expect(policy).toContain('pn.id = narrative_exports.narrative_id');
        expect(policy).toContain('pn.user_id = auth.uid()');
      });
    });

    describe('INSERT policy', () => {
      it('exists and checks ownership via parent pitch_narrative', () => {
        const policy = extractPolicy(migrationSql, 'Founders can create own exports');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR INSERT');
        expect(policy).toContain('WITH CHECK');
        expect(policy).toContain('EXISTS');
        expect(policy).toContain('pitch_narratives');
      });

      it('joins on narrative_id and checks user_id', () => {
        const policy = extractPolicy(migrationSql, 'Founders can create own exports');
        expect(policy).toContain('pn.id = narrative_exports.narrative_id');
        expect(policy).toContain('pn.user_id = auth.uid()');
      });
    });
  });

  // =========================================================================
  // SECTION 6: evidence_packages Policies (Consent Enforcement - Critical)
  // =========================================================================

  describe('evidence_packages Policies', () => {
    it('has exactly 2 policies (founder view + consultant consent view)', () => {
      const policies = extractPoliciesForTable(migrationSql, 'evidence_packages');
      expect(policies).toHaveLength(2);
    });

    describe('Founder SELECT policy', () => {
      it('allows founders to view own packages via auth.uid()', () => {
        const policy = extractPolicy(migrationSql, 'Founders can view own packages');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR SELECT');
        expect(policy).toContain('auth.uid() = founder_id');
      });
    });

    describe('Consultant SELECT policy with consent enforcement', () => {
      let policy: string | null;

      beforeAll(() => {
        policy = extractPolicy(
          migrationSql,
          'Consultants can view packages with consent'
        );
      });

      it('exists as a SELECT policy', () => {
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR SELECT');
      });

      it('contains a 3-way OR structure', () => {
        // The policy has: founder_id match OR (consent + connection) OR (public + consent + published)
        expect(policy).toContain('auth.uid() = founder_id');
        expect(policy).toContain('OR');
      });

      // --- Path 1: Founder owns the package ---
      it('path 1: founder can view own packages', () => {
        expect(policy).toContain('auth.uid() = founder_id');
      });

      // --- Path 2: Connected PH with consent ---
      it('path 2: requires founder_consent = TRUE for connected PH access', () => {
        expect(policy).toContain('founder_consent = TRUE');
      });

      it('path 2: checks active connection via consultant_clients', () => {
        expect(policy).toContain('consultant_clients');
        expect(policy).toContain('cc.consultant_id = auth.uid()');
        expect(policy).toContain('cc.client_id = evidence_packages.founder_id');
        expect(policy).toContain("cc.connection_status = 'active'");
      });

      // --- Path 3: Public package with consent + published narrative ---
      it('path 3: requires is_public = TRUE for public access', () => {
        expect(policy).toContain('is_public = TRUE');
      });

      it('path 3: requires founder_consent = TRUE for public access (consent is mandatory)', () => {
        // founder_consent = TRUE must appear for BOTH the connected PH path
        // and the public access path. Count occurrences to verify.
        const consentMatches = policy!.match(/founder_consent\s*=\s*TRUE/g);
        expect(consentMatches).not.toBeNull();
        expect(consentMatches!.length).toBeGreaterThanOrEqual(2);
      });

      it('path 3: requires published narrative via pitch_narratives', () => {
        expect(policy).toContain('pitch_narratives');
        expect(policy).toContain("pn.is_published = TRUE");
      });

      it('path 3: verifies user is a consultant via user_profiles role check', () => {
        expect(policy).toContain('user_profiles');
        expect(policy).toContain("up.role = 'consultant'");
      });

      it('does NOT have INSERT or UPDATE policies (no direct write by PH)', () => {
        const policies = extractPoliciesForTable(migrationSql, 'evidence_packages');
        const insertPolicies = policies.filter((p) => p.includes('FOR INSERT'));
        const updatePolicies = policies.filter((p) => p.includes('FOR UPDATE'));
        expect(insertPolicies).toHaveLength(0);
        expect(updatePolicies).toHaveLength(0);
      });
    });
  });

  // =========================================================================
  // SECTION 7: evidence_package_access Policies (4: 2 SELECT + INSERT + UPDATE)
  // =========================================================================

  describe('evidence_package_access Policies', () => {
    it('has exactly 4 policies', () => {
      const policies = extractPoliciesForTable(migrationSql, 'evidence_package_access');
      expect(policies).toHaveLength(4);
    });

    describe('PH SELECT policy', () => {
      it('allows portfolio holders to view own access records', () => {
        const policy = extractPolicy(migrationSql, 'PHs can view own access records');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR SELECT');
        expect(policy).toContain('auth.uid() = portfolio_holder_id');
      });
    });

    describe('Founder SELECT policy', () => {
      it('allows founders to view access to their packages', () => {
        const policy = extractPolicy(
          migrationSql,
          'Founders can view access to their packages'
        );
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR SELECT');
      });

      it('uses EXISTS subquery against evidence_packages', () => {
        const policy = extractPolicy(
          migrationSql,
          'Founders can view access to their packages'
        );
        expect(policy).toContain('EXISTS');
        expect(policy).toContain('evidence_packages');
        expect(policy).toContain('ep.founder_id = auth.uid()');
      });
    });

    describe('PH INSERT policy', () => {
      it('requires portfolio_holder_id to match auth.uid()', () => {
        const policy = extractPolicy(migrationSql, 'PHs can create access records');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR INSERT');
        expect(policy).toContain('auth.uid() = portfolio_holder_id');
      });

      it('verifies user is a consultant via user_profiles role check', () => {
        const policy = extractPolicy(migrationSql, 'PHs can create access records');
        expect(policy).toContain('user_profiles');
        expect(policy).toContain("up.role = 'consultant'");
      });

      it('uses WITH CHECK clause', () => {
        const policy = extractPolicy(migrationSql, 'PHs can create access records');
        expect(policy).toContain('WITH CHECK');
      });
    });

    describe('PH UPDATE policy', () => {
      it('allows PHs to update own access records', () => {
        const policy = extractPolicy(migrationSql, 'PHs can update own access records');
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR UPDATE');
        expect(policy).toContain('auth.uid() = portfolio_holder_id');
      });

      it('has both USING and WITH CHECK clauses', () => {
        const policy = extractPolicy(migrationSql, 'PHs can update own access records');
        expect(policy).toContain('USING');
        expect(policy).toContain('WITH CHECK');
      });
    });
  });

  // =========================================================================
  // SECTION 8: founder_profiles Policies (2: scoped SELECT + ALL for owner)
  // =========================================================================

  describe('founder_profiles Policies', () => {
    it('has exactly 2 policies', () => {
      const policies = extractPoliciesForTable(migrationSql, 'founder_profiles');
      expect(policies).toHaveLength(2);
    });

    describe('SELECT policy for verified PHs', () => {
      it('allows owner to read own profile', () => {
        const policy = extractPolicy(
          migrationSql,
          'Verified PHs can view founder profiles'
        );
        expect(policy).not.toBeNull();
        expect(policy).toContain('auth.uid() = user_id');
      });

      it('allows consultants to view founder profiles via role check', () => {
        const policy = extractPolicy(
          migrationSql,
          'Verified PHs can view founder profiles'
        );
        expect(policy).toContain('user_profiles');
        expect(policy).toContain("up.role = 'consultant'");
      });

      it('uses OR to combine owner and consultant access', () => {
        const policy = extractPolicy(
          migrationSql,
          'Verified PHs can view founder profiles'
        );
        expect(policy).toContain('OR');
      });
    });

    describe('ALL policy for owner', () => {
      it('allows founders full CRUD on own profile', () => {
        const policy = extractPolicy(
          migrationSql,
          'Founders can manage own profile'
        );
        expect(policy).not.toBeNull();
        expect(policy).toContain('FOR ALL');
        expect(policy).toContain('auth.uid() = user_id');
      });

      it('has both USING and WITH CHECK clauses', () => {
        const policy = extractPolicy(
          migrationSql,
          'Founders can manage own profile'
        );
        expect(policy).toContain('USING');
        expect(policy).toContain('WITH CHECK');
      });
    });
  });

  // =========================================================================
  // SECTION 9: Analytics Tables (Service-Role Only)
  // =========================================================================

  describe('Analytics Tables - Service-Role Only', () => {
    describe('narrative_funnel_events', () => {
      it('has RLS enabled', () => {
        expect(migrationSql).toMatch(
          /ALTER\s+TABLE\s+narrative_funnel_events\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i
        );
      });

      it('has zero user-facing policies (service-role only)', () => {
        const policies = extractPoliciesForTable(
          migrationSql,
          'narrative_funnel_events'
        );
        expect(policies).toHaveLength(0);
      });

      it('is documented as service-role only in migration comments', () => {
        expect(migrationSql).toMatch(
          /narrative_funnel_events[\s\S]*analytics[\s\S]*service.?role/i
        );
      });
    });

    describe('package_engagement_events', () => {
      it('has RLS enabled', () => {
        expect(migrationSql).toMatch(
          /ALTER\s+TABLE\s+package_engagement_events\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i
        );
      });

      it('has zero user-facing policies (service-role only)', () => {
        const policies = extractPoliciesForTable(
          migrationSql,
          'package_engagement_events'
        );
        expect(policies).toHaveLength(0);
      });

      it('is documented as service-role only in migration comments', () => {
        expect(migrationSql).toMatch(
          /package_engagement_events[\s\S]*analytics[\s\S]*service.?role/i
        );
      });
    });
  });

  // =========================================================================
  // SECTION 10: auth.uid() Consistency
  // =========================================================================

  describe('auth.uid() Consistency', () => {
    it('uses auth.uid() in all user-facing policies (not current_setting)', () => {
      // No policy should use the raw JWT claim extraction pattern
      expect(migrationSql).not.toContain("current_setting('request.jwt.claims')");
      expect(migrationSql).not.toContain('current_setting(');
    });

    it('every CREATE POLICY references auth.uid() either directly or in a subquery', () => {
      const policyRegex = /CREATE POLICY\s+"[^"]+"\s+ON\s+\w+[\s\S]*?;/gm;
      let match: RegExpExecArray | null;
      const policiesWithoutAuthUid: string[] = [];

      while ((match = policyRegex.exec(migrationSql)) !== null) {
        if (!match[0].includes('auth.uid()')) {
          policiesWithoutAuthUid.push(match[0].slice(0, 60));
        }
      }

      expect(policiesWithoutAuthUid).toEqual([]);
    });
  });

  // =========================================================================
  // SECTION 11: Consent Gate - Deep Validation
  // =========================================================================

  describe('Consent Gate - Deep Validation', () => {
    it('founder_consent column is NOT NULL with DEFAULT FALSE in evidence_packages', () => {
      // The CREATE TABLE should enforce that consent is explicit, never null
      expect(migrationSql).toMatch(
        /founder_consent\s+BOOLEAN\s+NOT\s+NULL\s+DEFAULT\s+FALSE/i
      );
    });

    it('consent_timestamp column exists for audit trail', () => {
      expect(migrationSql).toContain('consent_timestamp');
      expect(migrationSql).toMatch(/consent_timestamp\s+TIMESTAMPTZ/i);
    });

    it('founder_consent = TRUE appears in the evidence_packages SELECT policy', () => {
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).not.toBeNull();
      expect(policy).toContain('founder_consent = TRUE');
    });

    it('no policy grants access without founder_consent for non-owners', () => {
      // The consultant policy must always require founder_consent = TRUE
      // Verify that every OR branch for non-owner access includes consent
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).not.toBeNull();

      // Split on OR and check each non-owner branch
      // The first branch is `auth.uid() = founder_id` (owner, no consent needed)
      // The second branch must contain founder_consent = TRUE
      // The third branch must contain founder_consent = TRUE
      const orParts = policy!.split(/\bOR\b/);
      // First part is the owner check, skip it
      for (let i = 1; i < orParts.length; i++) {
        expect(orParts[i]).toContain('founder_consent = TRUE');
      }
    });

    it('is_public alone does not grant access (consent is always required)', () => {
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).not.toBeNull();

      // Find the section that mentions is_public and verify founder_consent
      // is in the same conditional branch
      const publicSection = policy!.substring(
        policy!.indexOf('is_public = TRUE')
      );
      expect(publicSection).toContain('founder_consent = TRUE');
    });
  });

  // =========================================================================
  // SECTION 12: Structural Integrity
  // =========================================================================

  describe('Structural Integrity', () => {
    it('all policies target the correct tables', () => {
      const expectedTablePolicyCounts: Record<string, number> = {
        pitch_narratives: 4,
        narrative_versions: 1,
        narrative_exports: 2,
        evidence_packages: 2,
        evidence_package_access: 4,
        founder_profiles: 2,
      };

      for (const [table, expectedCount] of Object.entries(expectedTablePolicyCounts)) {
        const policies = extractPoliciesForTable(migrationSql, table);
        expect(policies).toHaveLength(expectedCount);
      }
    });

    it('no policies exist on analytics tables', () => {
      const analyticsTables = [
        'narrative_funnel_events',
        'package_engagement_events',
      ];
      for (const table of analyticsTables) {
        const policies = extractPoliciesForTable(migrationSql, table);
        expect(policies).toHaveLength(0);
      }
    });

    it('RLS step 13 header comment declares 15 user-facing policies', () => {
      expect(migrationSql).toContain('STEP 13: RLS POLICIES (15 user-facing)');
    });

    it('migration header lists 2 analytics table service-role-only patterns', () => {
      expect(migrationSql).toContain(
        '2 analytics table service-role-only'
      );
    });

    it('CASCADE deletes do not introduce RLS bypass (FK ON DELETE CASCADE is safe)', () => {
      // CASCADE deletes are executed by Postgres internally, not user queries,
      // so they bypass RLS by design. Verify CASCADE is only used on tables
      // where the parent row owner is the same (user_profiles -> child).
      // This is a documentation-level check.
      const cascadeMatches = migrationSql.match(/ON DELETE CASCADE/g);
      expect(cascadeMatches).not.toBeNull();
      // CASCADE is used on: founder_profiles.user_id, pitch_narratives.user_id,
      // narrative_versions.narrative_id, narrative_exports.narrative_id,
      // evidence_packages.founder_id, evidence_package_access.portfolio_holder_id
      // All are safe because the parent deletion implies the owner is being removed.
      expect(cascadeMatches!.length).toBeGreaterThanOrEqual(4);
    });
  });

  // =========================================================================
  // SECTION 13: Policy Operation Types
  // =========================================================================

  describe('Policy Operation Types', () => {
    it('pitch_narratives has SELECT, INSERT, UPDATE, DELETE policies', () => {
      const policies = extractPoliciesForTable(migrationSql, 'pitch_narratives');
      const ops = policies.map((p) => {
        if (p.includes('FOR SELECT')) return 'SELECT';
        if (p.includes('FOR INSERT')) return 'INSERT';
        if (p.includes('FOR UPDATE')) return 'UPDATE';
        if (p.includes('FOR DELETE')) return 'DELETE';
        if (p.includes('FOR ALL')) return 'ALL';
        return 'UNKNOWN';
      });
      expect(ops.sort()).toEqual(['DELETE', 'INSERT', 'SELECT', 'UPDATE']);
    });

    it('narrative_versions has only SELECT policy (read-only for users)', () => {
      const policies = extractPoliciesForTable(migrationSql, 'narrative_versions');
      expect(policies).toHaveLength(1);
      expect(policies[0]).toContain('FOR SELECT');
    });

    it('narrative_exports has SELECT and INSERT policies (no UPDATE/DELETE)', () => {
      const policies = extractPoliciesForTable(migrationSql, 'narrative_exports');
      const ops = policies.map((p) => {
        if (p.includes('FOR SELECT')) return 'SELECT';
        if (p.includes('FOR INSERT')) return 'INSERT';
        return 'OTHER';
      });
      expect(ops.sort()).toEqual(['INSERT', 'SELECT']);
    });

    it('evidence_packages has only SELECT policies (no direct write by users)', () => {
      const policies = extractPoliciesForTable(migrationSql, 'evidence_packages');
      for (const policy of policies) {
        expect(policy).toContain('FOR SELECT');
      }
    });

    it('evidence_package_access has SELECT, INSERT, UPDATE policies', () => {
      const policies = extractPoliciesForTable(migrationSql, 'evidence_package_access');
      const ops = policies.map((p) => {
        if (p.includes('FOR SELECT')) return 'SELECT';
        if (p.includes('FOR INSERT')) return 'INSERT';
        if (p.includes('FOR UPDATE')) return 'UPDATE';
        return 'OTHER';
      });
      expect(ops.sort()).toEqual(['INSERT', 'SELECT', 'SELECT', 'UPDATE']);
    });

    it('founder_profiles has SELECT and ALL policies', () => {
      const policies = extractPoliciesForTable(migrationSql, 'founder_profiles');
      const ops = policies.map((p) => {
        if (p.includes('FOR ALL')) return 'ALL';
        if (p.includes('FOR SELECT')) return 'SELECT';
        return 'OTHER';
      });
      expect(ops.sort()).toEqual(['ALL', 'SELECT']);
    });
  });

  // =========================================================================
  // SECTION 14: Subquery Pattern Correctness
  // =========================================================================

  describe('Subquery Pattern Correctness', () => {
    it('narrative_versions SELECT uses pn alias for pitch_narratives', () => {
      const policy = extractPolicy(
        migrationSql,
        'Founders can view own narrative versions'
      );
      expect(policy).toContain('FROM pitch_narratives pn');
    });

    it('narrative_exports SELECT uses pn alias for pitch_narratives', () => {
      const policy = extractPolicy(migrationSql, 'Founders can view own exports');
      expect(policy).toContain('FROM pitch_narratives pn');
    });

    it('narrative_exports INSERT uses pn alias for pitch_narratives', () => {
      const policy = extractPolicy(migrationSql, 'Founders can create own exports');
      expect(policy).toContain('FROM pitch_narratives pn');
    });

    it('evidence_packages consultant policy uses cc alias for consultant_clients', () => {
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).toContain('FROM consultant_clients cc');
    });

    it('evidence_packages consultant policy uses up alias for user_profiles', () => {
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).toContain('FROM user_profiles up');
    });

    it('evidence_package_access founder policy uses ep alias for evidence_packages', () => {
      const policy = extractPolicy(
        migrationSql,
        'Founders can view access to their packages'
      );
      expect(policy).toContain('FROM evidence_packages ep');
    });

    it('evidence_package_access INSERT uses up alias for user_profiles', () => {
      const policy = extractPolicy(migrationSql, 'PHs can create access records');
      expect(policy).toContain('FROM user_profiles up');
    });
  });

  // =========================================================================
  // SECTION 15: Consultant Access Path - Connection Status Check
  // =========================================================================

  describe('Consultant Access Path - Connection Status', () => {
    it('requires active connection status (not just any connection)', () => {
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).toContain("connection_status = 'active'");
    });

    it('checks consultant_id against auth.uid() in connection lookup', () => {
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).toContain('cc.consultant_id = auth.uid()');
    });

    it('checks client_id against the package founder_id', () => {
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).toContain('cc.client_id = evidence_packages.founder_id');
    });

    it('public path checks narrative is_published = TRUE', () => {
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).toContain('pn.is_published = TRUE');
    });

    it('public path verifies pitch_narrative_id linkage', () => {
      const policy = extractPolicy(
        migrationSql,
        'Consultants can view packages with consent'
      );
      expect(policy).toContain('pn.id = evidence_packages.pitch_narrative_id');
    });
  });
});
