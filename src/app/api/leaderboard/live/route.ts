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
import { Predictions } from '@/types';

interface ActualResults {
  wineBottles?: number;
  beerCrates?: number;
  meatKilos?: number;
  firstSleeper?: string;
  spontaneousSinger?: string;
  firstToLeave?: string;
  lastToLeave?: string;
  loudestLaugher?: string;
  longestStoryTeller?: string;
  somethingBurned?: boolean;
  outsideTemp?: number;
  lastGuestTime?: number;  // Slider value: 0=19:00, 22=06:00
}

const PREDICTION_KEYS = [
  'wineBottles', 'beerCrates', 'meatKilos',
  'firstSleeper', 'spontaneousSinger', 'firstToLeave', 'lastToLeave',
  'loudestLaugher', 'longestStoryTeller',
  'somethingBurned', 'outsideTemp', 'lastGuestTime'
];

// Calculate points for a single prediction (duplicate from calculate endpoint for speed)
function calculateLivePoints(
  prediction: Predictions,
  actual: ActualResults
): { total: number; breakdown: Record<string, number> } {
  let total = 0;
  const breakdown: Record<string, number> = {};

  const scoreNumeric = (predicted: number | undefined, actual: number | undefined, key: string) => {
    if (predicted === undefined || actual === undefined) return;
    const diff = Math.abs(predicted - actual);
    const percentDiff = actual !== 0 ? (diff / actual) * 100 : (diff === 0 ? 0 : 100);

    if (diff === 0) {
      breakdown[key] = 50;
      total += 50;
    } else if (percentDiff <= 10) {
      breakdown[key] = 25;
      total += 25;
    } else if (percentDiff <= 25) {
      breakdown[key] = 10;
      total += 10;
    } else {
      breakdown[key] = 0;
    }
  };

  const scoreExact = (predicted: unknown, actual: unknown, key: string) => {
    if (predicted === undefined || actual === undefined) return;
    if (predicted === actual) {
      breakdown[key] = 50;
      total += 50;
    } else {
      breakdown[key] = 0;
    }
  };

  // lastGuestTime is now a slider value: 0=19:00, each unit = 30 min, max 22=06:00
  const scoreTime = (predicted: number | undefined, actual: number | undefined, key: string) => {
    if (predicted === undefined || actual === undefined) return;
    // Each unit is 30 minutes, so diff of 1 = 30 minutes apart
    const diff = Math.abs(predicted - actual);

    if (diff === 0) {
      breakdown[key] = 50;
      total += 50;
    } else if (diff <= 1) {
      // Within 30 minutes (1 slider unit)
      breakdown[key] = 25;
      total += 25;
    } else if (diff <= 2) {
      // Within 1 hour (2 slider units)
      breakdown[key] = 10;
      total += 10;
    } else {
      breakdown[key] = 0;
    }
  };

  scoreNumeric(prediction.wineBottles, actual.wineBottles, 'wineBottles');
  scoreNumeric(prediction.beerCrates, actual.beerCrates, 'beerCrates');
  scoreNumeric(prediction.meatKilos, actual.meatKilos, 'meatKilos');

  scoreExact(prediction.firstSleeper, actual.firstSleeper, 'firstSleeper');
  scoreExact(prediction.spontaneousSinger, actual.spontaneousSinger, 'spontaneousSinger');
  scoreExact(prediction.firstToLeave, actual.firstToLeave, 'firstToLeave');
  scoreExact(prediction.lastToLeave, actual.lastToLeave, 'lastToLeave');
  scoreExact(prediction.loudestLaugher, actual.loudestLaugher, 'loudestLaugher');
  scoreExact(prediction.longestStoryTeller, actual.longestStoryTeller, 'longestStoryTeller');

  scoreExact(prediction.somethingBurned, actual.somethingBurned, 'somethingBurned');
  scoreNumeric(prediction.outsideTemp, actual.outsideTemp, 'outsideTemp');
  scoreTime(prediction.lastGuestTime, actual.lastGuestTime, 'lastGuestTime');

  return { total, breakdown };
}

export async function GET() {
  try {
    const supabase = createServerClient();

    // Fetch users with registration status approved
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, registration_status')
      .eq('registration_status', 'approved');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Fetch registrations with predictions
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('user_id, predictions');

    if (regError) {
      console.error('Error fetching registrations:', regError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Fetch points ledger
    const { data: pointsLedger, error: pointsError } = await supabase
      .from('points_ledger')
      .select('user_id, source, points');

    if (pointsError) {
      console.error('Error fetching points:', pointsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Fetch actual results
    const { data: resultsData } = await supabase
      .from('prediction_results')
      .select('results, updated_at')
      .limit(1)
      .single();

    const actualResults: ActualResults = resultsData?.results || {};
    const resultsEntered = Object.keys(actualResults).filter(k => actualResults[k as keyof ActualResults] !== undefined).length;

    // Build leaderboard
    const leaderboard = users?.map(user => {
      // Get registration predictions
      const registration = registrations?.find(r => r.user_id === user.id);
      const predictions = registration?.predictions as Predictions || {};

      // Calculate live prediction points
      let predictionPoints = 0;
      let breakdown: Record<string, number> = {};

      if (Object.keys(predictions).length > 0 && Object.keys(actualResults).length > 0) {
        const result = calculateLivePoints(predictions, actualResults);
        predictionPoints = result.total;
        breakdown = result.breakdown;
      }

      // Get other points from ledger
      const userPoints = pointsLedger?.filter(p => p.user_id === user.id) || [];
      const registrationPoints = userPoints.find(p => p.source === 'registration')?.points || 0;
      const quizPoints = userPoints.filter(p => p.source === 'quiz').reduce((sum, p) => sum + p.points, 0);
      const gamePoints = userPoints.filter(p => p.source === 'game').reduce((sum, p) => sum + p.points, 0);

      // Note: we use live calculated prediction points, not stored ones
      const totalPoints = registrationPoints + predictionPoints + quizPoints + gamePoints;

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
        totalFields: PREDICTION_KEYS.length,
        lastUpdate: resultsData?.updated_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Live leaderboard error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
