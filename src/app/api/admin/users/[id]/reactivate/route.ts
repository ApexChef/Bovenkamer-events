/**
 * File: src/app/api/admin/users/[id]/reactivate/route.ts
 * Purpose: Admin endpoint for reactivating deactivated users
 *
 * Endpoints:
 * - PATCH: Reactivate user (restore from soft delete)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 * - Clears deletion metadata upon reactivation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * PATCH /api/admin/users/[id]/reactivate
 * Reactivate deactivated user
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
    const supabase = createServerClient();

    // Check if user exists and is inactive
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, is_active')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'Gebruiker niet gevonden',
        },
        { status: 404 }
      );
    }

    if (targetUser.is_active) {
      return NextResponse.json(
        {
          error: 'ALREADY_ACTIVE',
          message: 'Gebruiker is al actief',
        },
        { status: 400 }
      );
    }

    // Use database function to reactivate user
    const { data: result, error: reactivateError } = await supabase
      .rpc('reactivate_user', {
        p_user_id: userId,
      });

    if (reactivateError) {
      console.error('Error reactivating user:', reactivateError);
      return NextResponse.json(
        {
          error: 'REACTIVATION_FAILED',
          message: 'Gebruiker kon niet worden gereactiveerd',
        },
        { status: 500 }
      );
    }

    if (!result) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'Gebruiker niet gevonden of al actief',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Gebruiker ${targetUser.name} (${targetUser.email}) is gereactiveerd`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        isActive: true,
      },
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
