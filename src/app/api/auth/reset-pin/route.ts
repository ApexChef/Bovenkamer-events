/**
 * File: src/app/api/auth/reset-pin/route.ts
 * Purpose: PIN reset request endpoint - sends reset email with token
 *
 * Flow:
 * 1. Validate email
 * 2. Check rate limits
 * 3. Find user by email
 * 4. Generate reset token (stored in email_verifications table with special flag)
 * 5. Send PIN reset email
 * 6. Return success response
 *
 * Security:
 * - Rate limiting to prevent abuse
 * - Token expires in 1 hour
 * - Doesn't reveal if email exists (returns success either way)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { normalizeEmail, sendPINResetEmail } from '@/lib/auth/email-service';
import { checkCombinedRateLimit, getClientIP, createRateLimitError } from '@/lib/auth/rate-limit';
import { randomUUID } from 'crypto';

interface ResetPINRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResetPINRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Email is verplicht',
        },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      // Don't reveal invalid email format - return success
      return NextResponse.json(
        {
          success: true,
          message:
            'Als dit email adres bij ons bekend is, ontvang je binnen enkele minuten een reset link.',
        },
        { status: 200 }
      );
    }

    // Check rate limits
    const clientIP = getClientIP(request);
    const rateLimit = await checkCombinedRateLimit(
      clientIP,
      normalizedEmail,
      '/api/auth/reset-pin'
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(createRateLimitError(rateLimit), { status: 429 });
    }

    const supabase = createServerClient();

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', normalizedEmail)
      .single();

    // Always return success to prevent email enumeration
    if (!user || userError) {
      return NextResponse.json(
        {
          success: true,
          message:
            'Als dit email adres bij ons bekend is, ontvang je binnen enkele minuten een reset link.',
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store in email_verifications table (reuse for PIN reset)
    const { error: tokenError } = await supabase.from('email_verifications').insert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
    });

    if (tokenError) {
      console.error('Error creating reset token:', tokenError);
      // Still return success to user
    } else {
      // Send reset email
      const emailResult = await sendPINResetEmail(normalizedEmail, user.name, resetToken);

      if (!emailResult.success) {
        console.error('Failed to send PIN reset email:', emailResult.error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Als dit email adres bij ons bekend is, ontvang je binnen enkele minuten een reset link.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PIN reset request error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis. Probeer het later opnieuw.',
      },
      { status: 500 }
    );
  }
}
