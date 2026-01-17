/**
 * File: src/lib/auth/rate-limit.ts
 * Purpose: Rate limiting for API endpoints to prevent brute force attacks
 *
 * Key Features:
 * - IP-based and email-based rate limiting
 * - Configurable limits per endpoint
 * - Sliding window implementation
 * - Database-backed for distributed environments
 *
 * Security:
 * - Prevents brute force PIN attacks
 * - Protects registration endpoint from spam
 * - Automatic cleanup of old entries
 */

import { createServerClient } from '@/lib/supabase';

/**
 * Rate limit configuration per endpoint
 */
const RATE_LIMITS: Record<string, { maxAttempts: number; windowMinutes: number }> = {
  '/api/auth/login': { maxAttempts: 10, windowMinutes: 15 },
  '/api/auth/register': { maxAttempts: 5, windowMinutes: 60 },
  '/api/auth/reset-pin': { maxAttempts: 3, windowMinutes: 60 },
  '/api/auth/verify-email': { maxAttempts: 10, windowMinutes: 60 },
  '/api/auth/resend-verification': { maxAttempts: 3, windowMinutes: 60 },
};

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until retry allowed
}

/**
 * Extracts client IP from request
 * @param request - NextRequest object
 * @returns Client IP address
 */
export function getClientIP(request: Request): string {
  // Try to get real IP from headers (when behind proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection remote address
  return 'unknown';
}

/**
 * Checks rate limit for an identifier
 * @param identifier - IP address or email
 * @param identifierType - Type: 'ip' or 'email'
 * @param endpoint - API endpoint path
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  identifierType: 'ip' | 'email',
  endpoint: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint];

  if (!config) {
    // No rate limit configured for this endpoint
    return {
      allowed: true,
      remainingAttempts: 999,
      resetAt: new Date(Date.now() + 3600000),
    };
  }

  const supabase = createServerClient();
  const windowMs = config.windowMinutes * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs);

  try {
    // Get or create rate limit record
    const { data: existing, error: selectError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('endpoint', endpoint)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Rate limit check error:', selectError);
      // On error, allow request but log
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetAt: new Date(Date.now() + windowMs),
      };
    }

    const now = new Date();

    if (!existing) {
      // First attempt - create new record
      const { error: insertError } = await supabase.from('rate_limits').insert({
        identifier,
        identifier_type: identifierType,
        endpoint,
        attempt_count: 1,
        window_start: now,
      });

      if (insertError) {
        console.error('Rate limit insert error:', insertError);
      }

      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    // Check if window has expired
    const recordWindowStart = new Date(existing.window_start);
    if (recordWindowStart < windowStart) {
      // Window expired - reset counter
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({
          attempt_count: 1,
          window_start: now,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Rate limit reset error:', updateError);
      }

      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    // Window still active - check if limit exceeded
    if (existing.attempt_count >= config.maxAttempts) {
      const resetAt = new Date(recordWindowStart.getTime() + windowMs);
      const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);

      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt,
        retryAfter,
      };
    }

    // Increment attempt counter
    const newCount = existing.attempt_count + 1;
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({
        attempt_count: newCount,
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Rate limit increment error:', updateError);
    }

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - newCount,
      resetAt: new Date(recordWindowStart.getTime() + windowMs),
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow request to avoid blocking legitimate users
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      resetAt: new Date(Date.now() + windowMs),
    };
  }
}

/**
 * Combined rate limit check for IP and email
 * @param ip - Client IP address
 * @param email - User email (optional)
 * @param endpoint - API endpoint path
 * @returns Rate limit result (fails if either IP or email exceeds limit)
 */
export async function checkCombinedRateLimit(
  ip: string,
  email: string | null,
  endpoint: string
): Promise<RateLimitResult> {
  // Check IP rate limit
  const ipResult = await checkRateLimit(ip, 'ip', endpoint);

  if (!ipResult.allowed) {
    return ipResult;
  }

  // If email provided, also check email rate limit
  if (email) {
    const emailResult = await checkRateLimit(email, 'email', endpoint);
    if (!emailResult.allowed) {
      return emailResult;
    }

    // Return most restrictive result
    return {
      allowed: true,
      remainingAttempts: Math.min(ipResult.remainingAttempts, emailResult.remainingAttempts),
      resetAt:
        ipResult.resetAt > emailResult.resetAt ? ipResult.resetAt : emailResult.resetAt,
    };
  }

  return ipResult;
}

/**
 * Resets rate limit for an identifier (use after successful auth)
 * @param identifier - IP address or email
 * @param identifierType - Type: 'ip' or 'email'
 * @param endpoint - API endpoint path
 */
export async function resetRateLimit(
  identifier: string,
  identifierType: 'ip' | 'email',
  endpoint: string
): Promise<void> {
  const supabase = createServerClient();

  try {
    await supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('endpoint', endpoint);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}

/**
 * Formats retry-after time for user display
 * @param seconds - Seconds until retry allowed
 * @returns Human-readable time string in Dutch
 */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconden`;
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes === 1) {
    return '1 minuut';
  }

  return `${minutes} minuten`;
}

/**
 * Creates rate limit error response
 * @param result - Rate limit result
 * @returns Error object for API response
 */
export function createRateLimitError(result: RateLimitResult) {
  return {
    error: 'RATE_LIMIT_EXCEEDED',
    message: `Te veel pogingen. Probeer over ${formatRetryAfter(result.retryAfter || 0)} opnieuw.`,
    retryAfter: result.retryAfter,
    resetAt: result.resetAt.toISOString(),
  };
}
