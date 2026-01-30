/**
 * POST /api/admin/forms/[key]/fields
 *
 * Create a new field in a specific section.
 * Requires section_id in the request body.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      section_id,
      field_key,
      label,
      description,
      placeholder,
      field_type,
      options,
      is_required,
    } = body;

    if (!section_id || !field_key || !label || !field_type) {
      return NextResponse.json(
        { error: 'section_id, key, label en field_type zijn verplicht' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get max sort_order for this section
    const { data: existingFields } = await supabase
      .from('form_field')
      .select('sort_order')
      .eq('form_section_id', section_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = existingFields && existingFields.length > 0
      ? existingFields[0].sort_order + 1
      : 0;

    // Create field
    const { data: field, error: createError } = await supabase
      .from('form_field')
      .insert({
        form_section_id: section_id,
        key: field_key,
        label,
        description: description || null,
        placeholder: placeholder || null,
        field_type,
        options: options || { type: field_type },
        is_required: is_required ?? false,
        sort_order: nextOrder,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating field:', createError);
      return NextResponse.json(
        { error: 'Kan veld niet aanmaken', code: 'CREATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/forms/[key]/fields:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
