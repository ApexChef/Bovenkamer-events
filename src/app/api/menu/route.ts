import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { transformEvent, transformCourse, transformMenuItem } from '@/lib/menu-transforms';

/**
 * GET /api/menu
 * Public endpoint: returns active event with courses, menu items,
 * and optionally the logged-in user's wine preference.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Find the active event (most recent by event_date, fallback to created_at)
    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (eventError) {
      console.error('Error fetching active event:', eventError);
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }

    if (!eventRow) {
      return NextResponse.json({ event: null, courses: [], winePreference: null });
    }

    const event = transformEvent(eventRow);

    // Fetch courses sorted by sort_order
    const { data: courseRows, error: coursesError } = await supabase
      .from('event_courses')
      .select('*')
      .eq('event_id', event.id)
      .order('sort_order');

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    // Fetch active menu items for all courses
    const courseIds = (courseRows || []).map((c: { id: string }) => c.id);
    let menuItemRows: any[] = [];

    if (courseIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .in('course_id', courseIds)
        .eq('is_active', true)
        .order('sort_order');

      if (itemsError) {
        console.error('Error fetching menu items:', itemsError);
        return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
      }

      menuItemRows = items || [];
    }

    // Group menu items by course
    const itemsByCourse = new Map<string, any[]>();
    for (const item of menuItemRows) {
      const list = itemsByCourse.get(item.course_id) || [];
      list.push(transformMenuItem(item));
      itemsByCourse.set(item.course_id, list);
    }

    const courses = (courseRows || []).map((row: any) => ({
      ...transformCourse(row),
      menuItems: itemsByCourse.get(row.id) || [],
    }));

    // Optionally fetch wine preference for logged-in user
    let winePreference: number | null = null;

    const user = await getUserFromRequest(request);
    if (user) {
      const { data: prefRow } = await supabase
        .from('food_drink_preferences')
        .select('wine_preference')
        .eq('user_id', user.userId)
        .eq('person_type', 'self')
        .maybeSingle();

      if (prefRow && prefRow.wine_preference !== null) {
        winePreference = prefRow.wine_preference;
      }
    }

    return NextResponse.json({ event, courses, winePreference });
  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
