import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformMenuCardCourse } from '@/lib/menu-transforms';

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
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Titel is verplicht' },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.subtitle !== undefined) {
      updateData.subtitle = body.subtitle?.trim() || null;
    }

    if (body.items !== undefined) {
      if (!body.items.trim()) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Items zijn verplicht' },
          { status: 400 }
        );
      }
      updateData.items = body.items.trim();
    }

    if (body.itemCategories !== undefined) {
      updateData.item_categories = body.itemCategories?.trim() || null;
    }

    if (body.wineRed !== undefined) {
      updateData.wine_red = body.wineRed?.trim() || null;
    }

    if (body.wineWhite !== undefined) {
      updateData.wine_white = body.wineWhite?.trim() || null;
    }

    if (body.sortOrder !== undefined) {
      updateData.sort_order = body.sortOrder;
    }

    if (body.isVisible !== undefined) {
      updateData.is_visible = body.isVisible;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Geen velden om te updaten' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('menu_card_courses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating menu card course:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon gang niet updaten' },
        { status: 500 }
      );
    }

    return NextResponse.json({ course: transformMenuCardCourse(data) });
  } catch (error) {
    console.error('Update menu card course error:', error);
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
      .from('menu_card_courses')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting menu card course:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon gang niet verwijderen' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Gang verwijderd' });
  } catch (error) {
    console.error('Delete menu card course error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
