/**
 * API Validation Utilities
 *
 * Shared validation helpers for API routes.
 *
 * @story US-PH03, US-FM03
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid();

/**
 * Validate a UUID parameter and return an error response if invalid.
 * Returns null if valid, or a NextResponse with 400 status if invalid.
 */
export function validateUuid(
  value: string | undefined,
  paramName: string = 'id'
): NextResponse | null {
  if (!value) {
    return NextResponse.json(
      {
        error: 'invalid_parameter',
        message: `Missing required parameter: ${paramName}`,
      },
      { status: 400 }
    );
  }

  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'invalid_parameter',
        message: `Invalid ${paramName}: must be a valid UUID`,
      },
      { status: 400 }
    );
  }

  return null;
}

/**
 * Validate multiple UUID parameters at once.
 * Returns null if all valid, or a NextResponse with the first error.
 */
export function validateUuids(
  params: Record<string, string | undefined>
): NextResponse | null {
  for (const [name, value] of Object.entries(params)) {
    const error = validateUuid(value, name);
    if (error) return error;
  }
  return null;
}

/**
 * Parse pagination parameters with safe defaults and NaN handling.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { limit?: number; maxLimit?: number } = {}
): { limit: number; offset: number } {
  const { limit: defaultLimit = 20, maxLimit = 50 } = defaults;

  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  // Parse with NaN fallback
  let limit = limitParam ? parseInt(limitParam, 10) : defaultLimit;
  let offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  // Handle NaN
  if (isNaN(limit)) limit = defaultLimit;
  if (isNaN(offset)) offset = 0;

  // Clamp values
  limit = Math.max(1, Math.min(limit, maxLimit));
  offset = Math.max(0, offset);

  return { limit, offset };
}
