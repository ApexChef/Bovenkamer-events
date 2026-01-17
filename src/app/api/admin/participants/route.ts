/**
 * File: src/app/api/admin/participants/route.ts
 * Purpose: Admin endpoint for managing expected participants list
 *
 * Endpoints:
 * - GET: List all expected participants with pagination and filtering
 * - POST: Add new expected participant
 *
 * Security:
 * - Requires admin role (checked via JWT)
 * - Input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * GET /api/admin/participants
 * List expected participants with pagination
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const filter = searchParams.get('filter'); // 'registered', 'unregistered', or null for all

    const supabase = createServerClient();

    // Build query
    let query = supabase
      .from('expected_participants')
      .select(
        `
        id,
        name,
        email_hint,
        is_registered,
        registered_by_user_id,
        created_at,
        notes,
        users!expected_participants_registered_by_user_id_fkey (
          name
        )
      `,
        { count: 'exact' }
      );

    // Apply filter
    if (filter === 'registered') {
      query = query.eq('is_registered', true);
    } else if (filter === 'unregistered') {
      query = query.eq('is_registered', false);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching participants:', error);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon deelnemers niet ophalen',
        },
        { status: 500 }
      );
    }

    // Format response
    const participants = data.map((p: any) => ({
      id: p.id,
      name: p.name,
      emailHint: p.email_hint,
      isRegistered: p.is_registered,
      registeredByUserId: p.registered_by_user_id,
      registeredByName: p.users?.name || null,
      createdAt: p.created_at,
      notes: p.notes,
    }));

    return NextResponse.json({
      participants,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get participants error:', error);
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
 * POST /api/admin/participants
 * Add new expected participant
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, emailHint, notes } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Naam is verplicht',
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('expected_participants')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE_NAME',
          message: 'Deze naam bestaat al in de lijst',
        },
        { status: 409 }
      );
    }

    // Insert new participant
    const { data: newParticipant, error: insertError } = await supabase
      .from('expected_participants')
      .insert({
        name: name.trim(),
        email_hint: emailHint?.trim() || null,
        notes: notes?.trim() || null,
        created_by_admin_id: user.userId,
        is_registered: false,
      })
      .select('id, name, email_hint, is_registered, created_at')
      .single();

    if (insertError || !newParticipant) {
      console.error('Error creating participant:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Kon deelnemer niet toevoegen',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        participant: {
          id: newParticipant.id,
          name: newParticipant.name,
          emailHint: newParticipant.email_hint,
          isRegistered: newParticipant.is_registered,
          createdAt: newParticipant.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create participant error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
