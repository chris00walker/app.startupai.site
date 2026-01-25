/**
 * Simple in-memory rate limiter for API routes
 *
 * Uses a sliding window algorithm with per-key tracking.
 * Note: In production with multiple serverless instances,
 * consider using Redis or a database-backed rate limiter.
 *
 * @story US-AS03
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Auto-cleanup old entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the window */
  remaining: number;
  /** Time in ms until the rate limit resets */
  resetIn: number;
}

/**
 * Check rate limit for a given key
 *
 * @param key - Unique identifier (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Create a rate limiter with predefined configuration
 *
 * @param config - Rate limit configuration
 * @returns Function to check rate limit for a key
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (key: string) => checkRateLimit(key, config);
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  /**
   * 2FA verification: 5 attempts per 15 minutes per user
   * Strict limit to prevent brute force attacks on TOTP codes
   */
  twoFactorVerify: createRateLimiter({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  /**
   * Recovery code: 3 attempts per hour per user
   * Very strict to prevent recovery code enumeration
   */
  recoveryCode: createRateLimiter({
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  }),

  /**
   * Password change: 3 attempts per hour per user
   */
  passwordChange: createRateLimiter({
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  }),

  /**
   * Login: 10 attempts per 15 minutes per IP
   */
  login: createRateLimiter({
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),
};
