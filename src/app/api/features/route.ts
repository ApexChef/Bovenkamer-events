/**
 * File: src/app/api/features/route.ts
 * Purpose: Public endpoint to fetch feature toggle states
 *
 * Returns all feature flags for the application.
 * Used by FeatureProvider to enable/disable UI features.
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DEFAULT_FEATURES, FeatureFlags } from '@/types';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: toggles, error } = await supabase
      .from('feature_toggles')
      .select('feature_key, is_enabled');

    if (error) {
      console.error('Error fetching feature toggles:', error);
      // Return defaults on error
      return NextResponse.json({ features: DEFAULT_FEATURES });
    }

    // Convert array to object, falling back to defaults for missing keys
    const features: FeatureFlags = { ...DEFAULT_FEATURES };

    if (toggles) {
      for (const toggle of toggles) {
        if (toggle.feature_key in features) {
          features[toggle.feature_key as keyof FeatureFlags] = toggle.is_enabled;
        }
      }
    }

    return NextResponse.json({
      features,
      source: toggles ? 'database' : 'defaults',
    });
  } catch (error) {
    console.error('Feature toggles error:', error);
    return NextResponse.json({ features: DEFAULT_FEATURES });
  }
}
