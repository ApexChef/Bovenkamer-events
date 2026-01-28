/**
 * File: src/app/api/admin/prediction-questions/[id]/route.ts
 * Purpose: Admin endpoints for managing individual prediction questions
 *
 * Endpoints:
 * - PATCH: Update an existing prediction question
 * - DELETE: Soft delete a prediction question (set is_active = false)
 *
 * Parameters:
 * - id: Question UUID
 *
 * Security:
 * - Requires admin role (checked via JWT)
 * - Validates input data
 * - Soft delete preserves data for historical analysis
 *
 * Relationships:
 * - Updates prediction_questions table
 * - Does not delete answers (registrations.predictions JSONB)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * PATCH /api/admin/prediction-questions/[id]
 * Update an existing prediction question
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin toegang vereist', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: 'Ongeldige vraag ID', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (body.type) {
      const validTypes = ['slider', 'select_participant', 'boolean', 'time', 'select_options'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: 'Ongeldig type', code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
    }

    // Validate category if provided
    if (body.category) {
      const validCategories = ['consumption', 'social', 'other'];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: 'Ongeldige categorie', code: 'INVALID_CATEGORY' },
          { status: 400 }
        );
      }
    }

    // Validate label length if provided
    if (body.label && (body.label.length < 3 || body.label.length > 200)) {
      return NextResponse.json(
        { error: 'Label moet tussen 3 en 200 tekens zijn', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate points if provided
    const pointFields = ['points_exact', 'points_close', 'points_direction'];
    for (const field of pointFields) {
      if (body[field] !== undefined) {
        const value = parseInt(body[field]);
        if (isNaN(value) || value < 0 || value > 200) {
          return NextResponse.json(
            { error: `${field} moet tussen 0 en 200 zijn`, code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        body[field] = value;
      }
    }

    const supabase = createServerClient();

    // Build update object with only provided fields
    const updateData: any = {};
    const allowedFields = [
      'label',
      'type',
      'category',
      'options',
      'points_exact',
      'points_close',
      'points_direction',
      'is_active',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Geen velden om bij te werken', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Update question
    const { data: question, error } = await supabase
      .from('prediction_questions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prediction question:', error);

      // Check if question not found
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vraag niet gevonden', code: 'QUESTION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error in PATCH prediction-questions:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/prediction-questions/[id]
 * Soft delete a prediction question (set is_active = false)
 * Note: This is a soft delete to preserve historical data and user answers
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin toegang vereist', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: 'Ongeldige vraag ID', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Soft delete: set is_active = false
    const { data: question, error } = await supabase
      .from('prediction_questions')
      .update({ is_active: false })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting prediction question:', error);

      // Check if question not found
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vraag niet gevonden', code: 'QUESTION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Error in DELETE prediction-questions:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
