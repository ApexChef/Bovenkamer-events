/**
 * GET /api/forms/[key]
 *
 * Load the complete form structure for a given form definition key.
 * Returns the active published version with all sections and fields.
 *
 * Response: FormStructure (definition + version + sections with fields)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { FormStructure, FormSectionWithFields } from '@/types';

// Disable Next.js caching — form structure can change via admin
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    const supabase = createServerClient();

    // 1. Get form definition with active version
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
      return NextResponse.json(
        { error: 'Geen actieve versie beschikbaar', code: 'NO_ACTIVE_VERSION' },
        { status: 404 }
      );
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

    // 3. Get sections with their fields in a single query
    const { data: sections, error: secError } = await supabase
      .from('form_section')
      .select('*')
      .eq('form_version_id', version.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (secError) {
      console.error('Error fetching form sections:', secError);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 4. Get all active fields for these sections
    const sectionIds = (sections || []).map((s) => s.id);

    const { data: fields, error: fieldError } = await supabase
      .from('form_field')
      .select('*')
      .in('form_section_id', sectionIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (fieldError) {
      console.error('Error fetching form fields:', fieldError);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 5. Group fields by section
    const fieldsBySection = new Map<string, typeof fields>();
    for (const field of fields || []) {
      const existing = fieldsBySection.get(field.form_section_id) || [];
      existing.push(field);
      fieldsBySection.set(field.form_section_id, existing);
    }

    const sectionsWithFields: FormSectionWithFields[] = (sections || []).map((section) => ({
      ...section,
      fields: fieldsBySection.get(section.id) || [],
    }));

    const result: FormStructure = {
      definition,
      version,
      sections: sectionsWithFields,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/forms/[key]:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
