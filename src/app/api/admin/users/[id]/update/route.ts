/**
 * File: src/app/api/admin/users/[id]/update/route.ts
 * Purpose: Admin endpoint for updating user information
 *
 * Endpoints:
 * - PATCH: Update user basic information (name, email)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

interface UpdateUserBody {
  name?: string;
  email?: string;
}

/**
 * PATCH /api/admin/users/[id]/update
 * Update user basic information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Admin toegang vereist',
        },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body: UpdateUserBody = await request.json();

    // Validate input
    const updates: Record<string, string> = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (name.length < 2) {
        return NextResponse.json(
          {
            error: 'INVALID_NAME',
            message: 'Naam moet minimaal 2 tekens bevatten',
          },
          { status: 400 }
        );
      }
      updates.name = name;
    }

    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            error: 'INVALID_EMAIL',
            message: 'Ongeldig email adres',
          },
          { status: 400 }
        );
      }
      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error: 'NO_UPDATES',
          message: 'Geen wijzigingen opgegeven',
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'Gebruiker niet gevonden',
        },
        { status: 404 }
      );
    }

    // If email is being changed, check for duplicates
    if (updates.email && updates.email !== existingUser.email) {
      const { data: emailExists } = await supabase
        .from('users')
        .select('id')
        .eq('email', updates.email)
        .neq('id', userId)
        .single();

      if (emailExists) {
        return NextResponse.json(
          {
            error: 'EMAIL_EXISTS',
            message: 'Dit email adres is al in gebruik',
          },
          { status: 409 }
        );
      }
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        {
          error: 'UPDATE_FAILED',
          message: 'Gebruiker kon niet worden bijgewerkt',
        },
        { status: 500 }
      );
    }

    // Also update name in registrations table if name was changed
    if (updates.name) {
      await supabase
        .from('registrations')
        .update({ name: updates.name })
        .eq('user_id', userId);
    }

    // Also update email in registrations table if email was changed
    if (updates.email) {
      await supabase
        .from('registrations')
        .update({ email: updates.email })
        .eq('user_id', userId);
    }

    return NextResponse.json({
      success: true,
      message: 'Gebruiker succesvol bijgewerkt',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
