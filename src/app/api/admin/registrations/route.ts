/**
 * File: src/app/api/admin/registrations/route.ts
 * Purpose: Admin endpoint for viewing and managing registrations
 *
 * Endpoints:
 * - GET: List all registrations with filters and pagination
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * GET /api/admin/registrations
 * List registrations with filtering and pagination
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', or null for all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = createServerClient();

    // Build query for users with registrations
    let query = supabase
      .from('users')
      .select(
        `
        id,
        name,
        email,
        role,
        email_verified,
        registration_status,
        created_at,
        registrations (
          id,
          primary_skill,
          has_partner,
          partner_name,
          status,
          ai_assignment
        )
      `,
        { count: 'exact' }
      );

    // Apply status filter
    if (status) {
      query = query.eq('registration_status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching registrations:', error);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon registraties niet ophalen',
        },
        { status: 500 }
      );
    }

    // Get stats for all statuses
    const { data: statsData } = await supabase
      .from('users')
      .select('registration_status')
      .not('registration_status', 'is', null);

    const stats = {
      pending: statsData?.filter((u) => u.registration_status === 'pending').length || 0,
      approved: statsData?.filter((u) => u.registration_status === 'approved').length || 0,
      rejected: statsData?.filter((u) => u.registration_status === 'rejected').length || 0,
    };

    // Format response
    const registrations = data.map((u: any) => {
      const reg = Array.isArray(u.registrations) ? u.registrations[0] : null;
      return {
        id: u.id,
        userId: u.id,
        name: u.name,
        email: u.email,
        registrationStatus: u.registration_status,
        emailVerified: u.email_verified,
        createdAt: u.created_at,
        wasExpectedParticipant: false, // TODO: Check against expected_participants
        primarySkill: reg?.primary_skill || null,
        hasPartner: reg?.has_partner || false,
        aiAssignment: reg?.ai_assignment || null,
      };
    });

    return NextResponse.json({
      registrations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
