/**
 * File: src/app/api/admin/predictions/calculate/route.ts
 * Purpose: Admin endpoint for calculating and awarding prediction points
 *
 * Scoring:
 * - Exact match: 50 points
 * - Close (±10% for numbers): 25 points
 * - Nearby (±25% for numbers): 10 points
 *
 * Security:
 * - Requires admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { Predictions } from '@/types';

interface ActualResults {
  wineBottles?: number;
  beerCrates?: number;
  meatKilos?: number;
  firstSleeper?: string;
  spontaneousSinger?: string;
  lastToLeave?: string;
  loudestLaugher?: string;
  longestStoryTeller?: string;
  somethingBurned?: boolean;
  outsideTemp?: number;
  lastGuestTime?: string;
}

// Calculate points for a single prediction
function calculatePredictionPoints(
  prediction: Predictions,
  actual: ActualResults
): { total: number; breakdown: Record<string, number> } {
  let total = 0;
  const breakdown: Record<string, number> = {};

  // Helper for numeric comparisons
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

  // Helper for exact match (strings, booleans)
  const scoreExact = (predicted: unknown, actual: unknown, key: string) => {
    if (predicted === undefined || actual === undefined) return;

    if (predicted === actual) {
      breakdown[key] = 50;
      total += 50;
    } else {
      breakdown[key] = 0;
    }
  };

  // Helper for time comparison (give points for being close)
  const scoreTime = (predicted: string | undefined, actual: string | undefined, key: string) => {
    if (!predicted || !actual) return;

    // Convert time to minutes for comparison
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const predictedMins = toMinutes(predicted);
    const actualMins = toMinutes(actual);
    const diff = Math.abs(predictedMins - actualMins);

    if (diff === 0) {
      breakdown[key] = 50;
      total += 50;
    } else if (diff <= 30) {
      // Within 30 minutes
      breakdown[key] = 25;
      total += 25;
    } else if (diff <= 60) {
      // Within 1 hour
      breakdown[key] = 10;
      total += 10;
    } else {
      breakdown[key] = 0;
    }
  };

  // Score each prediction
  scoreNumeric(prediction.wineBottles, actual.wineBottles, 'wineBottles');
  scoreNumeric(prediction.beerCrates, actual.beerCrates, 'beerCrates');
  scoreNumeric(prediction.meatKilos, actual.meatKilos, 'meatKilos');

  scoreExact(prediction.firstSleeper, actual.firstSleeper, 'firstSleeper');
  scoreExact(prediction.spontaneousSinger, actual.spontaneousSinger, 'spontaneousSinger');
  scoreExact(prediction.lastToLeave, actual.lastToLeave, 'lastToLeave');
  scoreExact(prediction.loudestLaugher, actual.loudestLaugher, 'loudestLaugher');
  scoreExact(prediction.longestStoryTeller, actual.longestStoryTeller, 'longestStoryTeller');

  scoreExact(prediction.somethingBurned, actual.somethingBurned, 'somethingBurned');
  scoreNumeric(prediction.outsideTemp, actual.outsideTemp, 'outsideTemp');
  scoreTime(prediction.lastGuestTime, actual.lastGuestTime, 'lastGuestTime');

  return { total, breakdown };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || !isAdmin(adminUser)) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Admin toegang vereist',
        },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // Fetch actual results
    const { data: resultsData, error: resultsError } = await supabase
      .from('prediction_results')
      .select('results')
      .limit(1)
      .single();

    if (resultsError || !resultsData?.results) {
      return NextResponse.json(
        {
          error: 'NO_RESULTS',
          message: 'Geen uitkomsten gevonden. Vul eerst de uitkomsten in.',
        },
        { status: 400 }
      );
    }

    const actualResults: ActualResults = resultsData.results;

    // Fetch all registrations with predictions
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        id,
        user_id,
        predictions
      `);

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

    let usersProcessed = 0;
    let totalPointsAwarded = 0;

    // Calculate and award points for each user
    for (const reg of registrations || []) {
      if (!reg.predictions || Object.keys(reg.predictions).length === 0) {
        continue;
      }

      const { total, breakdown } = calculatePredictionPoints(reg.predictions as Predictions, actualResults);

      if (total > 0) {
        // Check if points already awarded for predictions
        const { data: existingPoints } = await supabase
          .from('points_ledger')
          .select('id')
          .eq('user_id', reg.user_id)
          .eq('source', 'prediction_results')
          .single();

        if (existingPoints) {
          // Update existing points
          await supabase
            .from('points_ledger')
            .update({
              points: total,
              description: `Voorspellingen punten: ${JSON.stringify(breakdown)}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPoints.id);
        } else {
          // Insert new points entry
          await supabase.from('points_ledger').insert({
            user_id: reg.user_id,
            source: 'prediction_results',
            points: total,
            description: `Voorspellingen punten: ${JSON.stringify(breakdown)}`,
          });
        }

        usersProcessed++;
        totalPointsAwarded += total;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Punten berekend en toegekend',
      usersProcessed,
      totalPointsAwarded,
    });
  } catch (error) {
    console.error('Calculate points error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis bij het berekenen van punten',
      },
      { status: 500 }
    );
  }
}
