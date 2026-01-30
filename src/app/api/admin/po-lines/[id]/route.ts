/**
 * File: src/app/api/admin/po-lines/[id]/route.ts
 * Purpose: Admin endpoints for individual purchase order line operations
 *
 * Endpoints:
 * - PATCH: Update a PO line
 * - DELETE: Delete a PO line
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformPurchaseOrderLine } from '@/lib/menu-transforms';

const VALID_CATEGORIES = ['food', 'drink', 'condiment', 'herb', 'non_food', 'other'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Naam is vereist' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.menuItemId !== undefined) updateData.menu_item_id = body.menuItemId || null;
    if (body.description !== undefined) updateData.description = body.description || null;

    if (body.lineCategory !== undefined) {
      if (!VALID_CATEGORIES.includes(body.lineCategory)) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Ongeldige categorie' },
          { status: 400 }
        );
      }
      updateData.line_category = body.lineCategory;
    }

    if (body.orderedQuantity !== undefined) updateData.ordered_quantity = body.orderedQuantity ?? null;
    if (body.receivedQuantity !== undefined) updateData.received_quantity = body.receivedQuantity ?? null;
    if (body.unitLabel !== undefined) updateData.unit_label = body.unitLabel || null;
    if (body.unitPrice !== undefined) updateData.unit_price = body.unitPrice ?? null;
    if (body.totalPrice !== undefined) updateData.total_price = body.totalPrice ?? null;
    if (body.supplierArticleNr !== undefined) updateData.supplier_article_nr = body.supplierArticleNr || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Geen velden om te updaten' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('purchase_order_lines')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating PO line:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon orderregel niet updaten' },
        { status: 500 }
      );
    }

    return NextResponse.json({ line: transformPurchaseOrderLine(data) });
  } catch (error) {
    console.error('Update PO line error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('purchase_order_lines')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting PO line:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon orderregel niet verwijderen' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Orderregel verwijderd' });
  } catch (error) {
    console.error('Delete PO line error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
