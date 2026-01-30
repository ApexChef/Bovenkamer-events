/**
 * GET /api/forms/[key]/response?email=...
 *
 * Get a user's existing response for a form.
 * Returns the form_response with answers mapped by field key.
 *
 * Query params:
 * - email: User's email address
 *
 * Response: UserFormResponse | { response: null }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail parameter is verplicht', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 1. Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 2. Get form definition with active version
    const { data: definition, error: defError } = await supabase
      .from('form_definition')
      .select('id, active_version_id')
      .eq('key', key)
      .single();

    if (defError || !definition || !definition.active_version_id) {
      return NextResponse.json(
        { error: 'Formulier niet gevonden', code: 'FORM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Find existing response
    const { data: response } = await supabase
      .from('form_response')
      .select('*')
      .eq('user_id', user.id)
      .eq('form_version_id', definition.active_version_id)
      .single();

    if (!response) {
      return NextResponse.json({ response: null, answers: {} });
    }

    // 4. Get field responses with their field keys
    const { data: fieldResponses, error: frError } = await supabase
      .from('form_field_response')
      .select(`
        *,
        form_field:form_field_id (
          key,
          field_type
        )
      `)
      .eq('form_response_id', response.id);

    if (frError) {
      console.error('Error fetching field responses:', frError);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 5. Map field responses to key -> value
    const answers: Record<string, unknown> = {};

    for (const fr of fieldResponses || []) {
      const field = fr.form_field as { key: string; field_type: string } | null;
      if (!field) continue;

      switch (field.field_type) {
        case 'text_short':
        case 'text_long':
        case 'select_options':
          answers[field.key] = fr.text;
          break;
        case 'slider':
        case 'star_rating':
        case 'time':
          answers[field.key] = fr.number;
          break;
        case 'boolean':
          answers[field.key] = fr.boolean;
          break;
        case 'select_participant':
          answers[field.key] = fr.participant_id;
          break;
        case 'checkbox_group':
        case 'radio_group':
          answers[field.key] = fr.json;
          break;
        default:
          answers[field.key] = fr.text ?? fr.number ?? fr.boolean ?? fr.json;
      }
    }

    return NextResponse.json({ response, answers });
  } catch (error) {
    console.error('Error in GET /api/forms/[key]/response:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
