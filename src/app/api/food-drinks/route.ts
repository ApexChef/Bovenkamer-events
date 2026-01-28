import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { FoodDrinkPreference, PersonType, DEFAULT_MEAT_DISTRIBUTION, DEFAULT_DRINK_DISTRIBUTION } from '@/types';

// GET food/drink preferences for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get registration to check if user has partner
    const { data: registration } = await supabase
      .from('registrations')
      .select('has_partner, partner_first_name, partner_last_name')
      .eq('user_id', user.id)
      .single();

    // Get food/drink preferences for both self and partner
    const { data: preferences, error: prefError } = await supabase
      .from('food_drink_preferences')
      .select('*')
      .eq('user_id', user.id);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Map database format to frontend format
    const mapPreference = (pref: Record<string, unknown>): FoodDrinkPreference => ({
      id: pref.id as string,
      userId: pref.user_id as string,
      personType: pref.person_type as PersonType,
      dietaryRequirements: (pref.dietary_requirements as string) || '',
      meatDistribution: (pref.meat_distribution as FoodDrinkPreference['meatDistribution']) || DEFAULT_MEAT_DISTRIBUTION,
      veggiesPreference: (pref.veggies_preference as number) ?? 3,
      saucesPreference: (pref.sauces_preference as number) ?? 3,
      startsWithBubbles: pref.starts_with_bubbles as boolean | null,
      bubbleType: pref.bubble_type as 'champagne' | 'prosecco' | null,
      drinkDistribution: (pref.drink_distribution as FoodDrinkPreference['drinkDistribution']) || DEFAULT_DRINK_DISTRIBUTION,
      softDrinkPreference: pref.soft_drink_preference as string | null,
      softDrinkOther: (pref.soft_drink_other as string) || '',
      waterPreference: pref.water_preference as 'sparkling' | 'flat' | null,
      winePreference: (pref.wine_preference as number) ?? null,
      beerType: (pref.beer_type as 'pils' | 'speciaal') ?? null,
      createdAt: pref.created_at as string,
      updatedAt: pref.updated_at as string,
    });

    const selfPreference = preferences?.find(p => p.person_type === 'self');
    const partnerPreference = preferences?.find(p => p.person_type === 'partner');

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
      },
      hasPartner: registration?.has_partner || false,
      partnerName: registration?.partner_first_name
        ? `${registration.partner_first_name} ${registration.partner_last_name || ''}`.trim()
        : null,
      selfPreference: selfPreference ? mapPreference(selfPreference) : null,
      partnerPreference: partnerPreference ? mapPreference(partnerPreference) : null,
    });
  } catch (error) {
    console.error('Food-drinks GET error:', error);
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 });
  }
}

// Points for completing food/drink preferences (awarded once)
const FOOD_DRINK_POINTS = 40;

// POST/PUT food/drink preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, personType, data } = body;

    if (!email || !personType) {
      return NextResponse.json({ error: 'Email and personType are required' }, { status: 400 });
    }

    if (!['self', 'partner'].includes(personType)) {
      return NextResponse.json({ error: 'Invalid personType' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build database record
    const dbData = {
      user_id: user.id,
      person_type: personType,
      dietary_requirements: data.dietaryRequirements || null,
      meat_distribution: data.meatDistribution || null,
      veggies_preference: data.veggiesPreference ?? 3,
      sauces_preference: data.saucesPreference ?? 3,
      starts_with_bubbles: data.startsWithBubbles ?? null,
      bubble_type: data.bubbleType || null,
      drink_distribution: data.drinkDistribution || null,
      soft_drink_preference: data.softDrinkPreference || null,
      soft_drink_other: data.softDrinkOther || null,
      water_preference: data.waterPreference || null,
      wine_preference: data.winePreference ?? null,
      beer_type: data.beerType || null,
      updated_at: new Date().toISOString(),
    };

    // Upsert (insert or update)
    const { error: upsertError } = await supabase
      .from('food_drink_preferences')
      .upsert(dbData, {
        onConflict: 'user_id,person_type',
      });

    if (upsertError) {
      console.error('Error saving preferences:', upsertError);
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    // Award points for completing food/drink preferences (first time only, for 'self')
    let pointsAwarded = 0;
    if (personType === 'self') {
      const pointsDescription = 'food_drink_preferences';

      // Check if points were already awarded
      const { data: existingPoints } = await supabase
        .from('points_ledger')
        .select('id')
        .eq('user_id', user.id)
        .eq('description', pointsDescription)
        .single();

      if (!existingPoints) {
        // Award points
        const { error: pointsError } = await supabase
          .from('points_ledger')
          .insert({
            user_id: user.id,
            source: 'registration',
            points: FOOD_DRINK_POINTS,
            description: pointsDescription,
          });

        if (pointsError) {
          console.error('Error awarding points:', pointsError);
        } else {
          pointsAwarded = FOOD_DRINK_POINTS;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${personType === 'self' ? 'Jouw' : 'Partner'} voorkeuren opgeslagen`,
      pointsAwarded,
    });
  } catch (error) {
    console.error('Food-drinks POST error:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
