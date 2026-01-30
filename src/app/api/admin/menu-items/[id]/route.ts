/**
 * File: src/app/api/admin/menu-items/[id]/route.ts
 * Purpose: Admin endpoint for managing individual menu items
 *
 * Endpoints:
 * - PATCH: Update menu item
 * - DELETE: Delete menu item
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformMenuItem } from '@/lib/menu-transforms';

const VALID_PROTEIN_CATEGORIES = ['pork', 'beef', 'chicken', 'game', 'fish', 'vegetarian'];

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
          { error: 'VALIDATION_ERROR', message: 'Naam is verplicht' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.category !== undefined) {
      updateData.category = body.category ?? null;
    }

    if (body.yieldPercentage !== undefined) {
      if (body.yieldPercentage <= 0 || body.yieldPercentage > 100) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Opbrengst percentage moet tussen 0 en 100 zijn' },
          { status: 400 }
        );
      }
      updateData.yield_percentage = body.yieldPercentage;
    }

    if (body.wasteDescription !== undefined) {
      updateData.waste_description = body.wasteDescription ?? null;
    }

    if (body.unitWeightGrams !== undefined) {
      updateData.unit_weight_grams = body.unitWeightGrams ?? null;
    }

    if (body.unitLabel !== undefined) {
      updateData.unit_label = body.unitLabel ?? null;
    }

    if (body.roundingGrams !== undefined) {
      updateData.rounding_grams = body.roundingGrams ?? null;
    }

    if (body.distributionPercentage !== undefined) {
      updateData.distribution_percentage = body.distributionPercentage ?? null;
    }

    if (body.gramsPerPerson !== undefined) {
      updateData.grams_per_person = body.gramsPerPerson ?? null;
    }

    if (body.sortOrder !== undefined) {
      if (body.sortOrder < 0) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Sorteervolgorde moet positief zijn' },
          { status: 400 }
        );
      }
      updateData.sort_order = body.sortOrder;
    }

    if (body.purchasedQuantity !== undefined) {
      updateData.purchased_quantity = body.purchasedQuantity ?? null;
    }

    if (body.isActive !== undefined) {
      updateData.is_active = body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Geen velden om te updaten' },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating menu item:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon menu-item niet updaten' },
        { status: 500 }
      );
    }

    return NextResponse.json({ menuItem: transformMenuItem(data) });
  } catch (error) {
    console.error('Update menu item error:', error);
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

    // Fetch item before delete so we can redistribute siblings
    const { data: itemToDelete } = await supabase
      .from('menu_items')
      .select('id, course_id, item_type, category')
      .eq('id', params.id)
      .single();

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting menu item:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon menu-item niet verwijderen' },
        { status: 500 }
      );
    }

    // Auto-redistribute: recalculate distribution for remaining protein items in same course+category
    if (itemToDelete && itemToDelete.item_type === 'protein' && itemToDelete.category) {
      const { data: remainingItems } = await supabase
        .from('menu_items')
        .select('id')
        .eq('course_id', itemToDelete.course_id)
        .eq('item_type', 'protein')
        .eq('category', itemToDelete.category)
        .eq('is_active', true);

      if (remainingItems && remainingItems.length > 0) {
        const newPct = parseFloat((100 / remainingItems.length).toFixed(2));
        const remainingIds = remainingItems.map((item: any) => item.id);
        await supabase
          .from('menu_items')
          .update({ distribution_percentage: newPct })
          .in('id', remainingIds);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Menu-item verwijderd',
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
