/**
 * File: src/app/api/auth/resend-verification/route.ts
 * Purpose: Resend email verification link
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { normalizeEmail, resendVerification } from '@/lib/auth/email-service';
import { checkCombinedRateLimit, getClientIP, createRateLimitError } from '@/lib/auth/rate-limit';
import { randomUUID } from 'crypto';

interface ResendRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResendRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Email is verplicht' },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json(
        { success: true, message: 'Als dit email adres bij ons bekend is, ontvang je een nieuwe verificatie link.' },
        { status: 200 }
      );
    }

    // Check rate limits
    const clientIP = getClientIP(request);
    const rateLimit = await checkCombinedRateLimit(
      clientIP,
      normalizedEmail,
      '/api/auth/resend-verification'
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(createRateLimitError(rateLimit), { status: 429 });
    }

    const supabase = createServerClient();

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, email_verified')
      .eq('email', normalizedEmail)
      .single();

    // Always return success to prevent email enumeration
    if (!user || userError) {
      return NextResponse.json(
        { success: true, message: 'Als dit email adres bij ons bekend is, ontvang je een nieuwe verificatie link.' },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { success: true, message: 'Je email is al geverifieerd. Je kunt inloggen.' },
        { status: 200 }
      );
    }

    // Generate new verification token
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Delete old verification tokens for this user
    await supabase
      .from('email_verifications')
      .delete()
      .eq('user_id', user.id)
      .is('verified_at', null);

    // Create new verification token
    const { error: tokenError } = await supabase.from('email_verifications').insert({
      user_id: user.id,
      token: verificationToken,
      expires_at: expiresAt.toISOString(),
    });

    if (tokenError) {
      console.error('Error creating verification token:', tokenError);
      return NextResponse.json(
        { success: false, error: 'SERVER_ERROR', message: 'Kon verificatie niet aanmaken' },
        { status: 500 }
      );
    }

    // Send verification email
    const emailResult = await resendVerification(normalizedEmail, user.name, verificationToken);

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
    }

    return NextResponse.json(
      { success: true, message: 'Als dit email adres bij ons bekend is, ontvang je een nieuwe verificatie link.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
