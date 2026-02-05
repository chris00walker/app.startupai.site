/**
 * Narrative Layer Error Helpers
 *
 * Shared error response helper with all 12 error codes.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2656-2697
 */

import { NextResponse } from 'next/server';
import type { NarrativeErrorCode, NarrativeErrorResponse } from './types';
import { NARRATIVE_ERROR_STATUS } from './types';

/**
 * Create a structured error response for narrative API endpoints.
 */
export function narrativeError(
  code: NarrativeErrorCode,
  message: string,
  details?: Record<string, unknown>
): NextResponse<NarrativeErrorResponse> {
  const status = NARRATIVE_ERROR_STATUS[code];
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Check if the narrative layer feature is enabled (server-side).
 * Returns an error response if disabled, or null if enabled.
 */
export function checkNarrativeLayerEnabled(): NextResponse<NarrativeErrorResponse> | null {
  if (process.env.NARRATIVE_LAYER_ENABLED !== 'true') {
    return NextResponse.json({ error: { code: 'NOT_FOUND' as const, message: 'Not found' } }, { status: 404 });
  }
  return null;
}
