import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Predictions } from '@/types';

interface PredictionsRequest {
  email: string;
  predictions: Predictions;
}

export async function POST(request: NextRequest) {
  try {
    const { email, predictions }: PredictionsRequest = await request.json();
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

    // Update registration with predictions
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        predictions,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error saving predictions:', updateError);
      return NextResponse.json({ error: 'Kon voorspellingen niet opslaan' }, { status: 500 });
    }

    // Add points for making predictions
    const { data: existingPoints } = await supabase
      .from('points_ledger')
      .select('id')
      .eq('user_id', user.id)
      .eq('source', 'prediction')
      .single();

    if (!existingPoints) {
      await supabase.from('points_ledger').insert({
        user_id: user.id,
        source: 'prediction',
        points: 5,
        description: 'Voorspellingen ingediend',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Voorspellingen opgeslagen'
    });
  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het opslaan' },
      { status: 500 }
    );
  }
}
