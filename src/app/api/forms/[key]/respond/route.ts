/**
 * POST /api/forms/[key]/respond
 *
 * Submit or update a form response. Creates a form_response record
 * (or finds existing draft) and upserts form_field_response records.
 *
 * Request body:
 * {
 *   email: string,
 *   answers: Record<string, unknown>,  // field.key -> value
 *   submit?: boolean                    // true = mark as submitted
 * }
 *
 * Response: { success, response_id, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface RespondRequest {
  email: string;
  answers: Record<string, unknown>;
  submit?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    const body: RespondRequest = await request.json();
    const { email, answers, submit = false } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail is verplicht', code: 'MISSING_EMAIL' },
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

    const versionId = definition.active_version_id;

    // 3. Get or create form_response (upsert)
    const { data: existingResponse } = await supabase
      .from('form_response')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('form_version_id', versionId)
      .single();

    let responseId: string;

    if (existingResponse) {
      if (existingResponse.status === 'submitted' && !submit) {
        return NextResponse.json(
          { error: 'Formulier is al ingediend', code: 'ALREADY_SUBMITTED' },
          { status: 409 }
        );
      }
      responseId = existingResponse.id;
    } else {
      const { data: newResponse, error: createError } = await supabase
        .from('form_response')
        .insert({
          user_id: user.id,
          form_version_id: versionId,
          status: 'draft',
        })
        .select('id')
        .single();

      if (createError || !newResponse) {
        console.error('Error creating form response:', createError);
        return NextResponse.json(
          { error: 'Kon formulier niet aanmaken', code: 'CREATE_ERROR' },
          { status: 500 }
        );
      }
      responseId = newResponse.id;
    }

    // 4. Get all fields for this version (to map key -> id and determine answer column)
    const { data: sections } = await supabase
      .from('form_section')
      .select('id')
      .eq('form_version_id', versionId);

    const sectionIds = (sections || []).map((s) => s.id);

    const { data: fields, error: fieldsError } = await supabase
      .from('form_field')
      .select('id, key, field_type')
      .in('form_section_id', sectionIds);

    if (fieldsError || !fields) {
      console.error('Error fetching fields:', fieldsError);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const fieldMap = new Map(fields.map((f) => [f.key, f]));

    // 5. Upsert field responses
    const upsertRows = [];

    for (const [fieldKey, value] of Object.entries(answers)) {
      const field = fieldMap.get(fieldKey);
      if (!field) continue; // Skip unknown fields

      const row: Record<string, unknown> = {
        form_response_id: responseId,
        form_field_id: field.id,
        text: null,
        number: null,
        boolean: null,
        json: null,
        participant_id: null,
      };

      // Store value in the appropriate typed column
      switch (field.field_type) {
        case 'text_short':
        case 'text_long':
        case 'select_options':
          row.text = value != null ? String(value) : null;
          break;
        case 'slider':
        case 'star_rating':
        case 'time':
          row.number = value != null ? Number(value) : null;
          break;
        case 'boolean':
          row.boolean = value != null ? Boolean(value) : null;
          break;
        case 'select_participant':
          row.participant_id = value != null ? String(value) : null;
          break;
        case 'checkbox_group':
        case 'radio_group':
          row.json = value != null ? value : null;
          break;
        default:
          row.text = value != null ? String(value) : null;
      }

      upsertRows.push(row);
    }

    if (upsertRows.length > 0) {
      const { error: upsertError } = await supabase
        .from('form_field_response')
        .upsert(upsertRows, {
          onConflict: 'form_response_id,form_field_id',
        });

      if (upsertError) {
        console.error('Error upserting field responses:', upsertError);
        return NextResponse.json(
          { error: 'Kon antwoorden niet opslaan', code: 'UPSERT_ERROR' },
          { status: 500 }
        );
      }
    }

    // 6. If submitting, update status
    if (submit) {
      const { error: submitError } = await supabase
        .from('form_response')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', responseId);

      if (submitError) {
        console.error('Error submitting form:', submitError);
        return NextResponse.json(
          { error: 'Kon formulier niet indienen', code: 'SUBMIT_ERROR' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      response_id: responseId,
      message: submit ? 'Formulier ingediend' : 'Antwoorden opgeslagen',
    });
  } catch (error) {
    console.error('Error in POST /api/forms/[key]/respond:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
