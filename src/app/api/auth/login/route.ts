/**
 * File: src/app/api/auth/login/route.ts
 * Purpose: User login endpoint with PIN verification and session creation
 *
 * Flow:
 * 1. Validate input (email, PIN)
 * 2. Check rate limits (IP + email)
 * 3. Find user by email
 * 4. Check account lockout status
 * 5. Verify PIN against stored hash
 * 6. Handle failed attempts (increment counter, lock account after 10 failures)
 * 7. Check email verification and registration status
 * 8. Create JWT token and set httpOnly cookie
 * 9. Update last login timestamp
 * 10. Reset failed attempts counter
 * 11. Return user data and token
 *
 * Security:
 * - Rate limiting on IP and email
 * - Account lockout after 10 failed attempts (1 hour)
 * - Timing-attack resistant PIN verification
 * - httpOnly cookies for token storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyPIN, normalizePIN } from '@/lib/auth/pin';
import { createToken, setTokenCookie, JWTPayload } from '@/lib/auth/jwt';
import { normalizeEmail } from '@/lib/auth/email-service';
import {
  checkCombinedRateLimit,
  getClientIP,
  createRateLimitError,
  resetRateLimit,
} from '@/lib/auth/rate-limit';

interface LoginRequest {
  email: string;
  pin: string;
}

const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, pin } = body;

    // Input validation
    if (!email || !pin) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Email en PIN zijn verplicht',
        },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Onjuist email of PIN',
        },
        { status: 401 }
      );
    }

    // Validate PIN format
    const normalizedPIN = normalizePIN(pin);
    if (!normalizedPIN) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Onjuist email of PIN',
        },
        { status: 401 }
      );
    }

    // Check rate limits
    const clientIP = getClientIP(request);
    const rateLimit = await checkCombinedRateLimit(clientIP, normalizedEmail, '/api/auth/login');

    if (!rateLimit.allowed) {
      return NextResponse.json(createRateLimitError(rateLimit), { status: 429 });
    }

    const supabase = createServerClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(
        'id, email, name, role, email_verified, registration_status, rejection_reason, blocked_features'
      )
      .eq('email', normalizedEmail)
      .single();

    if (!user || userError) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Onjuist email of PIN',
        },
        { status: 401 }
      );
    }

    // Get PIN hash and check lockout status
    const { data: authPin, error: pinError } = await supabase
      .from('auth_pins')
      .select('pin_hash, failed_attempts, locked_until')
      .eq('user_id', user.id)
      .single();

    if (!authPin || pinError) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Onjuist email of PIN',
        },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (authPin.locked_until) {
      const lockedUntil = new Date(authPin.locked_until);
      const now = new Date();

      if (lockedUntil > now) {
        const minutesRemaining = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        return NextResponse.json(
          {
            success: false,
            error: 'ACCOUNT_LOCKED',
            message: `Account tijdelijk vergrendeld. Probeer over ${minutesRemaining} minuten opnieuw.`,
            details: {
              lockedUntil: lockedUntil.toISOString(),
            },
          },
          { status: 403 }
        );
      } else {
        // Lockout expired - reset
        await supabase
          .from('auth_pins')
          .update({
            locked_until: null,
            failed_attempts: 0,
          })
          .eq('user_id', user.id);
      }
    }

    // Verify PIN
    const isPINValid = await verifyPIN(pin, authPin.pin_hash);

    if (!isPINValid) {
      // Increment failed attempts
      const newFailedAttempts = authPin.failed_attempts + 1;
      const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;

      const updateData: any = {
        failed_attempts: newFailedAttempts,
        last_attempt_at: new Date().toISOString(),
      };

      // Lock account if max attempts reached
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        updateData.locked_until = lockoutUntil.toISOString();

        await supabase.from('auth_pins').update(updateData).eq('user_id', user.id);

        return NextResponse.json(
          {
            success: false,
            error: 'ACCOUNT_LOCKED',
            message:
              'Te veel mislukte inlogpogingen. Je account is tijdelijk vergrendeld voor 1 uur.',
            details: {
              lockedUntil: lockoutUntil.toISOString(),
            },
          },
          { status: 403 }
        );
      }

      // Update failed attempts
      await supabase.from('auth_pins').update(updateData).eq('user_id', user.id);

      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: `Onjuist PIN. Nog ${attemptsRemaining} ${attemptsRemaining === 1 ? 'poging' : 'pogingen'} over.`,
          attemptsRemaining,
        },
        { status: 401 }
      );
    }

    // PIN is correct - check email verification
    if (!user.email_verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Verifieer eerst je email. Check je inbox voor de verificatielink.',
          details: {
            verificationEmailSent: true,
          },
        },
        { status: 403 }
      );
    }

    // Check registration status
    if (user.registration_status === 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'REGISTRATION_PENDING',
          message: 'Je registratie wordt nog beoordeeld door een admin. Even geduld!',
        },
        { status: 403 }
      );
    }

    if (user.registration_status === 'rejected') {
      return NextResponse.json(
        {
          success: false,
          error: 'REGISTRATION_REJECTED',
          message: 'Je registratie is helaas niet goedgekeurd.',
          details: {
            rejectionReason: user.rejection_reason,
          },
        },
        { status: 403 }
      );
    }

    if (user.registration_status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: 'REGISTRATION_CANCELLED',
          message: 'Je hebt je afgemeld voor dit evenement.',
        },
        { status: 403 }
      );
    }

    // Login successful - reset failed attempts and update last login
    await supabase
      .from('auth_pins')
      .update({
        failed_attempts: 0,
        locked_until: null,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Fetch registration data including ai_assignment
    const { data: registration } = await supabase
      .from('registrations')
      .select('ai_assignment, birth_year, has_partner, partner_name, dietary_requirements, primary_skill, additional_skills, music_decade, music_genre, quiz_answers')
      .eq('user_id', user.id)
      .single();

    // Reset rate limits for successful login
    await resetRateLimit(clientIP, 'ip', '/api/auth/login');
    await resetRateLimit(normalizedEmail, 'email', '/api/auth/login');

    // Create JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'participant' | 'admin' | 'quizmaster',
      registrationStatus: user.registration_status as 'pending' | 'approved' | 'rejected' | 'cancelled',
      emailVerified: user.email_verified,
    };

    const token = await createToken(tokenPayload);

    // Create response with token cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          registrationStatus: user.registration_status,
          emailVerified: user.email_verified,
          blockedFeatures: user.blocked_features || [],
        },
        registration: registration ? {
          aiAssignment: registration.ai_assignment,
          birthYear: registration.birth_year,
          hasPartner: registration.has_partner,
          partnerName: registration.partner_name,
          dietaryRequirements: registration.dietary_requirements,
          primarySkill: registration.primary_skill,
          additionalSkills: registration.additional_skills,
          musicDecade: registration.music_decade,
          musicGenre: registration.music_genre,
          quizAnswers: registration.quiz_answers,
        } : null,
        token,
        message: `Welkom terug, ${user.name}!`,
      },
      { status: 200 }
    );

    return setTokenCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis bij het inloggen',
      },
      { status: 500 }
    );
  }
}
