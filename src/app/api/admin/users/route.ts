/**
 * File: src/app/api/admin/users/route.ts
 * Purpose: Admin endpoint for listing and searching users with pagination
 *
 * Endpoints:
 * - GET: List all users with search and pagination support
 *
 * Query Parameters:
 * - search: Filter by name or email (case-insensitive)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import type { UserSummary, UserStats } from '@/types';

/**
 * GET /api/admin/users
 * List users with search, filtering, and pagination
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
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const supabase = createServerClient();

    // Build base query for users
    let query = supabase
      .from('users')
      .select(
        `
        id,
        name,
        email,
        role,
        registration_status,
        email_verified,
        is_active,
        total_points,
        last_login_at,
        created_at
      `,
        { count: 'exact' }
      );

    // Apply search filter (name or email)
    if (search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      query = query.or(
        `name.ilike.${searchTerm},email.ilike.${searchTerm}`
      );
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon gebruikers niet ophalen',
        },
        { status: 500 }
      );
    }

    // Get statistics using the database function
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_user_stats');

    if (statsError) {
      console.error('Error fetching user stats:', statsError);
      // Continue without stats rather than failing
    }

    const stats: UserStats = statsData?.[0] || {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      pendingUsers: 0,
      approvedUsers: 0,
      adminUsers: 0,
    };

    // Format response
    const userSummaries: UserSummary[] = (users || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      registrationStatus: u.registration_status,
      emailVerified: u.email_verified,
      isActive: u.is_active,
      totalPoints: u.total_points,
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
    }));

    return NextResponse.json({
      users: userSummaries,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
