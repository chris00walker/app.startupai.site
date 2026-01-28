/**
 * Gate Policies API - List all policies
 *
 * GET /api/settings/gate-policies
 * Returns all gate policies for the authenticated user with defaults.
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_GATE_POLICIES, type GateType, type GateThresholds } from '@/db/schema/gate-policies';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's custom policies
    const { data: customPolicies, error: fetchError } = await supabase
      .from('gate_policies')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching gate policies:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch gate policies' },
        { status: 500 }
      );
    }

    // Build response with custom policies merged with defaults
    const gates: GateType[] = ['DESIRABILITY', 'FEASIBILITY', 'VIABILITY'];
    const policies: Record<GateType, {
      id: string | null;
      gate: GateType;
      isCustom: boolean;
      minExperiments: number;
      requiredFitTypes: string[];
      minWeakEvidence: number;
      minMediumEvidence: number;
      minStrongEvidence: number;
      thresholds: GateThresholds;
      overrideRoles: string[];
      requiresApproval: boolean;
    }> = {} as Record<GateType, ReturnType<typeof mergePolicy>>;

    for (const gate of gates) {
      const customPolicy = customPolicies?.find((p) => p.gate === gate);
      policies[gate] = mergePolicy(gate, customPolicy);
    }

    return NextResponse.json({
      policies,
      defaults: DEFAULT_GATE_POLICIES,
    });
  } catch (error) {
    console.error('Unexpected error in gate policies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function mergePolicy(
  gate: GateType,
  customPolicy?: {
    id: string;
    gate: string;
    min_experiments: number;
    required_fit_types: string[];
    min_weak_evidence: number | null;
    min_medium_evidence: number | null;
    min_strong_evidence: number | null;
    thresholds: GateThresholds | null;
    override_roles: string[] | null;
    requires_approval: boolean | null;
  } | null
) {
  const defaults = DEFAULT_GATE_POLICIES[gate];

  if (!customPolicy) {
    return {
      id: null,
      gate,
      isCustom: false,
      minExperiments: defaults.minExperiments,
      requiredFitTypes: defaults.requiredFitTypes,
      minWeakEvidence: defaults.minWeakEvidence,
      minMediumEvidence: defaults.minMediumEvidence,
      minStrongEvidence: defaults.minStrongEvidence,
      thresholds: defaults.thresholds,
      overrideRoles: ['admin', 'senior_consultant'],
      requiresApproval: defaults.requiresApproval,
    };
  }

  return {
    id: customPolicy.id,
    gate,
    isCustom: true,
    minExperiments: customPolicy.min_experiments,
    requiredFitTypes: customPolicy.required_fit_types,
    minWeakEvidence: customPolicy.min_weak_evidence ?? defaults.minWeakEvidence,
    minMediumEvidence: customPolicy.min_medium_evidence ?? defaults.minMediumEvidence,
    minStrongEvidence: customPolicy.min_strong_evidence ?? defaults.minStrongEvidence,
    thresholds: customPolicy.thresholds ?? defaults.thresholds,
    overrideRoles: customPolicy.override_roles ?? ['admin', 'senior_consultant'],
    requiresApproval: customPolicy.requires_approval ?? defaults.requiresApproval,
  };
}
