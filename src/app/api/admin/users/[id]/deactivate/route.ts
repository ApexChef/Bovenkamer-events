/**
 * File: src/app/api/admin/users/[id]/deactivate/route.ts
 * Purpose: Admin endpoint for deactivating users (soft delete)
 *
 * Endpoints:
 * - PATCH: Deactivate user (soft delete with audit trail)
 *
 * Request Body:
 * - reason: string (explanation for deactivation)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 * - Self-protection: Cannot deactivate own account
 * - Records admin who performed the action
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * PATCH /api/admin/users/[id]/deactivate
 * Deactivate user (soft delete)
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

    // Self-protection: Cannot deactivate own account
    if (userId === user.userId) {
      return NextResponse.json(
        {
          error: 'CANNOT_DEACTIVATE_SELF',
          message: 'Je kunt je eigen account niet deactiveren',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'REASON_REQUIRED',
          message: 'Reden voor deactivering is verplicht',
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user exists and is active
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

    if (!targetUser.is_active) {
      return NextResponse.json(
        {
          error: 'ALREADY_DEACTIVATED',
          message: 'Gebruiker is al gedeactiveerd',
        },
        { status: 400 }
      );
    }

    // Use database function to deactivate user
    const { data: result, error: deactivateError } = await supabase
      .rpc('deactivate_user', {
        p_user_id: userId,
        p_deleted_by: user.userId,
        p_deletion_reason: reason.trim(),
      });

    if (deactivateError) {
      console.error('Error deactivating user:', deactivateError);
      return NextResponse.json(
        {
          error: 'DEACTIVATION_FAILED',
          message: 'Gebruiker kon niet worden gedeactiveerd',
        },
        { status: 500 }
      );
    }

    if (!result) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'Gebruiker niet gevonden of al gedeactiveerd',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Gebruiker ${targetUser.name} (${targetUser.email}) is gedeactiveerd`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        isActive: false,
        deletedBy: user.userId,
        deletionReason: reason.trim(),
      },
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
