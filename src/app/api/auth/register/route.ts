/**
 * File: src/app/api/auth/register/route.ts
 * Purpose: User registration endpoint with PIN creation and email verification
 *
 * Flow:
 * 1. Validate input (name, email, PIN format)
 * 2. Check rate limits (IP + email)
 * 3. Verify email uniqueness
 * 4. Hash PIN securely
 * 5. Create user and auth_pins records (transaction)
 * 6. Generate and store email verification token
 * 7. Send verification email
 * 8. Return success response
 *
 * Security:
 * - Rate limiting on IP and email
 * - PIN format validation
 * - bcrypt hashing for PINs
 * - Email verification required
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { validatePINFields, hashPIN } from '@/lib/auth/pin';
import { normalizeEmail, sendVerificationEmail } from '@/lib/auth/email-service';
import { checkCombinedRateLimit, getClientIP, createRateLimitError } from '@/lib/auth/rate-limit';
import { randomUUID } from 'crypto';

interface RegisterRequest {
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  pin: string;
  pinConfirm?: string;
  expectedParticipantId?: string;
  minimal?: boolean; // Flag for minimal/progressive registration
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { firstName, lastName, name, email, pin, pinConfirm, expectedParticipantId, minimal } = body;

    // Input validation - for minimal registration, pinConfirm is handled client-side
    if (!name || !email || !pin) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          fields: {
            name: !name ? 'Naam is verplicht' : undefined,
            email: !email ? 'Email is verplicht' : undefined,
            pin: !pin ? 'PIN is verplicht' : undefined,
          },
        },
        { status: 400 }
      );
    }

    // For non-minimal registration, require pinConfirm
    if (!minimal && !pinConfirm) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          fields: { pinConfirm: 'PIN bevestiging is verplicht' },
        },
        { status: 400 }
      );
    }

    // Validate PIN format - for minimal, use pin as both values
    const pinErrors = validatePINFields(pin, minimal ? pin : pinConfirm!);
    if (Object.keys(pinErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          fields: pinErrors,
        },
        { status: 400 }
      );
    }

    // Normalize and validate email
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          fields: { email: 'Ongeldig email adres' },
        },
        { status: 400 }
      );
    }

    // Check rate limits
    const clientIP = getClientIP(request);
    const rateLimit = await checkCombinedRateLimit(clientIP, normalizedEmail, '/api/auth/register');

    if (!rateLimit.allowed) {
      return NextResponse.json(createRateLimitError(rateLimit), { status: 429 });
    }

    const supabase = createServerClient();

    // Check if email already registered
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, registration_status')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_EXISTS',
          message: 'Dit email adres is al geregistreerd. Probeer in te loggen.',
        },
        { status: 409 }
      );
    }

    // Hash PIN
    const pinHash = await hashPIN(pin);
    if (!pinHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'SERVER_ERROR',
          message: 'Fout bij verwerken van PIN',
        },
        { status: 500 }
      );
    }

    // Create user - for minimal registration, auto-approve for immediate access
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        name: name.trim(),
        first_name: firstName?.trim() || name.trim().split(' ')[0],
        last_name: lastName?.trim() || name.trim().split(' ').slice(1).join(' '),
        role: 'participant',
        email_verified: minimal ? true : false, // Skip email verification for minimal
        registration_status: minimal ? 'approved' : 'pending', // Auto-approve for minimal
        profile_completion: minimal ? 10 : 0, // Track profile completion (10 = basic info)
      })
      .select('id, email, name, first_name, last_name, registration_status, profile_completion')
      .single();

    if (createUserError || !newUser) {
      console.error('Error creating user:', createUserError);
      return NextResponse.json(
        {
          success: false,
          error: 'SERVER_ERROR',
          message: 'Kon gebruiker niet aanmaken',
        },
        { status: 500 }
      );
    }

    // Store PIN hash
    const { error: pinError } = await supabase.from('auth_pins').insert({
      user_id: newUser.id,
      pin_hash: pinHash.hash,
      pin_salt: pinHash.salt,
      failed_attempts: 0,
    });

    if (pinError) {
      console.error('Error storing PIN:', pinError);
      // Rollback user creation
      await supabase.from('users').delete().eq('id', newUser.id);

      return NextResponse.json(
        {
          success: false,
          error: 'SERVER_ERROR',
          message: 'Kon PIN niet opslaan',
        },
        { status: 500 }
      );
    }

    // Skip email verification for minimal registration (they get immediate access)
    if (!minimal) {
      // Generate verification token
      const verificationToken = randomUUID();
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      const { error: verificationError } = await supabase.from('email_verifications').insert({
        user_id: newUser.id,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
      });

      if (verificationError) {
        console.error('Error creating verification token:', verificationError);
        // Continue anyway - user can request resend
      }

      // Send verification email
      const emailResult = await sendVerificationEmail(
        normalizedEmail,
        name.trim(),
        verificationToken
      );

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        // Continue anyway - user can request resend
      }
    }

    // If registered from expected participants list, mark it
    if (expectedParticipantId) {
      await supabase
        .from('expected_participants')
        .update({
          is_registered: true,
          registered_by_user_id: newUser.id,
        })
        .eq('id', expectedParticipantId);
    }

    // For minimal registration, return user object and token for immediate login
    if (minimal) {
      // Create a registration record with basic info
      const { error: regError } = await supabase.from('registrations').insert({
        user_id: newUser.id,
        name: name.trim(),
        first_name: firstName?.trim() || name.trim().split(' ')[0],
        last_name: lastName?.trim() || name.trim().split(' ').slice(1).join(' '),
        status: 'approved',
      });

      if (regError) {
        console.error('Error creating registration:', regError);
        // Continue anyway - the profile can be created later
      }

      // Award basic points for completing registration
      await supabase.from('points_ledger').insert({
        user_id: newUser.id,
        source: 'registration',
        points: 10, // SECTION_POINTS.basic
        description: 'profile_basic',
      });

      // Generate a simple session token
      const sessionToken = randomUUID();

      return NextResponse.json(
        {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            registrationStatus: newUser.registration_status,
            profileCompletion: newUser.profile_completion,
          },
          token: sessionToken,
          message: 'Registratie succesvol! Je kunt nu je profiel verder aanvullen.',
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        userId: newUser.id,
        message: `Verificatie email verzonden naar ${normalizedEmail}`,
        nextStep: 'email-verification',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis bij het registreren',
      },
      { status: 500 }
    );
  }
}
