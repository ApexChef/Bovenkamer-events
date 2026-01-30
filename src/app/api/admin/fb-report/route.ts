/**
 * File: src/app/api/admin/fb-report/route.ts
 * Purpose: Admin endpoint for F&B (Food & Beverage) report data
 *
 * Relationships:
 * - Called by: /admin/fb-rapport page component
 * - Queries: food_drink_preferences, users, registrations tables
 *
 * Key Dependencies:
 * - @/lib/supabase: Database client
 * - @/lib/auth/jwt: Admin authentication
 * - @/types: TypeScript interfaces
 *
 * Security:
 * - Admin-only access (verified via JWT)
 * - No data aggregation (raw data returned for client-side processing)
 * - HTTPS required in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { PersonPreference, FBReportData } from '@/types';

/**
 * GET /api/admin/fb-report
 * Returns all food & drink preferences for F&B report generation
 *
 * Authentication: Admin role required
 *
 * Response Format:
 * {
 *   timestamp: string (ISO 8601),
 *   completionStatus: {
 *     completed: number,
 *     totalParticipants: number,
 *     totalPersons: number
 *   },
 *   persons: PersonPreference[]
 * }
 *
 * Error Responses:
 * - 403: Unauthorized (not admin)
 * - 500: Database error or server error
 */
export async function GET(request: NextRequest) {
  try {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Admin toegang vereist',
        },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // =========================================================================
    // QUERY 1: User Preferences (self)
    // =========================================================================

    const { data: userPrefs, error: userError } = await supabase
      .from('food_drink_preferences')
      .select(
        `
        *,
        users!inner (
          id,
          first_name,
          last_name,
          name,
          email
        )
      `
      )
      .eq('person_type', 'self');

    if (userError) {
      console.error('Error fetching user preferences:', userError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon voorkeuren niet ophalen',
        },
        { status: 500 }
      );
    }

    // =========================================================================
    // QUERY 2: Partner Preferences
    // =========================================================================

    const { data: partnerPrefs, error: partnerError } = await supabase
      .from('food_drink_preferences')
      .select('*')
      .eq('person_type', 'partner');

    if (partnerError) {
      console.error('Error fetching partner preferences:', partnerError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon partner voorkeuren niet ophalen',
        },
        { status: 500 }
      );
    }

    // =========================================================================
    // QUERY 3: Registrations (for partner names)
    // =========================================================================

    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('user_id, has_partner, partner_first_name, partner_last_name')
      .eq('has_partner', true);

    if (regError) {
      console.error('Error fetching registrations:', regError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon registraties niet ophalen',
        },
        { status: 500 }
      );
    }

    // =========================================================================
    // QUERY 4: Total Participants (for completion status)
    // =========================================================================

    const { count: totalParticipants, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'participant')
      .eq('is_active', true);

    if (countError) {
      console.error('Error counting participants:', countError);
      // Continue anyway, just log the error
    }

    // =========================================================================
    // QUERY 5: Missing Participants (no preferences yet)
    // =========================================================================

    const completedUserIds = (userPrefs || []).map((p: any) => p.user_id);

    const { data: allParticipants, error: participantsError } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'participant')
      .eq('is_active', true);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
    }

    const missingParticipants = (allParticipants || [])
      .filter((p: any) => !completedUserIds.includes(p.id))
      .map((p: any) => p.name || 'Onbekend');

    // =========================================================================
    // DATA TRANSFORMATION
    // =========================================================================

    // Normalize user preferences
    const normalizedUserPrefs: PersonPreference[] = (userPrefs || []).map(
      (pref: any) => ({
        name: pref.users?.name || 'Onbekend',
        personType: 'self' as const,
        userId: pref.user_id,
        dietaryRequirements: pref.dietary_requirements || null,
        meatDistribution: pref.meat_distribution,
        veggiesPreference: pref.veggies_preference,
        saucesPreference: pref.sauces_preference,
        startsWithBubbles: pref.starts_with_bubbles,
        bubbleType: pref.bubble_type,
        drinkDistribution: pref.drink_distribution,
        softDrinkPreference: pref.soft_drink_preference,
        softDrinkOther: pref.soft_drink_other || '',
        waterPreference: pref.water_preference,
        winePreference: pref.wine_preference,
        beerType: pref.beer_type,
      })
    );

    // Normalize partner preferences with names from registrations
    const normalizedPartnerPrefs: PersonPreference[] = (
      partnerPrefs || []
    ).map((pref: any) => {
      const reg = (registrations || []).find(
        (r: any) => r.user_id === pref.user_id
      );

      const partnerName = reg
        ? `${reg.partner_first_name || ''} ${reg.partner_last_name || ''}`.trim()
        : 'Partner';

      return {
        name: partnerName || 'Partner',
        personType: 'partner' as const,
        userId: pref.user_id,
        dietaryRequirements: pref.dietary_requirements || null,
        meatDistribution: pref.meat_distribution,
        veggiesPreference: pref.veggies_preference,
        saucesPreference: pref.sauces_preference,
        startsWithBubbles: pref.starts_with_bubbles,
        bubbleType: pref.bubble_type,
        drinkDistribution: pref.drink_distribution,
        softDrinkPreference: pref.soft_drink_preference,
        softDrinkOther: pref.soft_drink_other || '',
        waterPreference: pref.water_preference,
        winePreference: pref.wine_preference,
        beerType: pref.beer_type,
      };
    });

    // Combine all persons and sort by name
    const persons = [...normalizedUserPrefs, ...normalizedPartnerPrefs].sort(
      (a, b) => a.name.localeCompare(b.name, 'nl')
    );

    // =========================================================================
    // RESPONSE
    // =========================================================================

    const response: FBReportData = {
      timestamp: new Date().toISOString(),
      completionStatus: {
        completed: normalizedUserPrefs.length,
        totalParticipants: totalParticipants || 0,
        totalPersons: persons.length,
        missingParticipants,
      },
      persons,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('FB Report API error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis bij het ophalen van het rapport',
      },
      { status: 500 }
    );
  }
}
