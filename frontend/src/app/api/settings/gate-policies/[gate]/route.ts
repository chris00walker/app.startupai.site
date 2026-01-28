/**
 * Gate Policies API - Individual gate operations
 *
 * GET /api/settings/gate-policies/[gate] - Get specific gate policy
 * PUT /api/settings/gate-policies/[gate] - Create or update gate policy
 * DELETE /api/settings/gate-policies/[gate] - Reset to defaults (delete custom)
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_GATE_POLICIES, type GateType, type GateThresholds } from '@/db/schema/gate-policies';

const VALID_GATES: GateType[] = ['DESIRABILITY', 'FEASIBILITY', 'VIABILITY'];

const gatePolicySchema = z.object({
  minExperiments: z.number().int().min(1).max(10).optional(),
  requiredFitTypes: z.array(z.string()).optional(),
  minWeakEvidence: z.number().int().min(0).max(10).optional(),
  minMediumEvidence: z.number().int().min(0).max(10).optional(),
  minStrongEvidence: z.number().int().min(0).max(10).optional(),
  thresholds: z.record(z.string(), z.number()).optional(),
  overrideRoles: z.array(z.string()).optional(),
  requiresApproval: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gate: string }> }
) {
  try {
    const { gate } = await params;
    const gateUpper = gate.toUpperCase() as GateType;

    if (!VALID_GATES.includes(gateUpper)) {
      return NextResponse.json(
        { error: `Invalid gate. Must be one of: ${VALID_GATES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: customPolicy, error: fetchError } = await supabase
      .from('gate_policies')
      .select('*')
      .eq('user_id', user.id)
      .eq('gate', gateUpper)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching gate policy:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch gate policy' },
        { status: 500 }
      );
    }

    const defaults = DEFAULT_GATE_POLICIES[gateUpper];

    if (!customPolicy) {
      return NextResponse.json({
        policy: {
          id: null,
          gate: gateUpper,
          isCustom: false,
          ...defaults,
          overrideRoles: ['admin', 'senior_consultant'],
        },
        defaults,
      });
    }

    return NextResponse.json({
      policy: {
        id: customPolicy.id,
        gate: gateUpper,
        isCustom: true,
        minExperiments: customPolicy.min_experiments,
        requiredFitTypes: customPolicy.required_fit_types,
        minWeakEvidence: customPolicy.min_weak_evidence ?? defaults.minWeakEvidence,
        minMediumEvidence: customPolicy.min_medium_evidence ?? defaults.minMediumEvidence,
        minStrongEvidence: customPolicy.min_strong_evidence ?? defaults.minStrongEvidence,
        thresholds: customPolicy.thresholds ?? defaults.thresholds,
        overrideRoles: customPolicy.override_roles ?? ['admin', 'senior_consultant'],
        requiresApproval: customPolicy.requires_approval ?? defaults.requiresApproval,
      },
      defaults,
    });
  } catch (error) {
    console.error('Unexpected error getting gate policy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gate: string }> }
) {
  try {
    const { gate } = await params;
    const gateUpper = gate.toUpperCase() as GateType;

    if (!VALID_GATES.includes(gateUpper)) {
      return NextResponse.json(
        { error: `Invalid gate. Must be one of: ${VALID_GATES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = gatePolicySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const policyData = parseResult.data;
    const defaults = DEFAULT_GATE_POLICIES[gateUpper];

    // Build upsert record
    const record = {
      user_id: user.id,
      gate: gateUpper,
      min_experiments: policyData.minExperiments ?? defaults.minExperiments,
      required_fit_types: policyData.requiredFitTypes ?? defaults.requiredFitTypes,
      min_weak_evidence: policyData.minWeakEvidence ?? defaults.minWeakEvidence,
      min_medium_evidence: policyData.minMediumEvidence ?? defaults.minMediumEvidence,
      min_strong_evidence: policyData.minStrongEvidence ?? defaults.minStrongEvidence,
      thresholds: (policyData.thresholds ?? defaults.thresholds) as GateThresholds,
      override_roles: policyData.overrideRoles ?? ['admin', 'senior_consultant'],
      requires_approval: policyData.requiresApproval ?? defaults.requiresApproval,
      updated_at: new Date().toISOString(),
    };

    // Upsert (insert or update on conflict)
    const { data, error: upsertError } = await supabase
      .from('gate_policies')
      .upsert(record, {
        onConflict: 'user_id,gate',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting gate policy:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save gate policy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      policy: {
        id: data.id,
        gate: gateUpper,
        isCustom: true,
        minExperiments: data.min_experiments,
        requiredFitTypes: data.required_fit_types,
        minWeakEvidence: data.min_weak_evidence,
        minMediumEvidence: data.min_medium_evidence,
        minStrongEvidence: data.min_strong_evidence,
        thresholds: data.thresholds,
        overrideRoles: data.override_roles,
        requiresApproval: data.requires_approval,
      },
      message: 'Gate policy saved successfully',
    });
  } catch (error) {
    console.error('Unexpected error saving gate policy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gate: string }> }
) {
  try {
    const { gate } = await params;
    const gateUpper = gate.toUpperCase() as GateType;

    if (!VALID_GATES.includes(gateUpper)) {
      return NextResponse.json(
        { error: `Invalid gate. Must be one of: ${VALID_GATES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete custom policy (resetting to defaults)
    const { error: deleteError } = await supabase
      .from('gate_policies')
      .delete()
      .eq('user_id', user.id)
      .eq('gate', gateUpper);

    if (deleteError) {
      console.error('Error deleting gate policy:', deleteError);
      return NextResponse.json(
        { error: 'Failed to reset gate policy' },
        { status: 500 }
      );
    }

    const defaults = DEFAULT_GATE_POLICIES[gateUpper];

    return NextResponse.json({
      policy: {
        id: null,
        gate: gateUpper,
        isCustom: false,
        ...defaults,
        overrideRoles: ['admin', 'senior_consultant'],
      },
      message: 'Gate policy reset to defaults',
    });
  } catch (error) {
    console.error('Unexpected error resetting gate policy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
