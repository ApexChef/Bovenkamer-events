/**
 * GET /api/admin/forms/[key]
 * Get complete form structure (definition + version + all sections + all fields).
 * Unlike the public endpoint, this includes is_active=false items.
 *
 * PUT /api/admin/forms/[key]
 * Update form definition metadata (name, description).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { key } = params;
    const supabase = createServerClient();

    // 1. Get form definition
    const { data: definition, error: defError } = await supabase
      .from('form_definition')
      .select('*')
      .eq('key', key)
      .single();

    if (defError || !definition) {
      return NextResponse.json(
        { error: 'Formulier niet gevonden', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!definition.active_version_id) {
      return NextResponse.json({
        definition,
        version: null,
        sections: [],
      });
    }

    // 2. Get the active version
    const { data: version, error: verError } = await supabase
      .from('form_version')
      .select('*')
      .eq('id', definition.active_version_id)
      .single();

    if (verError || !version) {
      return NextResponse.json(
        { error: 'Versie niet gevonden', code: 'VERSION_NOT_FOUND' },
        { status: 500 }
      );
    }

    // 3. Get ALL sections (including inactive)
    const { data: sections, error: secError } = await supabase
      .from('form_section')
      .select('*')
      .eq('form_version_id', version.id)
      .order('sort_order', { ascending: true });

    if (secError) {
      console.error('Error fetching form sections:', secError);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 4. Get ALL fields (including inactive)
    const sectionIds = (sections || []).map((s) => s.id);

    let fields: Array<Record<string, unknown>> = [];
    if (sectionIds.length > 0) {
      const { data: fieldData, error: fieldError } = await supabase
        .from('form_field')
        .select('*')
        .in('form_section_id', sectionIds)
        .order('sort_order', { ascending: true });

      if (fieldError) {
        console.error('Error fetching form fields:', fieldError);
        return NextResponse.json(
          { error: 'Database fout', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      fields = fieldData || [];
    }

    // 5. Group fields by section
    const fieldsBySection = new Map<string, typeof fields>();
    for (const field of fields) {
      const sectionId = field.form_section_id as string;
      const existing = fieldsBySection.get(sectionId) || [];
      existing.push(field);
      fieldsBySection.set(sectionId, existing);
    }

    const sectionsWithFields = (sections || []).map((section) => ({
      ...section,
      fields: fieldsBySection.get(section.id) || [],
    }));

    return NextResponse.json({
      definition,
      version,
      sections: sectionsWithFields,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/forms/[key]:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Naam is verplicht' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('form_definition')
      .update({
        name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      console.error('Error updating form definition:', error);
      return NextResponse.json(
        { error: 'Kan formulier niet bijwerken', code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ definition: data });
  } catch (error) {
    console.error('Error in PUT /api/admin/forms/[key]:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
