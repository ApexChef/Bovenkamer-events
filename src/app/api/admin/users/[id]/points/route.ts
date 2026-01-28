/**
 * File: src/app/api/admin/users/[id]/points/route.ts
 * Purpose: Admin endpoint for adjusting user points
 *
 * Endpoints:
 * - POST: Add or subtract points from user account
 *
 * Request Body:
 * - points: number (positive or negative)
 * - source: 'registration' | 'prediction' | 'quiz' | 'game' | 'bonus'
 * - reason: string (description of the adjustment)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 * - Automatically appends admin email to description for audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * POST /api/admin/users/[id]/points
 * Add or subtract points from user account
 */
export async function POST(
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
    const { points, source, reason } = body;

    // Validate input
    if (typeof points !== 'number' || isNaN(points)) {
      return NextResponse.json(
        {
          error: 'INVALID_POINTS',
          message: 'Ongeldig aantal punten. Moet een nummer zijn',
        },
        { status: 400 }
      );
    }

    if (points === 0) {
      return NextResponse.json(
        {
          error: 'ZERO_POINTS',
          message: 'Aantal punten mag niet 0 zijn',
        },
        { status: 400 }
      );
    }

    const validSources = ['registration', 'prediction', 'quiz', 'game', 'bonus'];
    if (!source || !validSources.includes(source)) {
      return NextResponse.json(
        {
          error: 'INVALID_SOURCE',
          message: 'Ongeldige bron. Moet zijn: registration, prediction, quiz, game of bonus',
        },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'REASON_REQUIRED',
          message: 'Reden voor puntenaanpassing is verplicht',
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user exists
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, total_points')
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

    // Check if points would result in negative total
    const newTotal = targetUser.total_points + points;
    if (newTotal < 0) {
      return NextResponse.json(
        {
          error: 'NEGATIVE_TOTAL',
          message: `Puntenaanpassing zou resulteren in negatief totaal (${newTotal}). Huidige punten: ${targetUser.total_points}`,
        },
        { status: 400 }
      );
    }

    // Append admin email to description for audit trail
    const description = `${reason.trim()} (door ${user.email})`;

    // Use the database function to add points atomically
    const { data: result, error: pointsError } = await supabase
      .rpc('add_user_points', {
        p_user_id: userId,
        p_source: source,
        p_points: points,
        p_description: description,
      });

    if (pointsError) {
      console.error('Error adding points:', pointsError);
      return NextResponse.json(
        {
          error: 'POINTS_UPDATE_FAILED',
          message: 'Punten konden niet worden aangepast',
        },
        { status: 500 }
      );
    }

    if (!result) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'Gebruiker niet gevonden',
        },
        { status: 404 }
      );
    }

    // Get updated user data
    const { data: updatedUser } = await supabase
      .from('users')
      .select('total_points, registration_points, prediction_points, quiz_points, game_points')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      message: `${points > 0 ? 'Toegevoegd' : 'Afgetrokken'}: ${Math.abs(points)} punten ${points > 0 ? 'aan' : 'van'} ${targetUser.name}`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        previousTotal: targetUser.total_points,
        newTotal: updatedUser?.total_points || newTotal,
        adjustment: points,
        breakdown: updatedUser ? {
          registration: updatedUser.registration_points,
          prediction: updatedUser.prediction_points,
          quiz: updatedUser.quiz_points,
          game: updatedUser.game_points,
        } : undefined,
      },
    });
  } catch (error) {
    console.error('Adjust user points error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
