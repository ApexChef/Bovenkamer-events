/**
 * PUT /api/admin/forms/[key]/sections/[sectionId]
 * Update section (label, description, icon, sort_order, is_active).
 *
 * DELETE /api/admin/forms/[key]/sections/[sectionId]
 * Soft-delete section (set is_active=false).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string; sectionId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { sectionId } = params;
    const body = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.label !== undefined) updates.label = body.label;
    if (body.description !== undefined) updates.description = body.description;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('form_section')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating section:', error);
      return NextResponse.json(
        { error: 'Kan sectie niet bijwerken', code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ section: data });
  } catch (error) {
    console.error('Error in PUT /api/admin/forms/[key]/sections/[sectionId]:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string; sectionId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { sectionId } = params;
    const supabase = createServerClient();

    // Soft-delete: set is_active=false
    const { data, error } = await supabase
      .from('form_section')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting section:', error);
      return NextResponse.json(
        { error: 'Kan sectie niet deactiveren', code: 'DELETE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ section: data });
  } catch (error) {
    console.error('Error in DELETE /api/admin/forms/[key]/sections/[sectionId]:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
