/**
 * File: src/app/api/admin/users/[id]/registration/route.ts
 * Purpose: Admin endpoint for viewing full registration data
 *
 * Endpoints:
 * - GET: Get complete registration data including JSONB fields
 *
 * Use Case:
 * - Admin impersonation view
 * - Viewing user's full registration details
 * - Debugging registration issues
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * GET /api/admin/users/[id]/registration
 * Get full registration data for a user
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

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email, registration_status')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'Gebruiker niet gevonden',
        },
        { status: 404 }
      );
    }

    // Get full registration data including JSONB fields
    const { data: registrationData, error: registrationError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (registrationError) {
      // No registration found is not an error - user might not have completed registration
      if (registrationError.code === 'PGRST116') {
        return NextResponse.json({
          user: {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            registrationStatus: targetUser.registration_status,
          },
          registration: null,
          message: 'Gebruiker heeft geen registratie voltooid',
        });
      }

      console.error('Error fetching registration:', registrationError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon registratie niet ophalen',
        },
        { status: 500 }
      );
    }

    // Format response with all data including JSONB fields
    const fullRegistration = {
      id: registrationData.id,
      userId: registrationData.user_id,

      // Personal details
      name: registrationData.name,
      email: registrationData.email,
      birthYear: registrationData.birth_year,
      hasPartner: registrationData.has_partner,
      partnerName: registrationData.partner_name,
      dietaryRequirements: registrationData.dietary_requirements,

      // Skills and preferences
      primarySkill: registrationData.primary_skill,
      additionalSkills: registrationData.additional_skills,
      musicDecade: registrationData.music_decade,
      musicGenre: registrationData.music_genre,

      // JSONB fields
      quizAnswers: registrationData.quiz_answers || {},
      aiAssignment: registrationData.ai_assignment || null,
      predictions: registrationData.predictions || {},

      // Status
      isComplete: registrationData.is_complete,
      currentStep: registrationData.current_step,
      status: registrationData.status,

      // Metadata
      createdAt: registrationData.created_at,
      updatedAt: registrationData.updated_at,
      cancelledAt: registrationData.cancelled_at,
      cancellationReason: registrationData.cancellation_reason,
    };

    return NextResponse.json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        registrationStatus: targetUser.registration_status,
      },
      registration: fullRegistration,
    });
  } catch (error) {
    console.error('Get registration data error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
