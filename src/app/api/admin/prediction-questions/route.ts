/**
 * File: src/app/api/admin/prediction-questions/route.ts
 * Purpose: Admin endpoints for managing prediction questions (list and create)
 *
 * Endpoints:
 * - GET: List all prediction questions with statistics
 * - POST: Create a new prediction question
 *
 * Query Parameters (GET):
 * - category: Filter by category (consumption, social, other)
 * - active: Filter by active status (true, false, all)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 * - Input validation using Zod schemas
 * - Prevents duplicate keys
 *
 * Relationships:
 * - Uses prediction_questions table
 * - Counts answers from registrations.predictions JSONB column
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

/**
 * GET /api/admin/prediction-questions
 * List all questions with statistics and answer counts
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin toegang vereist', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeFilter = searchParams.get('active') || 'all';

    const supabase = createServerClient();

    // Build query
    let query = supabase
      .from('prediction_questions')
      .select('*')
      .order('sort_order', { ascending: true });

    // Apply category filter
    if (category && ['consumption', 'social', 'other'].includes(category)) {
      query = query.eq('category', category);
    }

    // Apply active status filter
    if (activeFilter !== 'all') {
      query = query.eq('is_active', activeFilter === 'true');
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching prediction questions:', error);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const allQuestions = questions || [];
    const stats = {
      total: allQuestions.length,
      active: allQuestions.filter((q) => q.is_active).length,
      inactive: allQuestions.filter((q) => !q.is_active).length,
      byCategory: {
        consumption: allQuestions.filter((q) => q.category === 'consumption').length,
        social: allQuestions.filter((q) => q.category === 'social').length,
        other: allQuestions.filter((q) => q.category === 'other').length,
      },
      answerCounts: await getAnswerCounts(supabase, allQuestions),
    };

    return NextResponse.json({ questions: allQuestions, stats });
  } catch (error) {
    console.error('Error in GET prediction-questions:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prediction-questions
 * Create a new prediction question
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

    // Validate required fields
    if (!body.key || !body.label || !body.type || !body.category || !body.options) {
      return NextResponse.json(
        { error: 'Verplichte velden ontbreken', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate key format (lowercase, alphanumeric + underscore)
    if (!/^[a-z][a-z0-9_]*$/.test(body.key)) {
      return NextResponse.json(
        {
          error: 'Key moet beginnen met kleine letter en alleen kleine letters, cijfers en underscores bevatten',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['slider', 'select_participant', 'boolean', 'time', 'select_options'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Ongeldig type', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['consumption', 'social', 'other'];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: 'Ongeldige categorie', code: 'INVALID_CATEGORY' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check for duplicate key
    const { data: existing } = await supabase
      .from('prediction_questions')
      .select('id')
      .eq('key', body.key)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Key bestaat al', code: 'DUPLICATE_KEY' },
        { status: 409 }
      );
    }

    // Get max sort_order for the category to append new question at the end
    const { data: maxSortOrder } = await supabase
      .from('prediction_questions')
      .select('sort_order')
      .eq('category', body.category)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const sort_order = maxSortOrder ? maxSortOrder.sort_order + 10 : 0;

    // Prepare question data with defaults
    const questionData = {
      key: body.key,
      label: body.label,
      type: body.type,
      category: body.category,
      options: body.options,
      points_exact: body.points_exact ?? 50,
      points_close: body.points_close ?? 25,
      points_direction: body.points_direction ?? 10,
      sort_order,
      is_active: true,
    };

    // Insert question
    const { data: question, error } = await supabase
      .from('prediction_questions')
      .insert(questionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating prediction question:', error);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Error in POST prediction-questions:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get answer counts for all questions
 * Counts how many users have answered each question by checking registrations.predictions JSONB
 */
async function getAnswerCounts(
  supabase: any,
  questions: any[]
): Promise<Record<string, number>> {
  try {
    // Fetch all registrations with predictions
    const { data: registrations } = await supabase
      .from('registrations')
      .select('predictions');

    const counts: Record<string, number> = {};

    // Initialize counts for all questions
    questions.forEach((q) => {
      counts[q.id] = 0;
    });

    // Count answers per question key
    const keyCounts: Record<string, number> = {};
    registrations?.forEach((reg: any) => {
      if (reg.predictions && typeof reg.predictions === 'object') {
        Object.keys(reg.predictions).forEach((key) => {
          const value = reg.predictions[key];
          // Only count if value is not null/undefined/empty
          if (value !== null && value !== undefined && value !== '') {
            keyCounts[key] = (keyCounts[key] || 0) + 1;
          }
        });
      }
    });

    // Map key counts to question IDs
    questions.forEach((q) => {
      counts[q.id] = keyCounts[q.key] || 0;
    });

    return counts;
  } catch (error) {
    console.error('Error getting answer counts:', error);
    return {};
  }
}
