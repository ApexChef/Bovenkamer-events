/**
 * File: src/app/api/admin/procurement/[eventId]/route.ts
 * Purpose: Aggregated procurement data per menu item for an event
 *
 * Endpoints:
 * - GET: Returns received/ordered quantities aggregated from all PO lines
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import type { MenuItemProcurement } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
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

    // Fetch all PO lines with menu_item_id for this event
    const { data: lines, error } = await supabase
      .from('purchase_order_lines')
      .select(`
        menu_item_id,
        ordered_quantity,
        received_quantity,
        purchase_orders!inner (
          event_id,
          supplier
        )
      `)
      .eq('purchase_orders.event_id', params.eventId)
      .not('menu_item_id', 'is', null);

    if (error) {
      console.error('Error fetching procurement data:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon inkoopdata niet ophalen' },
        { status: 500 }
      );
    }

    // Aggregate per menu_item_id
    const map = new Map<string, MenuItemProcurement>();

    for (const line of lines || []) {
      const itemId = line.menu_item_id;
      const existing = map.get(itemId);
      const supplier = (line.purchase_orders as any)?.supplier || 'Onbekend';

      if (existing) {
        existing.totalReceivedQuantity += line.received_quantity ? parseFloat(line.received_quantity) : 0;
        existing.totalOrderedQuantity += line.ordered_quantity ? parseFloat(line.ordered_quantity) : 0;
        existing.lineCount += 1;
        if (!existing.suppliers.includes(supplier)) {
          existing.suppliers.push(supplier);
        }
      } else {
        map.set(itemId, {
          menuItemId: itemId,
          totalReceivedQuantity: line.received_quantity ? parseFloat(line.received_quantity) : 0,
          totalOrderedQuantity: line.ordered_quantity ? parseFloat(line.ordered_quantity) : 0,
          lineCount: 1,
          suppliers: [supplier],
        });
      }
    }

    return NextResponse.json({
      procurement: Array.from(map.values()),
    });
  } catch (error) {
    console.error('Procurement summary error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
