/**
 * File: src/app/api/admin/purchase-orders/[id]/lines/route.ts
 * Purpose: Admin endpoints for purchase order lines
 *
 * Endpoints:
 * - GET: List lines for a purchase order
 * - POST: Add line to a purchase order
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformPurchaseOrderLine } from '@/lib/menu-transforms';
import type { PurchaseOrderLineWithMenuItem } from '@/types';

const VALID_CATEGORIES = ['food', 'drink', 'condiment', 'herb', 'non_food', 'other'];

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

    const { data: lines, error } = await supabase
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

    if (error) {
      console.error('Error fetching PO lines:', error);
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

    return NextResponse.json({ lines: transformedLines });
  } catch (error) {
    console.error('Get PO lines error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Naam is vereist' },
        { status: 400 }
      );
    }

    if (body.lineCategory && !VALID_CATEGORIES.includes(body.lineCategory)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Ongeldige categorie' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify PO exists
    const { data: poExists } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('id', params.id)
      .single();

    if (!poExists) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inkooporder niet gevonden' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('purchase_order_lines')
      .insert({
        purchase_order_id: params.id,
        menu_item_id: body.menuItemId || null,
        name: body.name.trim(),
        description: body.description || null,
        line_category: body.lineCategory || 'food',
        ordered_quantity: body.orderedQuantity ?? null,
        received_quantity: body.receivedQuantity ?? null,
        unit_label: body.unitLabel || null,
        unit_price: body.unitPrice ?? null,
        total_price: body.totalPrice ?? null,
        supplier_article_nr: body.supplierArticleNr || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating PO line:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon orderregel niet aanmaken' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { line: transformPurchaseOrderLine(data) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create PO line error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
