/**
 * File: src/app/api/admin/events/[id]/route.ts
 * Purpose: Admin endpoint for managing individual menu events
 *
 * Endpoints:
 * - GET: Get event details with courses and menu items
 * - PATCH: Update event
 * - DELETE: Delete event (CASCADE deletes courses/items)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformEvent, transformCourse, transformMenuItem } from '@/lib/menu-transforms';

const VALID_EVENT_TYPES = ['bbq', 'diner', 'lunch', 'borrel', 'receptie', 'overig'];

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

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Event niet gevonden' },
        { status: 404 }
      );
    }

    const { data: courses, error: coursesError } = await supabase
      .from('event_courses')
      .select('*')
      .eq('event_id', params.id)
      .order('sort_order', { ascending: true });

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon gangen niet ophalen' },
        { status: 500 }
      );
    }

    const coursesWithItems = await Promise.all(
      (courses || []).map(async (course: any) => {
        const { data: items, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('course_id', course.id)
          .order('sort_order', { ascending: true });

        if (itemsError) {
          console.error('Error fetching menu items:', itemsError);
          return { ...transformCourse(course), menuItems: [] };
        }

        return {
          ...transformCourse(course),
          menuItems: (items || []).map(transformMenuItem),
        };
      })
    );

    return NextResponse.json({
      event: {
        ...transformEvent(event),
        courses: coursesWithItems,
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const updateData: any = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Naam is verplicht' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.eventType !== undefined) {
      if (!VALID_EVENT_TYPES.includes(body.eventType)) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Ongeldig event type' },
          { status: 400 }
        );
      }
      updateData.event_type = body.eventType;
    }

    if (body.eventDate !== undefined) {
      updateData.event_date = body.eventDate ?? null;
    }

    if (body.totalPersons !== undefined) {
      if (body.totalPersons !== null && body.totalPersons < 0) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Aantal personen moet positief zijn' },
          { status: 400 }
        );
      }
      updateData.total_persons = body.totalPersons;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes ?? null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Geen velden om te updaten' },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating event:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon event niet updaten' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: transformEvent(data) });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon event niet verwijderen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event verwijderd',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
