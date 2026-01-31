/**
 * File: src/app/api/admin/predictions/calculate/route.ts
 * Purpose: Admin endpoint for calculating and awarding prediction points
 *
 * Scoring uses the shared scoring module which reads field definitions
 * from the dynamic form system.
 *
 * Security:
 * - Requires admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import {
  fetchPredictionFields,
  fetchUserPredictions,
  calculatePredictionScore,
} from '@/lib/predictions/scoring';

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

    const actualResults: Record<string, unknown> = resultsData.results;

    // Fetch field definitions from the form system
    const fields = await fetchPredictionFields(supabase);

    if (fields.length === 0) {
      return NextResponse.json(
        {
          error: 'NO_FIELDS',
          message: 'Geen voorspellingsvelden gevonden in het formuliersysteem.',
        },
        { status: 400 }
      );
    }

    // Fetch user predictions from the form system
    const userPredictions = await fetchUserPredictions(supabase);

    let usersProcessed = 0;
    let totalPointsAwarded = 0;

    // Calculate and award points for each user
    for (const user of userPredictions) {
      if (Object.keys(user.answers).length === 0) {
        continue;
      }

      const { total, breakdown } = calculatePredictionScore(fields, user.answers, actualResults);

      if (total > 0) {
        // Check if points already awarded for predictions
        const { data: existingPoints } = await supabase
          .from('points_ledger')
          .select('id')
          .eq('user_id', user.userId)
          .eq('source', 'prediction_results')
          .single();

        if (existingPoints) {
          // Delete old entry and insert new one so the points_ledger trigger
          // fires and keeps the users table in sync.
          await supabase
            .from('points_ledger')
            .delete()
            .eq('id', existingPoints.id);
        }

        // Insert (new or replacement) points entry — trigger syncs users table
        await supabase.from('points_ledger').insert({
          user_id: user.userId,
          source: 'prediction_results',
          points: total,
          description: `Voorspellingen punten: ${JSON.stringify(breakdown)}`,
        });

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
