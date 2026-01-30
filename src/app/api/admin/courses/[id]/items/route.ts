/**
 * File: src/app/api/admin/courses/[id]/items/route.ts
 * Purpose: Admin endpoint for managing menu items in a course
 *
 * Endpoints:
 * - GET: List menu items for a course
 * - POST: Create new menu item for a course
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformMenuItem } from '@/lib/menu-transforms';

const VALID_ITEM_TYPES = ['protein', 'side', 'fixed'];
const VALID_PROTEIN_CATEGORIES = ['pork', 'beef', 'chicken', 'game', 'fish', 'vegetarian'];

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

    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('course_id', params.id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching menu items:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon menu-items niet ophalen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      menuItems: (menuItems || []).map(transformMenuItem),
    });
  } catch (error) {
    console.error('Get menu items error:', error);
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
        { error: 'VALIDATION_ERROR', message: 'Naam is verplicht' },
        { status: 400 }
      );
    }

    if (!VALID_ITEM_TYPES.includes(body.itemType)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Ongeldig item type' },
        { status: 400 }
      );
    }

    if (body.yieldPercentage !== undefined) {
      if (body.yieldPercentage <= 0 || body.yieldPercentage > 100) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Opbrengst percentage moet tussen 0 en 100 zijn' },
          { status: 400 }
        );
      }
    }

    if (body.itemType === 'protein') {
      if (!body.category || !VALID_PROTEIN_CATEGORIES.includes(body.category)) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Categorie is verplicht voor protein items',
          },
          { status: 400 }
        );
      }
      if (body.distributionPercentage === undefined || body.distributionPercentage === null) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Distributie percentage is verplicht voor protein items',
          },
          { status: 400 }
        );
      }
    }

    if (body.itemType === 'fixed') {
      if (!body.gramsPerPerson || body.gramsPerPerson <= 0) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Gram per persoon is verplicht voor fixed items',
          },
          { status: 400 }
        );
      }
    }

    const supabase = createServerClient();

    const { data: courseExists } = await supabase
      .from('event_courses')
      .select('id')
      .eq('id', params.id)
      .single();

    if (!courseExists) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Gang niet gevonden' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        course_id: params.id,
        name: body.name.trim(),
        item_type: body.itemType,
        category: body.category ?? null,
        yield_percentage: body.yieldPercentage ?? 100,
        waste_description: body.wasteDescription ?? null,
        unit_weight_grams: body.unitWeightGrams ?? null,
        unit_label: body.unitLabel ?? null,
        rounding_grams: body.roundingGrams ?? 100,
        distribution_percentage: body.distributionPercentage ?? null,
        grams_per_person: body.gramsPerPerson ?? null,
        purchased_quantity: body.purchasedQuantity ?? null,
        sort_order: body.sortOrder ?? 0,
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating menu item:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon menu-item niet aanmaken' },
        { status: 500 }
      );
    }

    // Auto-redistribute: if protein item, recalculate distribution for all protein items in same course+category
    if (body.itemType === 'protein' && body.category) {
      const { data: siblingItems } = await supabase
        .from('menu_items')
        .select('id')
        .eq('course_id', params.id)
        .eq('item_type', 'protein')
        .eq('category', body.category)
        .eq('is_active', true);

      if (siblingItems && siblingItems.length > 0) {
        const newPct = parseFloat((100 / siblingItems.length).toFixed(2));
        const siblingIds = siblingItems.map((item: any) => item.id);
        await supabase
          .from('menu_items')
          .update({ distribution_percentage: newPct })
          .in('id', siblingIds);
      }
    }

    // Re-fetch the item after potential redistribution update
    const { data: updatedItem } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', data.id)
      .single();

    return NextResponse.json({ menuItem: transformMenuItem(updatedItem || data) }, { status: 201 });
  } catch (error) {
    console.error('Create menu item error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
