/**
 * PUT /api/admin/forms/[key]/fields/[fieldId]
 * Update a field (label, description, placeholder, field_type, options, is_required, sort_order, is_active).
 *
 * DELETE /api/admin/forms/[key]/fields/[fieldId]
 * Soft-delete field (set is_active=false).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string; fieldId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { fieldId } = params;
    const body = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.label !== undefined) updates.label = body.label;
    if (body.description !== undefined) updates.description = body.description;
    if (body.placeholder !== undefined) updates.placeholder = body.placeholder;
    if (body.field_type !== undefined) updates.field_type = body.field_type;
    if (body.options !== undefined) updates.options = body.options;
    if (body.is_required !== undefined) updates.is_required = body.is_required;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('form_field')
      .update(updates)
      .eq('id', fieldId)
      .select()
      .single();

    if (error) {
      console.error('Error updating field:', error);
      return NextResponse.json(
        { error: 'Kan veld niet bijwerken', code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ field: data });
  } catch (error) {
    console.error('Error in PUT /api/admin/forms/[key]/fields/[fieldId]:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string; fieldId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { fieldId } = params;
    const supabase = createServerClient();

    // Soft-delete: set is_active=false
    const { data, error } = await supabase
      .from('form_field')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fieldId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting field:', error);
      return NextResponse.json(
        { error: 'Kan veld niet deactiveren', code: 'DELETE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ field: data });
  } catch (error) {
    console.error('Error in DELETE /api/admin/forms/[key]/fields/[fieldId]:', error);
    return NextResponse.json(
      { error: 'Server fout', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
