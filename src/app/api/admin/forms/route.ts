/**
 * GET /api/admin/forms
 *
 * List all form definitions with their active version,
 * section count, field count, and submission count.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServerClient();

    // Get all form definitions
    const { data: definitions, error: defError } = await supabase
      .from('form_definition')
      .select('*')
      .order('key');

    if (defError) {
      console.error('Error fetching form definitions:', defError);
      return NextResponse.json(
        { error: 'Database fout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // For each definition, count sections, fields, and submissions
    const forms = await Promise.all(
      (definitions || []).map(async (def) => {
        let sectionCount = 0;
        let fieldCount = 0;
        let responseCount = 0;

        if (def.active_version_id) {
          // Count sections
          const { count: secCount } = await supabase
            .from('form_section')
            .select('*', { count: 'exact', head: true })
            .eq('form_version_id', def.active_version_id)
            .eq('is_active', true);

          sectionCount = secCount || 0;

          // Count fields via sections
          const { data: sectionIds } = await supabase
            .from('form_section')
            .select('id')
            .eq('form_version_id', def.active_version_id);

          if (sectionIds && sectionIds.length > 0) {
            const { count: fldCount } = await supabase
              .from('form_field')
              .select('*', { count: 'exact', head: true })
              .in('form_section_id', sectionIds.map((s) => s.id))
              .eq('is_active', true);

            fieldCount = fldCount || 0;
          }

          // Count responses
          const { count: respCount } = await supabase
            .from('form_response')
            .select('*', { count: 'exact', head: true })
            .eq('form_version_id', def.active_version_id)
            .eq('status', 'submitted');

          responseCount = respCount || 0;
        }

        return {
          ...def,
          section_count: sectionCount,
          field_count: fieldCount,
          response_count: responseCount,
        };
      })
    );

    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Error in GET /api/admin/forms:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
