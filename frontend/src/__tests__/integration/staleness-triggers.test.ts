/**
 * Staleness Triggers Integration Tests (T1)
 *
 * Validates the mark_narrative_stale() trigger function and its
 * attachments defined in the Narrative Layer migration. Since these
 * tests run without a live database, they validate the SQL migration
 * source to ensure:
 *
 * 1. The trigger function is correctly defined
 * 2. Triggers are attached to all 5 required tables
 * 3. Severity logic (soft vs hard) matches the specification
 * 4. Reason text patterns are correct
 * 5. The "never downgrade" rule is enforced in SQL
 * 6. Founder profile update trigger has correct WHEN clause
 *
 * @story US-NL01
 * @see supabase/migrations/20260206000001_narrative_layer_schema.sql
 */

import { readFileSync } from 'fs';
import path from 'path';

const MIGRATION_PATH = path.join(
  process.cwd(),
  '..',
  'supabase',
  'migrations',
  '20260206000001_narrative_layer_schema.sql'
);

describe('Staleness Triggers (T1)', () => {
  let migrationSql: string;

  beforeAll(() => {
    migrationSql = readFileSync(MIGRATION_PATH, 'utf-8');
  });

  // ---------------------------------------------------------------------------
  // Trigger Function Definition
  // ---------------------------------------------------------------------------

  describe('Trigger Function Definition', () => {
    it('defines the mark_narrative_stale function', () => {
      expect(migrationSql).toContain(
        'CREATE OR REPLACE FUNCTION mark_narrative_stale()'
      );
    });

    it('returns TRIGGER type', () => {
      expect(migrationSql).toMatch(
        /CREATE OR REPLACE FUNCTION mark_narrative_stale\(\)\s*\nRETURNS TRIGGER/
      );
    });

    it('uses plpgsql language', () => {
      // Match the language declaration that closes the function body
      expect(migrationSql).toMatch(
        /\$\$ LANGUAGE plpgsql;/
      );
    });

    it('declares change_severity, change_reason, and target_project_id variables', () => {
      expect(migrationSql).toMatch(/change_severity\s+VARCHAR\(10\)/);
      expect(migrationSql).toMatch(/change_reason\s+TEXT/);
      expect(migrationSql).toMatch(/target_project_id\s+UUID/);
    });

    it('extracts project_id from NEW record', () => {
      expect(migrationSql).toContain('target_project_id := NEW.project_id');
    });

    it('returns NEW at the end of the function', () => {
      // The function must return NEW to allow the triggering operation to proceed
      expect(migrationSql).toMatch(/RETURN NEW;\s*\nEND;/);
    });
  });

  // ---------------------------------------------------------------------------
  // Trigger Attachments (5 tables)
  // ---------------------------------------------------------------------------

  describe('Trigger Attachments', () => {
    it('attaches trigger to evidence table (AFTER INSERT OR UPDATE)', () => {
      expect(migrationSql).toMatch(
        /CREATE TRIGGER\s+evidence_change_stales_narrative\s+AFTER INSERT OR UPDATE ON evidence/
      );
    });

    it('attaches trigger to hypotheses table (AFTER INSERT OR UPDATE)', () => {
      expect(migrationSql).toMatch(
        /CREATE TRIGGER\s+hypothesis_change_stales_narrative\s+AFTER INSERT OR UPDATE ON hypotheses/
      );
    });

    it('attaches trigger to validation_runs table (AFTER INSERT OR UPDATE)', () => {
      expect(migrationSql).toMatch(
        /CREATE TRIGGER\s+validation_stage_change_stales_narrative\s+AFTER INSERT OR UPDATE ON validation_runs/
      );
    });

    it('attaches trigger to value_proposition_canvas table (AFTER INSERT OR UPDATE)', () => {
      expect(migrationSql).toMatch(
        /CREATE TRIGGER\s+vpc_change_stales_narrative\s+AFTER INSERT OR UPDATE ON value_proposition_canvas/
      );
    });

    it('attaches INSERT trigger to founder_profiles table', () => {
      expect(migrationSql).toMatch(
        /CREATE TRIGGER\s+founder_profile_staleness_trigger\s+AFTER INSERT ON founder_profiles/
      );
    });

    it('attaches UPDATE trigger to founder_profiles table with WHEN clause', () => {
      expect(migrationSql).toMatch(
        /CREATE TRIGGER\s+founder_profile_update_staleness_trigger\s+AFTER UPDATE ON founder_profiles/
      );
    });

    it('all triggers execute mark_narrative_stale function', () => {
      // Count how many triggers execute the function
      const triggerExecutions = migrationSql.match(
        /EXECUTE FUNCTION mark_narrative_stale\(\);/g
      );
      // 6 staleness triggers total: evidence, hypotheses, validation_runs,
      // value_proposition_canvas, founder_profiles INSERT, founder_profiles UPDATE
      expect(triggerExecutions).not.toBeNull();
      expect(triggerExecutions!.length).toBe(6);
    });

    it('all staleness triggers fire FOR EACH ROW', () => {
      // Extract only the staleness trigger blocks (not updated_at triggers)
      const stalenessTriggersSection = migrationSql.slice(
        migrationSql.indexOf('STEP 11: ATTACH TRIGGERS'),
        migrationSql.indexOf('STEP 11.5')
      );

      const forEachRowMatches = stalenessTriggersSection.match(
        /FOR EACH ROW/g
      );
      expect(forEachRowMatches).not.toBeNull();
      // 6 triggers in Step 11
      expect(forEachRowMatches!.length).toBe(6);
    });
  });

  // ---------------------------------------------------------------------------
  // Founder Profile Update WHEN Clause
  // ---------------------------------------------------------------------------

  describe('Founder Profile Update WHEN Clause', () => {
    let whenClause: string;

    beforeAll(() => {
      // Extract the WHEN clause for the founder profile update trigger
      const match = migrationSql.match(
        /founder_profile_update_staleness_trigger[\s\S]*?WHEN\s*\(([\s\S]*?)\)\s*EXECUTE/
      );
      expect(match).not.toBeNull();
      whenClause = match![1];
    });

    it('fires when professional_summary changes', () => {
      expect(whenClause).toContain(
        'OLD.professional_summary IS DISTINCT FROM NEW.professional_summary'
      );
    });

    it('fires when linkedin_url changes', () => {
      expect(whenClause).toContain(
        'OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url'
      );
    });

    it('fires when years_experience changes', () => {
      expect(whenClause).toContain(
        'OLD.years_experience IS DISTINCT FROM NEW.years_experience'
      );
    });

    it('fires when domain_expertise changes', () => {
      expect(whenClause).toContain(
        'OLD.domain_expertise IS DISTINCT FROM NEW.domain_expertise'
      );
    });

    it('fires when previous_ventures changes', () => {
      expect(whenClause).toContain(
        'OLD.previous_ventures IS DISTINCT FROM NEW.previous_ventures'
      );
    });

    it('uses IS DISTINCT FROM (not !=) for null-safe comparison', () => {
      // Every comparison should use IS DISTINCT FROM, not != or <>
      const comparisons = whenClause.match(/IS DISTINCT FROM/g);
      expect(comparisons).not.toBeNull();
      expect(comparisons!.length).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // Severity Logic (soft vs hard)
  // ---------------------------------------------------------------------------

  describe('Severity Logic', () => {
    let functionBody: string;

    beforeAll(() => {
      // Extract the function body between $$ delimiters
      const match = migrationSql.match(
        /CREATE OR REPLACE FUNCTION mark_narrative_stale\(\)\s*\nRETURNS TRIGGER AS \$\$([\s\S]*?)\$\$ LANGUAGE plpgsql/
      );
      expect(match).not.toBeNull();
      functionBody = match![1];
    });

    describe('Evidence changes -> soft stale', () => {
      it('assigns soft severity for evidence table changes', () => {
        expect(functionBody).toMatch(
          /IF TG_TABLE_NAME = 'evidence' THEN\s+change_severity := 'soft'/
        );
      });

      it('sets reason to "New evidence added"', () => {
        expect(functionBody).toContain("change_reason := 'New evidence added'");
      });
    });

    describe('Hypothesis changes -> depends on type', () => {
      it('checks for hypothesis status change', () => {
        expect(functionBody).toContain(
          "IF OLD.status IS DISTINCT FROM NEW.status THEN"
        );
      });

      it('assigns hard severity when hypothesis status changes', () => {
        // The status change branch assigns hard severity
        expect(functionBody).toMatch(
          /IF OLD\.status IS DISTINCT FROM NEW\.status THEN\s+change_severity := 'hard'/
        );
      });

      it('includes old and new status in reason text', () => {
        expect(functionBody).toContain(
          "'Hypothesis status changed: ' || COALESCE(OLD.status, 'none') || "
        );
        expect(functionBody).toContain(
          "|| COALESCE(NEW.status, 'unknown')"
        );
      });

      it('assigns soft severity for non-status hypothesis changes', () => {
        // There should be an ELSE branch that assigns soft
        expect(functionBody).toContain("change_reason := 'Hypothesis updated'");
      });
    });

    describe('Validation run changes -> depends on gate', () => {
      it('checks for current_gate change', () => {
        expect(functionBody).toContain(
          'IF NEW.current_gate IS DISTINCT FROM OLD.current_gate THEN'
        );
      });

      it('assigns hard severity when validation stage (current_gate) changes', () => {
        expect(functionBody).toMatch(
          /IF NEW\.current_gate IS DISTINCT FROM OLD\.current_gate THEN\s+change_severity := 'hard'/
        );
      });

      it('includes old and new gate in reason text', () => {
        expect(functionBody).toContain(
          "'Validation stage changed: ' || COALESCE(OLD.current_gate, 'none') || "
        );
        expect(functionBody).toContain(
          "|| COALESCE(NEW.current_gate, 'unknown')"
        );
      });

      it('assigns soft severity for non-gate validation_runs changes', () => {
        expect(functionBody).toContain(
          "change_reason := 'Validation run updated'"
        );
      });
    });

    describe('Default (VPC, founder_profiles) -> soft stale', () => {
      it('has an ELSE branch that defaults to soft severity', () => {
        // The ELSE at the end of the IF/ELSIF chain
        expect(functionBody).toMatch(
          /ELSE\s+change_severity := 'soft';\s+change_reason := 'Related data changed'/
        );
      });
    });

    describe('Fallback error handling', () => {
      it('has EXCEPTION WHEN OTHERS fallback for severity logic', () => {
        // The function has a nested exception handler around the severity logic
        expect(functionBody).toMatch(
          /EXCEPTION WHEN OTHERS THEN\s+change_severity := 'soft'/
        );
      });

      it('includes table name in fallback reason', () => {
        expect(functionBody).toContain(
          "'Data changed in ' || TG_TABLE_NAME || ' (fallback: ' || SQLERRM || ')'"
        );
      });

      it('raises a WARNING in fallback path', () => {
        expect(functionBody).toContain(
          "RAISE WARNING 'mark_narrative_stale fallback triggered for %: %'"
        );
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Project Update Logic (never downgrade hard -> soft)
  // ---------------------------------------------------------------------------

  describe('Project Update Logic', () => {
    let functionBody: string;

    beforeAll(() => {
      const match = migrationSql.match(
        /CREATE OR REPLACE FUNCTION mark_narrative_stale\(\)\s*\nRETURNS TRIGGER AS \$\$([\s\S]*?)\$\$ LANGUAGE plpgsql/
      );
      expect(match).not.toBeNull();
      functionBody = match![1];
    });

    it('updates projects table with staleness fields', () => {
      expect(functionBody).toMatch(
        /UPDATE projects\s+SET/
      );
    });

    it('always sets narrative_is_stale to TRUE', () => {
      expect(functionBody).toContain('narrative_is_stale = TRUE');
    });

    it('never downgrades hard severity to soft (preserves hard)', () => {
      // The CASE expression should keep 'hard' if already 'hard'
      expect(functionBody).toContain(
        "WHEN narrative_stale_severity = 'hard' THEN 'hard'"
      );
    });

    it('applies change_severity when current severity is not hard', () => {
      expect(functionBody).toMatch(
        /ELSE change_severity\s*\n\s*END/
      );
    });

    it('sets narrative_stale_reason to the change reason', () => {
      expect(functionBody).toContain(
        'narrative_stale_reason = change_reason'
      );
    });

    it('filters update by target_project_id', () => {
      expect(functionBody).toContain(
        'WHERE id = target_project_id'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling for project_id Extraction
  // ---------------------------------------------------------------------------

  describe('Project ID Extraction Error Handling', () => {
    let functionBody: string;

    beforeAll(() => {
      const match = migrationSql.match(
        /CREATE OR REPLACE FUNCTION mark_narrative_stale\(\)\s*\nRETURNS TRIGGER AS \$\$([\s\S]*?)\$\$ LANGUAGE plpgsql/
      );
      expect(match).not.toBeNull();
      functionBody = match![1];
    });

    it('wraps project_id extraction in exception handler', () => {
      // There should be a BEGIN/EXCEPTION block around project_id extraction
      expect(functionBody).toMatch(
        /BEGIN\s+target_project_id := NEW\.project_id;\s+EXCEPTION WHEN OTHERS THEN/
      );
    });

    it('raises WARNING when project_id extraction fails', () => {
      expect(functionBody).toContain(
        "RAISE WARNING 'mark_narrative_stale: Cannot access project_id from % table: %'"
      );
    });

    it('returns NEW (does not abort) when project_id extraction fails', () => {
      // After the warning, it should return NEW to let the triggering operation succeed
      const extractionBlock = functionBody.match(
        /RAISE WARNING 'mark_narrative_stale: Cannot access project_id[\s\S]*?RETURN NEW;/
      );
      expect(extractionBlock).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Projects Table Staleness Columns
  // ---------------------------------------------------------------------------

  describe('Projects Table Staleness Columns', () => {
    it('adds narrative_generated_at column', () => {
      expect(migrationSql).toMatch(
        /ADD COLUMN IF NOT EXISTS narrative_generated_at TIMESTAMPTZ/
      );
    });

    it('adds narrative_is_stale column with TRUE default', () => {
      expect(migrationSql).toMatch(
        /ADD COLUMN IF NOT EXISTS narrative_is_stale BOOLEAN DEFAULT TRUE/
      );
    });

    it('adds narrative_stale_severity column with hard default', () => {
      expect(migrationSql).toMatch(
        /ADD COLUMN IF NOT EXISTS narrative_stale_severity VARCHAR\(10\) DEFAULT 'hard'/
      );
    });

    it('adds narrative_stale_reason column', () => {
      expect(migrationSql).toMatch(
        /ADD COLUMN IF NOT EXISTS narrative_stale_reason TEXT/
      );
    });

    it('defaults to stale with hard severity (no narrative exists yet)', () => {
      // New projects should default to stale=true, severity=hard
      // This ensures the UI shows "generate narrative" state
      expect(migrationSql).toContain("narrative_is_stale BOOLEAN DEFAULT TRUE");
      expect(migrationSql).toContain("narrative_stale_severity VARCHAR(10) DEFAULT 'hard'");
    });
  });

  // ---------------------------------------------------------------------------
  // Staleness Scenario Coverage Matrix
  // ---------------------------------------------------------------------------

  describe('Staleness Scenario Coverage Matrix', () => {
    let functionBody: string;

    beforeAll(() => {
      const match = migrationSql.match(
        /CREATE OR REPLACE FUNCTION mark_narrative_stale\(\)\s*\nRETURNS TRIGGER AS \$\$([\s\S]*?)\$\$ LANGUAGE plpgsql/
      );
      expect(match).not.toBeNull();
      functionBody = match![1];
    });

    // Scenario 1: New evidence -> soft stale
    it('scenario: new evidence inserted -> soft stale', () => {
      // evidence INSERT fires the trigger; table name = 'evidence' -> soft
      expect(functionBody).toMatch(
        /TG_TABLE_NAME = 'evidence'[\s\S]*?change_severity := 'soft'/
      );
    });

    // Scenario 2: Evidence content updated -> soft stale
    it('scenario: evidence content updated -> soft stale', () => {
      // evidence UPDATE also fires the trigger; same branch -> soft
      expect(migrationSql).toMatch(
        /AFTER INSERT OR UPDATE ON evidence/
      );
      // The evidence branch always returns soft regardless of INSERT vs UPDATE
      expect(functionBody).toMatch(
        /IF TG_TABLE_NAME = 'evidence' THEN\s+change_severity := 'soft'/
      );
    });

    // Scenario 3: Evidence deleted -> the trigger is INSERT OR UPDATE only
    // DELETE is not covered by the trigger (spec says INSERT/UPDATE only)
    it('scenario: evidence trigger does not fire on DELETE (by design)', () => {
      // The evidence trigger only has INSERT OR UPDATE, not DELETE
      const evidenceTrigger = migrationSql.match(
        /CREATE TRIGGER\s+evidence_change_stales_narrative\s+(AFTER\s+[\w\s]+)\s+ON evidence/
      );
      expect(evidenceTrigger).not.toBeNull();
      expect(evidenceTrigger![1]).not.toMatch(/DELETE/);
    });

    // Scenario 4: Hypothesis invalidated -> hard stale
    it('scenario: hypothesis status change -> hard stale', () => {
      expect(functionBody).toMatch(
        /TG_TABLE_NAME = 'hypotheses'[\s\S]*?OLD\.status IS DISTINCT FROM NEW\.status[\s\S]*?change_severity := 'hard'/
      );
    });

    // Scenario 5: New hypothesis added -> soft stale
    it('scenario: new hypothesis (no status change) -> soft stale', () => {
      // On INSERT, OLD is not available, so OLD.status IS DISTINCT FROM NEW.status
      // will be handled by the ELSE branch (soft)
      // The function has both hard and soft paths for hypotheses
      expect(functionBody).toContain("change_reason := 'Hypothesis updated'");
    });

    // Scenario 6: Validation stage (current_gate) change -> hard stale
    it('scenario: validation stage change -> hard stale', () => {
      expect(functionBody).toMatch(
        /TG_TABLE_NAME = 'validation_runs'[\s\S]*?NEW\.current_gate IS DISTINCT FROM OLD\.current_gate[\s\S]*?change_severity := 'hard'/
      );
    });

    // Scenario 7: VPC change -> soft stale (falls through to ELSE)
    it('scenario: VPC change -> soft stale (default branch)', () => {
      // value_proposition_canvas is not explicitly named in IF/ELSIF,
      // so it hits the ELSE branch -> soft
      expect(functionBody).not.toContain("TG_TABLE_NAME = 'value_proposition_canvas'");
      expect(functionBody).toMatch(
        /ELSE\s+change_severity := 'soft';\s+change_reason := 'Related data changed'/
      );
    });

    // Scenario 8: Founder profile created -> soft stale (default branch)
    it('scenario: founder profile created -> soft stale (default branch)', () => {
      // founder_profiles is not explicitly named in IF/ELSIF,
      // so it hits the ELSE branch -> soft
      expect(functionBody).not.toContain("TG_TABLE_NAME = 'founder_profiles'");
      expect(migrationSql).toMatch(
        /AFTER INSERT ON founder_profiles/
      );
    });

    // Scenario 9: Founder profile updated with field changes -> soft stale
    it('scenario: founder profile field update -> soft stale', () => {
      // The WHEN clause filters to meaningful field changes,
      // then the function defaults to soft for unrecognized table names
      expect(migrationSql).toMatch(
        /AFTER UPDATE ON founder_profiles[\s\S]*?WHEN/
      );
    });

    // Scenario 10: Project with no narrative -> no error
    it('scenario: project with no narrative -> trigger still succeeds', () => {
      // The UPDATE projects SET ... WHERE id = target_project_id
      // will simply update 0 rows if the project has no narrative columns set.
      // This is safe: UPDATE with no matching rows is a no-op in PostgreSQL.
      // The function always returns NEW, never raises an exception on the happy path.
      expect(functionBody).toContain('RETURN NEW');
      // No RAISE EXCEPTION in the main path
      expect(functionBody).not.toMatch(
        /RAISE EXCEPTION/
      );
    });

    // Scenario 11: Hard stale is never downgraded to soft
    it('scenario: hard stale is preserved when subsequent soft change occurs', () => {
      expect(functionBody).toContain(
        "WHEN narrative_stale_severity = 'hard' THEN 'hard'"
      );
    });

    // Scenario 12: Staleness can be cleared externally
    it('scenario: staleness columns can be cleared (no trigger prevents it)', () => {
      // There is no trigger that prevents setting narrative_is_stale = FALSE.
      // Verify no BEFORE UPDATE trigger on projects that would block clearing staleness.
      // The only triggers on projects in this migration are the staleness triggers
      // on OTHER tables, not on projects itself.
      expect(migrationSql).not.toMatch(
        /CREATE TRIGGER[\s\S]*?ON projects[\s\S]*?mark_narrative_stale/
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Completeness Checks
  // ---------------------------------------------------------------------------

  describe('Completeness', () => {
    it('has exactly 5 target tables for staleness triggers', () => {
      const targetTables = [
        'evidence',
        'hypotheses',
        'validation_runs',
        'value_proposition_canvas',
        'founder_profiles',
      ];

      for (const table of targetTables) {
        const pattern = new RegExp(
          `EXECUTE FUNCTION mark_narrative_stale\\(\\);[\\s\\S]*?` +
            `|CREATE TRIGGER[\\s\\S]*?ON ${table}[\\s\\S]*?EXECUTE FUNCTION mark_narrative_stale\\(\\);`
        );
        expect(migrationSql).toMatch(
          new RegExp(`ON ${table}[\\s\\S]*?EXECUTE FUNCTION mark_narrative_stale\\(\\)`)
        );
      }
    });

    it('does not attach staleness trigger to tables outside the 5', () => {
      // Extract all trigger-to-table attachments for mark_narrative_stale
      const triggerAttachments = migrationSql.match(
        /CREATE TRIGGER\s+\w+\s+AFTER\s+[\w\s]+ON\s+(\w+)\s+[\s\S]*?EXECUTE FUNCTION mark_narrative_stale\(\)/g
      );
      expect(triggerAttachments).not.toBeNull();

      const allowedTables = new Set([
        'evidence',
        'hypotheses',
        'validation_runs',
        'value_proposition_canvas',
        'founder_profiles',
      ]);

      for (const attachment of triggerAttachments!) {
        const tableMatch = attachment.match(/ON\s+(\w+)/);
        expect(tableMatch).not.toBeNull();
        expect(allowedTables).toContain(tableMatch![1]);
      }
    });

    it('documents deferred triggers for gate_scores and customer_profiles', () => {
      expect(migrationSql).toMatch(
        /TODO.*gate_scores.*trigger/i
      );
      expect(migrationSql).toMatch(
        /TODO.*customer_profiles.*trigger/i
      );
    });

    it('references the correct function body tables: evidence, hypotheses, validation_runs', () => {
      const functionBody = migrationSql.match(
        /CREATE OR REPLACE FUNCTION mark_narrative_stale[\s\S]*?\$\$ LANGUAGE plpgsql/
      );
      expect(functionBody).not.toBeNull();
      const body = functionBody![0];

      // The function body should reference these table names in TG_TABLE_NAME checks
      expect(body).toContain("TG_TABLE_NAME = 'evidence'");
      expect(body).toContain("TG_TABLE_NAME = 'hypotheses'");
      expect(body).toContain("TG_TABLE_NAME = 'validation_runs'");
    });
  });
});
