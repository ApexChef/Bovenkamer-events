/**
 * File: src/app/api/auth/reset-pin/[token]/route.ts
 * Purpose: Validate and complete PIN reset
 *
 * GET: Validate token (check if exists and not expired)
 * POST: Complete reset (validate token, update PIN, delete token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { hashPIN } from '@/lib/auth/pin';

interface ResetPINBody {
  pin: string;
}

// GET: Validate token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Token is verplicht' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Find token in email_verifications table
    const { data: verification, error } = await supabase
      .from('email_verifications')
      .select('id, user_id, expires_at')
      .eq('token', token)
      .single();

    if (error || !verification) {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Ongeldige of verlopen reset link' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      // Delete expired token
      await supabase.from('email_verifications').delete().eq('id', verification.id);

      return NextResponse.json(
        { success: false, error: 'EXPIRED_TOKEN', message: 'Reset link is verlopen' },
        { status: 410 }
      );
    }

    return NextResponse.json({ success: true, message: 'Token is geldig' }, { status: 200 });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

// POST: Complete PIN reset
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body: ResetPINBody = await request.json();
    const { pin } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Token is verplicht' },
        { status: 400 }
      );
    }

    // Validate PIN format (2 letters + 2 numbers)
    if (!pin || !/^[A-Z]{2}[0-9]{2}$/.test(pin)) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'PIN moet format XX## hebben (2 letters, 2 cijfers)',
          fields: { pin: 'Ongeldig PIN format' },
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Find and validate token
    const { data: verification, error: verifyError } = await supabase
      .from('email_verifications')
      .select('id, user_id, expires_at')
      .eq('token', token)
      .single();

    if (verifyError || !verification) {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Ongeldige of verlopen reset link' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      await supabase.from('email_verifications').delete().eq('id', verification.id);

      return NextResponse.json(
        { success: false, error: 'EXPIRED_TOKEN', message: 'Reset link is verlopen' },
        { status: 410 }
      );
    }

    // Hash new PIN
    const pinHashResult = await hashPIN(pin);
    if (!pinHashResult) {
      return NextResponse.json(
        { success: false, error: 'SERVER_ERROR', message: 'Kon PIN niet hashen' },
        { status: 500 }
      );
    }

    // Check if auth_pins record exists
    const { data: existingPin } = await supabase
      .from('auth_pins')
      .select('id')
      .eq('user_id', verification.user_id)
      .single();

    let updateError;

    if (existingPin) {
      // Update existing record
      const { error } = await supabase
        .from('auth_pins')
        .update({
          pin_hash: pinHashResult.hash,
          pin_salt: pinHashResult.salt,
          failed_attempts: 0,
          locked_until: null
        })
        .eq('user_id', verification.user_id);
      updateError = error;
      console.log('Updated existing auth_pins record for user:', verification.user_id);
    } else {
      // Insert new record
      const { error } = await supabase
        .from('auth_pins')
        .insert({
          user_id: verification.user_id,
          pin_hash: pinHashResult.hash,
          pin_salt: pinHashResult.salt,
          failed_attempts: 0,
          locked_until: null
        });
      updateError = error;
      console.log('Inserted new auth_pins record for user:', verification.user_id);
    }

    if (updateError) {
      console.error('PIN update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'SERVER_ERROR', message: 'Kon PIN niet updaten' },
        { status: 500 }
      );
    }

    // Delete used token
    await supabase.from('email_verifications').delete().eq('id', verification.id);

    return NextResponse.json(
      { success: true, message: 'PIN succesvol gereset' },
      { status: 200 }
    );
  } catch (error) {
    console.error('PIN reset error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
