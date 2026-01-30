/**
 * File: src/app/api/admin/shopping-list/[eventId]/route.ts
 * Purpose: Admin endpoint for calculating shopping list for an event
 *
 * Endpoints:
 * - GET: Calculate shopping list based on event menu and food preferences
 *
 * Security:
 * - Requires admin role (checked via JWT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { transformEvent, transformCourse, transformMenuItem } from '@/lib/menu-transforms';
import {
  getAverageMeatDistribution,
  calculateShoppingList,
  calculateMeatDistributionBreakdown,
} from '@/lib/menu-calculations';
import { PersonPreference, MeatDistribution } from '@/types';

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

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Event niet gevonden' },
        { status: 404 }
      );
    }

    if (!event.total_persons || event.total_persons <= 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Event moet een geldig aantal personen hebben',
        },
        { status: 400 }
      );
    }

    const { data: courses, error: coursesError } = await supabase
      .from('event_courses')
      .select('*')
      .eq('event_id', params.eventId)
      .order('sort_order', { ascending: true });

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Kon gangen niet ophalen' },
        { status: 500 }
      );
    }

    const coursesWithItems = await Promise.all(
      (courses || []).map(async (course: any) => {
        const { data: items, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('course_id', course.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (itemsError) {
          console.error('Error fetching menu items:', itemsError);
          return { ...transformCourse(course), menuItems: [] };
        }

        return {
          ...transformCourse(course),
          menuItems: (items || []).map(transformMenuItem),
        };
      })
    );

    const { data: userPrefs } = await supabase
      .from('food_drink_preferences')
      .select('*')
      .eq('person_type', 'self');

    const { data: partnerPrefs } = await supabase
      .from('food_drink_preferences')
      .select('*')
      .eq('person_type', 'partner');

    const persons: PersonPreference[] = [];

    (userPrefs || []).forEach((pref: any) => {
      persons.push({
        name: pref.user_id,
        personType: 'self',
        userId: pref.user_id,
        dietaryRequirements: pref.dietary_requirements,
        meatDistribution: pref.meat_distribution as MeatDistribution,
        veggiesPreference: pref.veggies_preference,
        saucesPreference: pref.sauces_preference,
        startsWithBubbles: pref.starts_with_bubbles,
        bubbleType: pref.bubble_type,
        drinkDistribution: pref.drink_distribution,
        softDrinkPreference: pref.soft_drink_preference,
        softDrinkOther: pref.soft_drink_other,
        waterPreference: pref.water_preference,
        winePreference: pref.wine_preference,
        beerType: pref.beer_type,
      });
    });

    (partnerPrefs || []).forEach((pref: any) => {
      persons.push({
        name: pref.user_id,
        personType: 'partner',
        userId: pref.user_id,
        dietaryRequirements: pref.dietary_requirements,
        meatDistribution: pref.meat_distribution as MeatDistribution,
        veggiesPreference: pref.veggies_preference,
        saucesPreference: pref.sauces_preference,
        startsWithBubbles: pref.starts_with_bubbles,
        bubbleType: pref.bubble_type,
        drinkDistribution: pref.drink_distribution,
        softDrinkPreference: pref.soft_drink_preference,
        softDrinkOther: pref.soft_drink_other,
        waterPreference: pref.water_preference,
        winePreference: pref.wine_preference,
        beerType: pref.beer_type,
      });
    });

    const avgMeatDistribution = getAverageMeatDistribution(persons);

    const shoppingList = calculateShoppingList(
      coursesWithItems,
      event.total_persons,
      avgMeatDistribution
    );

    // Calculate meat distribution breakdown for protein courses
    const meatDistributionBreakdown = coursesWithItems
      .map((course) =>
        calculateMeatDistributionBreakdown(course, event.total_persons, avgMeatDistribution)
      )
      .filter((b): b is NonNullable<typeof b> => b !== null);

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        totalPersons: event.total_persons,
      },
      averageMeatDistribution: avgMeatDistribution,
      meatDistributionBreakdown,
      courses: shoppingList.courses,
      grandTotal: shoppingList.grandTotal,
    });
  } catch (error) {
    console.error('Calculate shopping list error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
