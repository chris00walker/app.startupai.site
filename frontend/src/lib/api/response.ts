/**
 * Unified API Response Wrapper
 *
 * Provides consistent response format across all API routes.
 * Includes success/error responses, pagination support, and error handling.
 *
 * @story US-A01, US-A02, US-A04, US-A05, US-A06, US-A07
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Create a successful API response
 *
 * @param data - The response data
 * @param pagination - Optional pagination info
 * @param status - HTTP status code (default 200)
 *
 * @example
 * ```ts
 * return successResponse({ users }, { total: 100, limit: 20, offset: 0 });
 * ```
 */
export function successResponse<T>(
  data: T,
  pagination?: PaginationParams,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = { success: true, data };

  if (pagination) {
    response.pagination = {
      total: pagination.total,
      limit: pagination.limit,
      offset: pagination.offset,
      hasMore: pagination.offset + pagination.limit < pagination.total,
    };
  }

  return NextResponse.json(response, { status });
}

/**
 * Create an error API response
 *
 * @param code - Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param details - Optional additional error details
 *
 * @example
 * ```ts
 * return errorResponse('NOT_FOUND', 'User not found', 404);
 * ```
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error: { code, message, details },
  };

  return NextResponse.json(response, { status });
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  // Auth errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Permission errors (403)
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  IMPERSONATION_BLOCKED: 'IMPERSONATION_BLOCKED',

  // Resource errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_FIELD: 'MISSING_FIELD',

  // Conflict errors (409)
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  CONFLICT: 'CONFLICT',

  // Rate limiting (429)
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Handle API errors with consistent response format
 *
 * @param error - The caught error
 * @param context - Context string for logging (e.g., 'api/admin/users')
 *
 * @example
 * ```ts
 * try {
 *   // ... API logic
 * } catch (error) {
 *   return handleApiError(error, 'api/admin/users');
 * }
 * ```
 */
export function handleApiError(error: unknown, context: string): NextResponse<ApiResponse> {
  const errorId = crypto.randomUUID().slice(0, 8);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request data',
      400,
      error.flatten()
    );
  }

  // Handle known Supabase/Postgres errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const pgError = error as { code: string; message?: string };

    // Unique constraint violation
    if (pgError.code === '23505') {
      return errorResponse(ERROR_CODES.DUPLICATE_ENTRY, 'Resource already exists', 409);
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      return errorResponse(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        'Referenced resource not found',
        400
      );
    }
  }

  // Log unexpected errors
  console.error(`[${context}] Error ${errorId}:`, error);

  return errorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    `Internal error (ref: ${errorId})`,
    500
  );
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message: string = 'Authentication required'): NextResponse<ApiResponse> {
  return errorResponse(ERROR_CODES.UNAUTHORIZED, message, 401);
}

/**
 * Standard forbidden response (authenticated but not authorized)
 */
export function forbiddenResponse(message: string = 'Access denied'): NextResponse<ApiResponse> {
  return errorResponse(ERROR_CODES.FORBIDDEN, message, 403);
}

/**
 * Standard not found response
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return errorResponse(ERROR_CODES.NOT_FOUND, `${resource} not found`, 404);
}

/**
 * Standard validation error response
 */
export function validationErrorResponse(details: unknown): NextResponse<ApiResponse> {
  return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid request data', 400, details);
}

/**
 * Parse pagination parameters from request
 *
 * @param searchParams - URL search parameters
 * @param defaults - Default limit and max limit
 *
 * @example
 * ```ts
 * const { limit, offset } = parsePagination(request.nextUrl.searchParams);
 * ```
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { limit?: number; maxLimit?: number } = {}
): { limit: number; offset: number } {
  const defaultLimit = defaults.limit ?? 50;
  const maxLimit = defaults.maxLimit ?? 100;

  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  let limit = limitParam ? parseInt(limitParam, 10) : defaultLimit;
  let offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  // Validate and clamp values
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  if (isNaN(offset) || offset < 0) offset = 0;

  return { limit, offset };
}
