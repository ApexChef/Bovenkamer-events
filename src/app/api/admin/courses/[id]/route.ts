/**
 * File: src/app/api/admin/courses/[id]/route.ts
 * Purpose: Admin endpoint for managing individual courses
 *
 * Endpoints:
 * - PATCH: Update course
 * - DELETE: Delete course (CASCADE deletes menu items)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformCourse } from '@/lib/menu-transforms';

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

    if (body.gramsPerPerson !== undefined) {
      if (body.gramsPerPerson <= 0) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Gram per persoon moet positief zijn' },
          { status: 400 }
        );
      }
      updateData.grams_per_person = body.gramsPerPerson;
    }

    if (body.sortOrder !== undefined) {
      if (body.sortOrder < 0) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Sorteervolgorde moet positief zijn' },
          { status: 400 }
        );
      }
      updateData.sort_order = body.sortOrder;
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
      .from('event_courses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating course:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon gang niet updaten' },
        { status: 500 }
      );
    }

    return NextResponse.json({ course: transformCourse(data) });
  } catch (error) {
    console.error('Update course error:', error);
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
      .from('event_courses')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting course:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon gang niet verwijderen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Gang verwijderd',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
