/**
 * Narrative Version Diff API
 *
 * GET /api/narrative/:id/versions/:version/diff?compare_to=:version
 *
 * Returns field-level diffs between two narrative versions.
 *
 * @story US-NL01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import type { VersionDiffResponse } from '@/lib/narrative/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function areEqual(a: unknown, b: unknown): boolean {
  return safeStringify(a) === safeStringify(b);
}

function collectDiffs(
  path: string,
  oldValue: unknown,
  newValue: unknown,
  diffs: VersionDiffResponse['diffs']
) {
  if (areEqual(oldValue, newValue)) return;

  if (isRecord(oldValue) && isRecord(newValue)) {
    const keys = new Set([
      ...Object.keys(oldValue),
      ...Object.keys(newValue),
    ]);

    for (const key of Array.from(keys).sort()) {
      const nextPath = path ? `${path}.${key}` : key;
      collectDiffs(nextPath, oldValue[key], newValue[key], diffs);
    }
    return;
  }

  diffs.push({
    field: path || 'root',
    old_value: oldValue,
    new_value: newValue,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const featureCheck = checkNarrativeLayerEnabled();
  if (featureCheck) return featureCheck;

  const { id, version } = await params;
  const versionA = Number.parseInt(version, 10);
  const compareTo = Number.parseInt(
    request.nextUrl.searchParams.get('compare_to') || '',
    10
  );

  if (!Number.isInteger(versionA) || !Number.isInteger(compareTo)) {
    return narrativeError(
      'VALIDATION_ERROR',
      'Both version and compare_to must be integer version numbers'
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return narrativeError('UNAUTHORIZED', 'Authentication required');
  }

  const { data: narrative } = await supabase
    .from('pitch_narratives')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!narrative) {
    return narrativeError('NOT_FOUND', 'Narrative not found');
  }

  if (narrative.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized');
  }

  const { data: versions, error: versionsError } = await supabase
    .from('narrative_versions')
    .select('version_number, narrative_data')
    .eq('narrative_id', id)
    .in('version_number', [versionA, compareTo]);

  if (versionsError) {
    console.error('Error loading narrative versions:', versionsError);
    return narrativeError('INTERNAL_ERROR', 'Failed to fetch versions');
  }

  const versionDataA = versions?.find((v) => v.version_number === versionA);
  const versionDataB = versions?.find((v) => v.version_number === compareTo);

  if (!versionDataA || !versionDataB) {
    return narrativeError('NOT_FOUND', 'One or both versions not found');
  }

  const diffs: VersionDiffResponse['diffs'] = [];
  collectDiffs('', versionDataA.narrative_data, versionDataB.narrative_data, diffs);

  return NextResponse.json({
    version_a: versionA,
    version_b: compareTo,
    diffs,
  } satisfies VersionDiffResponse);
}

