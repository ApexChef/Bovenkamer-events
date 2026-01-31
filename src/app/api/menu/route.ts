import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { transformEvent, transformMenuCardCourse } from '@/lib/menu-transforms';

/**
 * GET /api/menu
 * Public endpoint: returns active event with menu card courses,
 * and optionally the logged-in user's wine preference + name.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Find the active event (most recent)
    const { data: eventRows, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (eventError) {
      console.error('Error fetching active event:', eventError);
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }

    const eventRow = eventRows?.[0] ?? null;

    if (!eventRow) {
      return NextResponse.json({ event: null, courses: [], winePreference: null, userName: null });
    }

    const event = transformEvent(eventRow);

    // Fetch visible menu card courses sorted by sort_order
    const { data: cardRows, error: cardError } = await supabase
      .from('menu_card_courses')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_visible', true)
      .order('sort_order');

    if (cardError) {
      console.error('Error fetching menu card courses:', cardError);
      return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
    }

    const courses = (cardRows || []).map(transformMenuCardCourse);

    // Optionally fetch preferences and name for logged-in user
    let winePreference: number | null = null;
    let userName: string | null = null;
    let meatDistribution: Record<string, number> | null = null;

    const user = await getUserFromRequest(request);
    if (user) {
      // Get user name
      const { data: userRow } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.userId)
        .maybeSingle();

      if (userRow?.name) {
        userName = userRow.name.split(' ')[0]; // First name only
      }

      // Get wine preference and meat distribution
      const { data: prefRow } = await supabase
        .from('food_drink_preferences')
        .select('wine_preference, meat_distribution')
        .eq('user_id', user.userId)
        .eq('person_type', 'self')
        .maybeSingle();

      if (prefRow) {
        if (prefRow.wine_preference !== null) {
          winePreference = prefRow.wine_preference;
        }
        if (prefRow.meat_distribution) {
          meatDistribution = prefRow.meat_distribution;
        }
      }
    }

    return NextResponse.json({ event, courses, winePreference, userName, meatDistribution });
  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
