/**
 * File: src/app/api/admin/users/[id]/role/route.ts
 * Purpose: Admin endpoint for changing user roles
 *
 * Endpoints:
 * - PATCH: Change user role (participant, admin, quizmaster)
 *
 * Request Body:
 * - role: 'participant' | 'admin' | 'quizmaster'
 *
 * Security:
 * - Requires admin role (checked via JWT)
 * - Self-protection: Cannot demote own admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * PATCH /api/admin/users/[id]/role
 * Change user role
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

    // Parse request body
    const body = await request.json();
    const { role } = body;

    // Validate role
    const validRoles = ['participant', 'admin', 'quizmaster'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        {
          error: 'INVALID_ROLE',
          message: 'Ongeldige rol. Moet zijn: participant, admin of quizmaster',
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get current user data
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, name, role')
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

    // Self-protection: Cannot demote own admin role
    if (userId === user.userId && targetUser.role === 'admin' && role !== 'admin') {
      return NextResponse.json(
        {
          error: 'CANNOT_DEMOTE_SELF',
          message: 'Je kunt je eigen admin-rol niet verwijderen',
        },
        { status: 400 }
      );
    }

    // Check if role is already set to the target value
    if (targetUser.role === role) {
      return NextResponse.json(
        {
          error: 'ROLE_UNCHANGED',
          message: `Gebruiker heeft al de rol '${role}'`,
        },
        { status: 400 }
      );
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json(
        {
          error: 'UPDATE_FAILED',
          message: 'Rol kon niet worden gewijzigd',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Rol van ${targetUser.name} gewijzigd van '${targetUser.role}' naar '${role}'`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Change user role error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
