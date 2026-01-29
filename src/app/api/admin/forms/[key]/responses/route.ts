/**
 * GET /api/admin/forms/[key]/responses
 *
 * Admin endpoint: returns all submitted responses for a form,
 * queried from the v_form_responses view.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('v_form_responses')
      .select('*')
      .eq('form_key', key)
      .order('user_name', { ascending: true })
      .order('section_sort', { ascending: true })
      .order('field_sort', { ascending: true });

    if (error) {
      console.error('Error fetching form responses:', error);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Group by user for summary stats
    const byUser = new Map<string, { name: string; email: string; status: string; submitted_at: string; fields: typeof data }>();
    for (const row of data || []) {
      const existing = byUser.get(row.user_id);
      if (existing) {
        existing.fields.push(row);
      } else {
        byUser.set(row.user_id, {
          name: row.user_name,
          email: row.user_email,
          status: row.status,
          submitted_at: row.submitted_at,
          fields: [row],
        });
      }
    }

    const responses = Array.from(byUser.values());

    return NextResponse.json({
      form_key: key,
      total_responses: responses.length,
      responses,
      raw: data || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/forms/[key]/responses:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
