/**
 * File: src/app/api/admin/events/[id]/courses/route.ts
 * Purpose: Admin endpoint for managing event courses
 *
 * Endpoints:
 * - GET: List courses for an event
 * - POST: Create new course for an event
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformCourse } from '@/lib/menu-transforms';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    const { data: courses, error } = await supabase
      .from('event_courses')
      .select('*')
      .eq('event_id', params.id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon gangen niet ophalen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      courses: (courses || []).map(transformCourse),
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Naam is verplicht' },
        { status: 400 }
      );
    }

    if (!body.gramsPerPerson || body.gramsPerPerson <= 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Gram per persoon moet positief zijn' },
        { status: 400 }
      );
    }

    if (body.sortOrder !== undefined && body.sortOrder < 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Sorteervolgorde moet positief zijn' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: eventExists } = await supabase
      .from('events')
      .select('id')
      .eq('id', params.id)
      .single();

    if (!eventExists) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Event niet gevonden' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('event_courses')
      .insert({
        event_id: params.id,
        name: body.name.trim(),
        sort_order: body.sortOrder ?? 0,
        grams_per_person: body.gramsPerPerson,
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: `Kon gang niet aanmaken: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ course: transformCourse(data) }, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
