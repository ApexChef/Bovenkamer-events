import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { FeatureKey, DEFAULT_FEATURES } from '@/types';

/**
 * GET /api/admin/features
 * Get all feature toggles with their current state (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServerClient();

    // Fetch all feature toggles
    const { data: toggles, error } = await supabase
      .from('feature_toggles')
      .select('*')
      .order('feature_key');

    if (error) {
      console.error('Error fetching feature toggles:', error);
      // Return defaults if table doesn't exist
      return NextResponse.json({
        features: Object.entries(DEFAULT_FEATURES).map(([key, enabled]) => ({
          feature_key: key,
          is_enabled: enabled,
          description: getFeatureDescription(key as FeatureKey),
          updated_at: null,
          updated_by: null,
        })),
      });
    }

    // Merge with defaults to ensure all features are present
    const featureMap = new Map(toggles.map((t: { feature_key: string }) => [t.feature_key, t]));
    const allFeatures = Object.entries(DEFAULT_FEATURES).map(([key, defaultEnabled]) => {
      const existing = featureMap.get(key);
      return existing || {
        feature_key: key,
        is_enabled: defaultEnabled,
        description: getFeatureDescription(key as FeatureKey),
        updated_at: null,
        updated_by: null,
      };
    });

    return NextResponse.json({ features: allFeatures });
  } catch (error) {
    console.error('Admin features error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/features
 * Update a feature toggle (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServerClient();
    const body = await request.json();
    const { feature_key, is_enabled } = body;

    if (!feature_key || typeof is_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'feature_key and is_enabled are required' },
        { status: 400 }
      );
    }

    // Validate feature key
    if (!(feature_key in DEFAULT_FEATURES)) {
      return NextResponse.json({ error: 'Invalid feature key' }, { status: 400 });
    }

    // Upsert the feature toggle
    const { data, error } = await supabase
      .from('feature_toggles')
      .upsert(
        {
          feature_key,
          is_enabled,
          description: getFeatureDescription(feature_key as FeatureKey),
          updated_at: new Date().toISOString(),
          updated_by: user.email,
        },
        { onConflict: 'feature_key' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating feature toggle:', error);
      return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
    }

    return NextResponse.json({ feature: data });
  } catch (error) {
    console.error('Admin features patch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getFeatureDescription(key: FeatureKey): string {
  const descriptions: Record<FeatureKey, string> = {
    show_countdown: 'Toon afteltimer tot het evenement',
    show_ai_assignment: 'Toon AI-gegenereerde taaktoewijzing',
    show_leaderboard_preview: 'Toon mini-leaderboard op de homepagina',
    show_burger_game: 'Toon Burger Stack game CTA',
    show_predictions: 'Toon voorspellingen sectie',
  };
  return descriptions[key] || key;
}
