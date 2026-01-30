/**
 * POST /api/admin/forms/[key]/sections
 *
 * Create a new section in the active version of the form.
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

    const { key } = params;
    const body = await request.json();
    const { section_key, label, description, icon, type } = body;

    if (!section_key || !label) {
      return NextResponse.json(
        { error: 'Key en label zijn verplicht' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get form definition and active version
    const { data: definition, error: defError } = await supabase
      .from('form_definition')
      .select('active_version_id')
      .eq('key', key)
      .single();

    if (defError || !definition?.active_version_id) {
      return NextResponse.json(
        { error: 'Formulier of actieve versie niet gevonden' },
        { status: 404 }
      );
    }

    // Get max sort_order
    const { data: existingSections } = await supabase
      .from('form_section')
      .select('sort_order')
      .eq('form_version_id', definition.active_version_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = existingSections && existingSections.length > 0
      ? existingSections[0].sort_order + 1
      : 0;

    // Create section
    const { data: section, error: createError } = await supabase
      .from('form_section')
      .insert({
        form_version_id: definition.active_version_id,
        key: section_key,
        label,
        description: description || null,
        icon: icon || null,
        type: type || 'section',
        sort_order: nextOrder,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating section:', createError);
      return NextResponse.json(
        { error: 'Kan sectie niet aanmaken', code: 'CREATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/forms/[key]/sections:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
