/**
 * File: src/app/api/prediction-questions/route.ts
 * Purpose: Public endpoint for fetching active prediction questions
 *
 * Endpoints:
 * - GET: Get all active prediction questions for users
 *
 * Security:
 * - Public endpoint (no authentication required)
 * - Only returns active questions (is_active = true)
 * - Excludes admin-only fields (points configuration)
 *
 * Response Format:
 * {
 *   questions: Array<{
 *     id: string,
 *     key: string,
 *     label: string,
 *     type: string,
 *     category: string,
 *     options: object
 *   }>
 * }
 *
 * Relationships:
 * - Reads from prediction_questions table
 * - Used by user-facing /predictions page
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/prediction-questions
 * Fetch all active prediction questions for users
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Fetch only active questions, exclude admin-only fields
    const { data: questions, error } = await supabase
      .from('prediction_questions')
      .select('id, key, label, type, category, options')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching active prediction questions:', error);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions: questions || [] });
  } catch (error) {
    console.error('Error in GET prediction-questions:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
