import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformMenuCardCourse } from '@/lib/menu-transforms';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'eventId is verplicht' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('menu_card_courses')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order');

    if (error) {
      console.error('Error fetching menu card courses:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon menukaart niet ophalen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      courses: (data || []).map(transformMenuCardCourse),
    });
  } catch (error) {
    console.error('Get menu card courses error:', error);
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
        { error: 'VALIDATION_ERROR', message: 'eventId is verplicht' },
        { status: 400 }
      );
    }

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Titel is verplicht' },
        { status: 400 }
      );
    }

    if (!body.items?.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Items zijn verplicht' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('menu_card_courses')
      .insert({
        event_id: body.eventId,
        title: body.title.trim(),
        subtitle: body.subtitle?.trim() || null,
        items: body.items.trim(),
        item_categories: body.itemCategories?.trim() || null,
        wine_red: body.wineRed?.trim() || null,
        wine_white: body.wineWhite?.trim() || null,
        sort_order: body.sortOrder ?? 0,
        is_visible: body.isVisible ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating menu card course:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon gang niet aanmaken' },
        { status: 500 }
      );
    }

    return NextResponse.json({ course: transformMenuCardCourse(data) }, { status: 201 });
  } catch (error) {
    console.error('Create menu card course error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
