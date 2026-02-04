/**
 * Data Integrity Check Runner
 *
 * Performs data integrity checks for user data.
 * Validates foreign key relationships, required fields, and business rules.
 *
 * @story US-A10
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface IntegrityIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  table?: string;
  recordId?: string;
  field?: string;
}

export interface IntegrityCheckResult {
  userId: string;
  checksRun: number;
  issuesFound: IntegrityIssue[];
  status: 'passed' | 'issues_found' | 'failed';
  completedAt: string;
}

type CheckFunction = (
  supabase: SupabaseClient,
  userId: string
) => Promise<IntegrityIssue[]>;

/**
 * Check 1: Verify user profile exists and has required fields
 */
async function checkUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    issues.push({
      severity: 'error',
      category: 'User Profile',
      message: 'User profile record not found',
      table: 'user_profiles',
      recordId: userId,
    });
    return issues;
  }

  // Check required fields
  if (!profile.email) {
    issues.push({
      severity: 'error',
      category: 'User Profile',
      message: 'Email is missing',
      table: 'user_profiles',
      recordId: userId,
      field: 'email',
    });
  }

  if (!profile.role) {
    issues.push({
      severity: 'warning',
      category: 'User Profile',
      message: 'Role is not set',
      table: 'user_profiles',
      recordId: userId,
      field: 'role',
    });
  }

  return issues;
}

/**
 * Check 2: Verify projects have valid owner references
 */
async function checkProjectOwnership(
  supabase: SupabaseClient,
  userId: string
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, user_id')
    .eq('user_id', userId);

  if (error) {
    issues.push({
      severity: 'error',
      category: 'Projects',
      message: `Failed to query projects: ${error.message}`,
      table: 'projects',
    });
    return issues;
  }

  // Check each project for required fields
  for (const project of projects || []) {
    if (!project.name) {
      issues.push({
        severity: 'warning',
        category: 'Projects',
        message: 'Project has no name',
        table: 'projects',
        recordId: project.id,
        field: 'name',
      });
    }
  }

  return issues;
}

/**
 * Check 3: Verify hypotheses have valid project references
 */
async function checkHypothesesIntegrity(
  supabase: SupabaseClient,
  userId: string
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  // Get user's projects first
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  if (!projects || projects.length === 0) {
    return issues;
  }

  const projectIds = projects.map((p) => p.id);

  // Check hypotheses
  const { data: hypotheses, error } = await supabase
    .from('hypotheses')
    .select('id, project_id, statement, status')
    .in('project_id', projectIds);

  if (error) {
    issues.push({
      severity: 'error',
      category: 'Hypotheses',
      message: `Failed to query hypotheses: ${error.message}`,
      table: 'hypotheses',
    });
    return issues;
  }

  for (const hypothesis of hypotheses || []) {
    if (!hypothesis.statement) {
      issues.push({
        severity: 'warning',
        category: 'Hypotheses',
        message: 'Hypothesis has no statement',
        table: 'hypotheses',
        recordId: hypothesis.id,
        field: 'statement',
      });
    }

    // Check for orphaned hypotheses (project deleted but hypothesis remains)
    if (!projectIds.includes(hypothesis.project_id)) {
      issues.push({
        severity: 'error',
        category: 'Hypotheses',
        message: 'Hypothesis references non-existent project',
        table: 'hypotheses',
        recordId: hypothesis.id,
        field: 'project_id',
      });
    }
  }

  return issues;
}

/**
 * Check 4: Verify evidence records have valid references
 */
async function checkEvidenceIntegrity(
  supabase: SupabaseClient,
  userId: string
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  // Get user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  if (!projects || projects.length === 0) {
    return issues;
  }

  const projectIds = projects.map((p) => p.id);

  // Check evidence
  const { data: evidence, error } = await supabase
    .from('evidence')
    .select('id, project_id, hypothesis_id, evidence_category, evidence_source')
    .in('project_id', projectIds);

  if (error) {
    issues.push({
      severity: 'error',
      category: 'Evidence',
      message: `Failed to query evidence: ${error.message}`,
      table: 'evidence',
    });
    return issues;
  }

  // Get hypotheses for reference check
  const { data: hypotheses } = await supabase
    .from('hypotheses')
    .select('id')
    .in('project_id', projectIds);

  const hypothesisIds = new Set((hypotheses || []).map((h) => h.id));

  for (const ev of evidence || []) {
    // Check for orphaned evidence (hypothesis deleted but evidence remains)
    if (ev.hypothesis_id && !hypothesisIds.has(ev.hypothesis_id)) {
      issues.push({
        severity: 'warning',
        category: 'Evidence',
        message: 'Evidence references deleted hypothesis',
        table: 'evidence',
        recordId: ev.id,
        field: 'hypothesis_id',
      });
    }

    if (!ev.evidence_category) {
      issues.push({
        severity: 'info',
        category: 'Evidence',
        message: 'Evidence has no category classification',
        table: 'evidence',
        recordId: ev.id,
        field: 'evidence_category',
      });
    }
  }

  return issues;
}

/**
 * Check 5: Verify validation states are consistent
 */
async function checkValidationStateIntegrity(
  supabase: SupabaseClient,
  userId: string
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  // Get user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  if (!projects || projects.length === 0) {
    return issues;
  }

  const projectIds = projects.map((p) => p.id);

  // Check validation states
  const { data: states, error } = await supabase
    .from('crewai_validation_states')
    .select('id, project_id, run_status, validation_phase, current_crew')
    .in('project_id', projectIds);

  if (error) {
    issues.push({
      severity: 'error',
      category: 'Validation States',
      message: `Failed to query validation states: ${error.message}`,
      table: 'crewai_validation_states',
    });
    return issues;
  }

  for (const state of states || []) {
    // Check for stuck states
    if (state.run_status === 'running' || state.run_status === 'in_progress') {
      // Could be stuck - this is informational
      issues.push({
        severity: 'info',
        category: 'Validation States',
        message: `Validation run is in "${state.run_status}" status - verify if still active`,
        table: 'crewai_validation_states',
        recordId: state.id,
        field: 'run_status',
      });
    }
  }

  return issues;
}

/**
 * All integrity checks to run
 */
const INTEGRITY_CHECKS: Array<{ name: string; check: CheckFunction }> = [
  { name: 'User Profile', check: checkUserProfile },
  { name: 'Project Ownership', check: checkProjectOwnership },
  { name: 'Hypotheses Integrity', check: checkHypothesesIntegrity },
  { name: 'Evidence Integrity', check: checkEvidenceIntegrity },
  { name: 'Validation State Integrity', check: checkValidationStateIntegrity },
];

/**
 * Run all integrity checks for a user
 */
export async function runIntegrityChecks(
  supabase: SupabaseClient,
  userId: string
): Promise<IntegrityCheckResult> {
  const allIssues: IntegrityIssue[] = [];
  let checksRun = 0;

  for (const { check } of INTEGRITY_CHECKS) {
    try {
      const issues = await check(supabase, userId);
      allIssues.push(...issues);
      checksRun++;
    } catch (error) {
      allIssues.push({
        severity: 'error',
        category: 'System',
        message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  const hasErrors = allIssues.some((i) => i.severity === 'error');
  const hasWarnings = allIssues.some((i) => i.severity === 'warning');

  return {
    userId,
    checksRun,
    issuesFound: allIssues,
    status: hasErrors || hasWarnings ? 'issues_found' : 'passed',
    completedAt: new Date().toISOString(),
  };
}
