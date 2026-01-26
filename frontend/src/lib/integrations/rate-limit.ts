/**
 * Rate Limiting for Provider APIs
 *
 * Implements token bucket rate limiting with exponential backoff
 * to prevent hitting API rate limits during bulk operations.
 *
 * @story US-BI01, US-BI02
 */

import type { IntegrationType } from '@/types/integrations';

/**
 * Rate limit configuration for each provider
 * Based on documented API limits
 */
const RATE_LIMITS: Record<IntegrationType, RateLimitConfig> = {
  notion: {
    tokensPerSecond: 3,
    maxBurst: 10,
    retryAfterHeader: 'Retry-After',
  },
  google_drive: {
    tokensPerSecond: 10,
    maxBurst: 100,
    retryAfterHeader: 'Retry-After',
  },
  airtable: {
    tokensPerSecond: 5,
    maxBurst: 20,
    retryAfterHeader: 'Retry-After',
  },
  slack: {
    tokensPerSecond: 1, // Slack has tier-based limits
    maxBurst: 5,
    retryAfterHeader: 'Retry-After',
  },
  lark: {
    tokensPerSecond: 5,
    maxBurst: 20,
    retryAfterHeader: 'X-Rate-Limit-Retry-After',
  },
  dropbox: {
    tokensPerSecond: 10,
    maxBurst: 50,
    retryAfterHeader: 'Retry-After',
  },
  linear: {
    tokensPerSecond: 10, // Linear GraphQL has 10k/hour
    maxBurst: 50,
    retryAfterHeader: 'Retry-After',
  },
  hubspot: {
    tokensPerSecond: 10,
    maxBurst: 100,
    retryAfterHeader: 'Retry-After',
  },
  figma: {
    tokensPerSecond: 2, // Figma is more restrictive
    maxBurst: 10,
    retryAfterHeader: 'Retry-After',
  },
  github: {
    tokensPerSecond: 83, // 5000/hour = ~83/min
    maxBurst: 100,
    retryAfterHeader: 'X-RateLimit-Reset',
  },
};

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  tokensPerSecond: number;
  maxBurst: number;
  retryAfterHeader: string;
}

/**
 * Token bucket state
 */
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  config: RateLimitConfig;
}

/**
 * Rate limiter instance storage
 */
const buckets = new Map<IntegrationType, TokenBucket>();

/**
 * Get or create a token bucket for a provider
 */
function getBucket(provider: IntegrationType): TokenBucket {
  let bucket = buckets.get(provider);

  if (!bucket) {
    const config = RATE_LIMITS[provider];
    bucket = {
      tokens: config.maxBurst,
      lastRefill: Date.now(),
      config,
    };
    buckets.set(provider, bucket);
  }

  return bucket;
}

/**
 * Refill tokens based on elapsed time
 */
function refillBucket(bucket: TokenBucket): void {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000; // in seconds
  const tokensToAdd = elapsed * bucket.config.tokensPerSecond;

  bucket.tokens = Math.min(bucket.config.maxBurst, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
}

/**
 * Wait for a token to become available
 */
async function waitForToken(provider: IntegrationType): Promise<void> {
  const bucket = getBucket(provider);
  refillBucket(bucket);

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return;
  }

  // Calculate wait time for next token
  const tokensNeeded = 1 - bucket.tokens;
  const waitMs = (tokensNeeded / bucket.config.tokensPerSecond) * 1000;

  await sleep(waitMs);
  bucket.tokens = 0;
  bucket.lastRefill = Date.now();
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number, baseDelay = 1000, maxDelay = 60000): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter (10% random variance)
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
}

/**
 * Parse retry-after header value
 * Can be either seconds or HTTP date
 */
function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  // Try parsing as number (seconds)
  const seconds = parseInt(value, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }

  // Try parsing as HTTP date
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}

/**
 * Rate limited fetch options
 */
export interface RateLimitedFetchOptions extends RequestInit {
  maxRetries?: number;
  baseDelay?: number;
}

/**
 * Rate limited fetch result
 */
export interface RateLimitedFetchResult<T> {
  data: T;
  retries: number;
  rateLimited: boolean;
}

/**
 * Make a rate-limited API request with automatic retry on 429
 *
 * @param provider - Integration provider type
 * @param url - Request URL
 * @param options - Fetch options plus rate limit settings
 * @returns Response data with metadata
 */
export async function rateLimitedFetch<T = unknown>(
  provider: IntegrationType,
  url: string,
  options: RateLimitedFetchOptions = {}
): Promise<RateLimitedFetchResult<T>> {
  const { maxRetries = 5, baseDelay = 1000, ...fetchOptions } = options;

  let retries = 0;
  let rateLimited = false;

  while (true) {
    // Wait for rate limit token
    await waitForToken(provider);

    const response = await fetch(url, fetchOptions);

    // Handle rate limit response
    if (response.status === 429) {
      rateLimited = true;

      if (retries >= maxRetries) {
        throw new Error(`Rate limit exceeded for ${provider} after ${maxRetries} retries`);
      }

      // Check for Retry-After header
      const config = RATE_LIMITS[provider];
      const retryAfter = parseRetryAfter(response.headers.get(config.retryAfterHeader));
      const delay = retryAfter || getBackoffDelay(retries, baseDelay);

      console.log(`[rate-limit] ${provider} rate limited, retrying in ${Math.round(delay)}ms (attempt ${retries + 1}/${maxRetries})`);

      await sleep(delay);
      retries++;
      continue;
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error for ${provider}: ${response.status} - ${errorText}`);
    }

    // Parse response
    const data = await response.json() as T;

    return { data, retries, rateLimited };
  }
}

/**
 * Execute a function with rate limiting
 * Useful for wrapping SDK methods that don't use fetch directly
 */
export async function withRateLimit<T>(
  provider: IntegrationType,
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<{ data: T; retries: number }> {
  const { maxRetries = 5, baseDelay = 1000 } = options;
  let retries = 0;

  while (true) {
    // Wait for rate limit token
    await waitForToken(provider);

    try {
      const data = await fn();
      return { data, retries };
    } catch (error) {
      // Check if it's a rate limit error
      const isRateLimited =
        error instanceof Error &&
        (error.message.includes('rate limit') ||
          error.message.includes('429') ||
          error.message.includes('too many requests'));

      if (isRateLimited && retries < maxRetries) {
        const delay = getBackoffDelay(retries, baseDelay);
        console.log(`[rate-limit] ${provider} rate limited, retrying in ${Math.round(delay)}ms (attempt ${retries + 1}/${maxRetries})`);

        await sleep(delay);
        retries++;
        continue;
      }

      throw error;
    }
  }
}

/**
 * Reset rate limiter for a provider (for testing)
 */
export function resetRateLimiter(provider: IntegrationType): void {
  buckets.delete(provider);
}

/**
 * Get current token count for a provider (for monitoring)
 */
export function getAvailableTokens(provider: IntegrationType): number {
  const bucket = buckets.get(provider);
  if (!bucket) {
    return RATE_LIMITS[provider].maxBurst;
  }
  refillBucket(bucket);
  return bucket.tokens;
}
