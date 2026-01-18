/**
 * File: src/app/api/admin/predictions/route.ts
 * Purpose: Admin endpoint for fetching all user predictions
 *
 * Security:
 * - Requires admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || !isAdmin(adminUser)) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Admin toegang vereist',
        },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // Fetch all registrations with predictions
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select(`
        id,
        user_id,
        predictions,
        users (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching predictions:', error);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon voorspellingen niet ophalen',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      predictions: registrations || [],
    });
  } catch (error) {
    console.error('Admin predictions error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
