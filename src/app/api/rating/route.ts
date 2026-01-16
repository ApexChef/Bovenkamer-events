import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface RatingRequest {
  email: string;
  rating: {
    location: number;
    hospitality: number;
    fireQuality: number;
    parking: number;
    overall: number;
    bestAspect: string;
    improvementSuggestion: string;
    isWorthy: boolean | null;
    worthyExplanation: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email, rating }: RatingRequest = await request.json();
    const supabase = createServerClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Check if user already rated
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const ratingData = {
      user_id: user.id,
      location_rating: rating.location,
      hospitality_rating: rating.hospitality,
      fire_quality_rating: rating.fireQuality,
      parking_rating: rating.parking,
      overall_rating: rating.overall,
      best_aspect: rating.bestAspect || null,
      improvement_suggestion: rating.improvementSuggestion || null,
      is_worthy: rating.isWorthy,
      worthy_explanation: rating.worthyExplanation || null,
    };

    if (existingRating) {
      // Update existing rating
      const { error: updateError } = await supabase
        .from('ratings')
        .update(ratingData)
        .eq('id', existingRating.id);

      if (updateError) {
        console.error('Error updating rating:', updateError);
        return NextResponse.json({ error: 'Kon beoordeling niet updaten' }, { status: 500 });
      }
    } else {
      // Create new rating
      const { error: insertError } = await supabase
        .from('ratings')
        .insert(ratingData);

      if (insertError) {
        console.error('Error creating rating:', insertError);
        return NextResponse.json({ error: 'Kon beoordeling niet opslaan' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Beoordeling opgeslagen'
    });
  } catch (error) {
    console.error('Rating API error:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het opslaan' },
      { status: 500 }
    );
  }
}

// Get all ratings (for admin)
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        users (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings:', error);
      return NextResponse.json({ error: 'Kon beoordelingen niet ophalen' }, { status: 500 });
    }

    // Calculate averages
    const ratings = data || [];
    const count = ratings.length;

    if (count === 0) {
      return NextResponse.json({
        ratings: [],
        stats: {
          count: 0,
          averages: {},
          worthyPercentage: 0,
        }
      });
    }

    const averages = {
      location: ratings.reduce((sum, r) => sum + r.location_rating, 0) / count,
      hospitality: ratings.reduce((sum, r) => sum + r.hospitality_rating, 0) / count,
      fireQuality: ratings.reduce((sum, r) => sum + r.fire_quality_rating, 0) / count,
      parking: ratings.reduce((sum, r) => sum + r.parking_rating, 0) / count,
      overall: ratings.reduce((sum, r) => sum + r.overall_rating, 0) / count,
    };

    const worthyCount = ratings.filter((r) => r.is_worthy === true).length;
    const worthyPercentage = (worthyCount / count) * 100;

    return NextResponse.json({
      ratings,
      stats: {
        count,
        averages,
        worthyPercentage,
      }
    });
  } catch (error) {
    console.error('Ratings GET error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
