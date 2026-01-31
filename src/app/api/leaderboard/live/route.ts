/**
 * File: src/app/api/leaderboard/live/route.ts
 * Purpose: Live leaderboard endpoint with real-time scores
 *
 * Returns:
 * - Sorted leaderboard with all point sources
 * - Breakdown of prediction scores per category
 * - Stats about results entered
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  fetchPredictionFields,
  fetchUserPredictions,
  calculatePredictionScore,
  isScorable,
} from '@/lib/predictions/scoring';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Fetch users with registration status approved and point columns
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, registration_status, registration_points, quiz_points, game_points, bonus_points')
      .eq('registration_status', 'approved');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Fetch field definitions from the form system
    const fields = await fetchPredictionFields(supabase);

    // Fetch user predictions from the form system
    const userPredictions = await fetchUserPredictions(supabase);

    // Build predictions lookup by userId
    const predictionsByUser = new Map(
      userPredictions.map((u) => [u.userId, u.answers]),
    );

    // Fetch actual results
    const { data: resultsData } = await supabase
      .from('prediction_results')
      .select('results, updated_at')
      .limit(1)
      .single();

    const actualResults: Record<string, unknown> = resultsData?.results || {};
    const resultsEntered = Object.keys(actualResults).filter(
      (k) => actualResults[k] !== undefined && actualResults[k] !== null,
    ).length;

    // Count scorable fields
    const totalFields = fields.filter((f) => isScorable(f.fieldType)).length;

    // Build leaderboard
    const leaderboard = users?.map(user => {
      const predictions = predictionsByUser.get(user.id) || {};

      // Calculate live prediction points
      let predictionPoints = 0;
      let breakdown: Record<string, number> = {};

      if (Object.keys(predictions).length > 0 && Object.keys(actualResults).length > 0) {
        const result = calculatePredictionScore(fields, predictions, actualResults);
        predictionPoints = result.total;
        breakdown = result.breakdown;
      }

      // Get other points from users table (kept in sync by DB trigger)
      const registrationPoints = user.registration_points || 0;
      const quizPoints = user.quiz_points || 0;
      const gamePoints = user.game_points || 0;
      const bonusPoints = user.bonus_points || 0;

      // Note: we use live calculated prediction points, not stored ones
      const totalPoints = registrationPoints + predictionPoints + quizPoints + gamePoints + bonusPoints;

      return {
        userId: user.id,
        name: user.name,
        totalPoints,
        predictionPoints,
        registrationPoints,
        quizPoints,
        gamePoints,
        breakdown,
      };
    }) || [];

    // Sort by total points descending
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json({
      leaderboard,
      stats: {
        resultsEntered,
        totalFields,
        lastUpdate: resultsData?.updated_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Live leaderboard error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
