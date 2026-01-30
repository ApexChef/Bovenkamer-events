/**
 * File: src/app/api/admin/purchase-orders/route.ts
 * Purpose: Admin endpoints for listing and creating purchase orders
 *
 * Endpoints:
 * - GET: List purchase orders (filtered by eventId query param)
 * - POST: Create new purchase order
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformPurchaseOrder } from '@/lib/menu-transforms';
import type { PurchaseOrderSummary } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 }
      );
    }

    const eventId = request.nextUrl.searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'eventId query parameter is vereist' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: orders, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon inkooporders niet ophalen' },
        { status: 500 }
      );
    }

    // Fetch line summaries for each order
    const summaries: PurchaseOrderSummary[] = await Promise.all(
      (orders || []).map(async (order: any) => {
        const { data: lines } = await supabase
          .from('purchase_order_lines')
          .select('id, menu_item_id, total_price')
          .eq('purchase_order_id', order.id);

        const linesList = lines || [];
        const totalPrice = linesList.reduce(
          (sum: number, l: any) => sum + (l.total_price ? parseFloat(l.total_price) : 0),
          0
        );

        return {
          ...transformPurchaseOrder(order),
          lineCount: linesList.length,
          totalPrice: totalPrice > 0 ? totalPrice : null,
          linkedItemCount: linesList.filter((l: any) => l.menu_item_id !== null).length,
          unlinkedItemCount: linesList.filter((l: any) => l.menu_item_id === null).length,
        };
      })
    );

    return NextResponse.json({ purchaseOrders: summaries });
  } catch (error) {
    console.error('List purchase orders error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.eventId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Event ID is vereist' },
        { status: 400 }
      );
    }

    if (!body.supplier?.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Leverancier is vereist' },
        { status: 400 }
      );
    }

    const validStatuses = ['draft', 'ordered', 'received', 'invoiced'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Ongeldige status' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert({
        event_id: body.eventId,
        supplier: body.supplier.trim(),
        order_date: body.orderDate || null,
        expected_delivery_date: body.expectedDeliveryDate || null,
        status: body.status || 'draft',
        invoice_reference: body.invoiceReference || null,
        invoice_date: body.invoiceDate || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating purchase order:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon inkooporder niet aanmaken' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { purchaseOrder: transformPurchaseOrder(data) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create purchase order error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
