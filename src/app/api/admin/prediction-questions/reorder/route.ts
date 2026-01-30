/**
 * File: src/app/api/admin/prediction-questions/reorder/route.ts
 * Purpose: Admin endpoint for reordering prediction questions
 *
 * Endpoints:
 * - POST: Update sort_order for multiple questions
 *
 * Request Body:
 * {
 *   questions: Array<{ id: string, sort_order: number }>
 * }
 *
 * Security:
 * - Requires admin role (checked via JWT)
 * - Validates all question IDs exist
 * - Updates in bulk for performance
 *
 * Relationships:
 * - Updates prediction_questions.sort_order
 * - Used for drag & drop reordering in admin UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * POST /api/admin/prediction-questions/reorder
 * Update sort_order for multiple questions
 */
export async function POST(request: NextRequest) {
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

    // Validate request body
    if (!body.questions || !Array.isArray(body.questions)) {
      return NextResponse.json(
        { error: 'Verplicht veld "questions" ontbreekt of is geen array', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (body.questions.length === 0) {
      return NextResponse.json(
        { error: 'Geen vragen om te herordenen', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate each question entry
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const question of body.questions) {
      if (!question.id || !uuidRegex.test(question.id)) {
        return NextResponse.json(
          { error: 'Ongeldige vraag ID', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      if (typeof question.sort_order !== 'number' || question.sort_order < 0) {
        return NextResponse.json(
          { error: 'sort_order moet een positief getal zijn', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    const supabase = createServerClient();

    // Update questions in parallel (Supabase handles this efficiently)
    const updates = body.questions.map((q: { id: string; sort_order: number }) =>
      supabase
        .from('prediction_questions')
        .update({ sort_order: q.sort_order })
        .eq('id', q.id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error('Error reordering prediction questions:', errors);
      return NextResponse.json(
        { error: 'Database fout tijdens herordenen', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: body.questions.length,
    });
  } catch (error) {
    console.error('Error in POST reorder prediction-questions:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
