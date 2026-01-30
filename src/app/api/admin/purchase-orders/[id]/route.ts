/**
 * File: src/app/api/admin/purchase-orders/[id]/route.ts
 * Purpose: Admin endpoints for individual purchase order operations
 *
 * Endpoints:
 * - GET: Get purchase order with lines
 * - PATCH: Update purchase order
 * - DELETE: Delete purchase order (cascades to lines)
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformPurchaseOrder, transformPurchaseOrderLine } from '@/lib/menu-transforms';
import type { PurchaseOrderLineWithMenuItem } from '@/types';

export async function GET(
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

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inkooporder niet gevonden' },
        { status: 404 }
      );
    }

    // Fetch lines with menu item info
    const { data: lines, error: linesError } = await supabase
      .from('purchase_order_lines')
      .select(`
        *,
        menu_items (
          name,
          course_id,
          event_courses (
            name
          )
        )
      `)
      .eq('purchase_order_id', params.id)
      .order('created_at', { ascending: true });

    if (linesError) {
      console.error('Error fetching PO lines:', linesError);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon orderregels niet ophalen' },
        { status: 500 }
      );
    }

    const transformedLines: PurchaseOrderLineWithMenuItem[] = (lines || []).map((line: any) => ({
      ...transformPurchaseOrderLine(line),
      menuItemName: line.menu_items?.name ?? null,
      menuItemCourse: line.menu_items?.event_courses?.name ?? null,
    }));

    return NextResponse.json({
      purchaseOrder: {
        ...transformPurchaseOrder(order),
        lines: transformedLines,
      },
    });
  } catch (error) {
    console.error('Get purchase order error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

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

    if (body.supplier !== undefined) {
      if (!body.supplier.trim()) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Leverancier is vereist' },
          { status: 400 }
        );
      }
      updateData.supplier = body.supplier.trim();
    }

    if (body.orderDate !== undefined) updateData.order_date = body.orderDate || null;
    if (body.expectedDeliveryDate !== undefined) updateData.expected_delivery_date = body.expectedDeliveryDate || null;
    if (body.invoiceReference !== undefined) updateData.invoice_reference = body.invoiceReference || null;
    if (body.invoiceDate !== undefined) updateData.invoice_date = body.invoiceDate || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;

    if (body.status !== undefined) {
      const validStatuses = ['draft', 'ordered', 'received', 'invoiced'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Ongeldige status' },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Geen velden om te updaten' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating purchase order:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon inkooporder niet updaten' },
        { status: 500 }
      );
    }

    return NextResponse.json({ purchaseOrder: transformPurchaseOrder(data) });
  } catch (error) {
    console.error('Update purchase order error:', error);
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
      .from('purchase_orders')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting purchase order:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon inkooporder niet verwijderen' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Inkooporder verwijderd' });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
