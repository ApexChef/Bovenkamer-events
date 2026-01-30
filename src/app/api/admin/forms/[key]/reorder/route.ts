/**
 * PUT /api/admin/forms/[key]/reorder
 *
 * Bulk-update sort_order for sections and/or fields.
 *
 * Body:
 * {
 *   sections?: Array<{ id: string; sort_order: number }>;
 *   fields?: Array<{ id: string; sort_order: number }>;
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

interface ReorderItem {
  id: string;
  sort_order: number;
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

    const body = await request.json();
    const { sections, fields } = body as {
      sections?: ReorderItem[];
      fields?: ReorderItem[];
    };

    if (!sections?.length && !fields?.length) {
      return NextResponse.json(
        { error: 'Geen items om te herordenen' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Update sections
    if (sections?.length) {
      for (const item of sections) {
        const { error } = await supabase
          .from('form_section')
          .update({ sort_order: item.sort_order, updated_at: now })
          .eq('id', item.id);

        if (error) {
          console.error('Error reordering section:', error);
          return NextResponse.json(
            { error: 'Kan secties niet herordenen', code: 'REORDER_ERROR' },
            { status: 500 }
          );
        }
      }
    }

    // Update fields
    if (fields?.length) {
      for (const item of fields) {
        const { error } = await supabase
          .from('form_field')
          .update({ sort_order: item.sort_order, updated_at: now })
          .eq('id', item.id);

        if (error) {
          console.error('Error reordering field:', error);
          return NextResponse.json(
            { error: 'Kan velden niet herordenen', code: 'REORDER_ERROR' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/admin/forms/[key]/reorder:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
