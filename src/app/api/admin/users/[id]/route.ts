/**
 * File: src/app/api/admin/users/[id]/route.ts
 * Purpose: Admin endpoint for individual user operations
 *
 * Endpoints:
 * - GET: Get detailed user information including registration and points history
 * - DELETE: Hard delete user (requires confirm=DELETE query parameter)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 * - Self-protection: Cannot delete own account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import type { AdminUserDetail, PointsLedgerEntry } from '@/types';

/**
 * GET /api/admin/users/[id]
 * Get detailed user information with registration data and points history
 */
export async function GET(
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

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Database error fetching user:', userError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: `Database fout: ${userError.message}`,
          details: userError,
        },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'Gebruiker niet gevonden',
        },
        { status: 404 }
      );
    }

    // Get registration data
    const { data: registrationData } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get points history
    const { data: pointsHistory } = await supabase
      .from('points_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get deleted_by user info if applicable
    let deletedByUser = undefined;
    if (userData.deleted_by) {
      const { data: deletedByData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', userData.deleted_by)
        .single();

      if (deletedByData) {
        deletedByUser = deletedByData;
      }
    }

    // Format points history
    const formattedPointsHistory: PointsLedgerEntry[] = (pointsHistory || []).map((entry: any) => ({
      id: entry.id,
      userId: entry.user_id,
      source: entry.source,
      points: entry.points,
      description: entry.description,
      createdAt: entry.created_at,
    }));

    // Format response
    const userDetail: AdminUserDetail = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      auth_code: userData.auth_code,
      email_verified: userData.email_verified,
      registration_status: userData.registration_status,
      rejection_reason: userData.rejection_reason,
      approved_at: userData.approved_at,
      approved_by: userData.approved_by,
      blocked_features: userData.blocked_features,
      last_login_at: userData.last_login_at,
      total_points: userData.total_points,
      registration_points: userData.registration_points,
      prediction_points: userData.prediction_points,
      quiz_points: userData.quiz_points,
      game_points: userData.game_points,
      is_active: userData.is_active,
      deleted_at: userData.deleted_at,
      deleted_by: userData.deleted_by,
      deletion_reason: userData.deletion_reason,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      registrationData: registrationData || undefined,
      pointsHistory: formattedPointsHistory,
      deletedByUser,
    };

    return NextResponse.json(userDetail);
  } catch (error) {
    console.error('Get user detail error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Hard delete user (permanently removes from database)
 * Requires confirm=DELETE query parameter for safety
 */
export async function DELETE(
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

    // Self-protection: Cannot delete own account
    if (userId === user.userId) {
      return NextResponse.json(
        {
          error: 'CANNOT_DELETE_SELF',
          message: 'Je kunt je eigen account niet verwijderen',
        },
        { status: 400 }
      );
    }

    // Check for confirmation parameter
    const searchParams = request.nextUrl.searchParams;
    const confirm = searchParams.get('confirm');

    if (confirm !== 'DELETE') {
      return NextResponse.json(
        {
          error: 'CONFIRMATION_REQUIRED',
          message: 'Bevestiging vereist. Voeg ?confirm=DELETE toe aan de URL',
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'Gebruiker niet gevonden',
        },
        { status: 404 }
      );
    }

    // Hard delete user (CASCADE will delete related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        {
          error: 'DELETE_FAILED',
          message: 'Gebruiker kon niet worden verwijderd',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Gebruiker ${existingUser.name} (${existingUser.email}) permanent verwijderd`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
