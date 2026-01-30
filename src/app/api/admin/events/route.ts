/**
 * File: src/app/api/admin/events/route.ts
 * Purpose: Admin endpoint for managing menu events
 *
 * Endpoints:
 * - GET: List all events with course count
 * - POST: Create new event
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformEvent } from '@/lib/menu-transforms';

const VALID_EVENT_TYPES = ['bbq', 'diner', 'lunch', 'borrel', 'receptie', 'overig'];
const VALID_STATUSES = ['draft', 'active', 'completed', 'cancelled'];

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon events niet ophalen' },
        { status: 500 }
      );
    }

    const eventsWithCourseCount = await Promise.all(
      (events || []).map(async (event: any) => {
        const { count } = await supabase
          .from('event_courses')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id);

        return {
          ...transformEvent(event),
          courseCount: count || 0,
        };
      })
    );

    return NextResponse.json({ events: eventsWithCourseCount });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!VALID_EVENT_TYPES.includes(body.eventType)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Ongeldig event type' },
        { status: 400 }
      );
    }

    if (body.totalPersons !== null && body.totalPersons !== undefined && body.totalPersons < 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Aantal personen moet positief zijn' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('events')
      .insert({
        name: body.name.trim(),
        event_type: body.eventType,
        event_date: body.eventDate ?? null,
        total_persons: body.totalPersons ?? null,
        status: body.status ?? 'draft',
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon event niet aanmaken' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: transformEvent(data) }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
