import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/payments/settings
 * Get payment settings
 */
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw error;
    }

    // Return default settings if none exist
    if (!data) {
      return NextResponse.json({
        amount_cents: 5000,
        amount_partner_cents: 4000,
        description: 'Deelname Bovenkamer Winterproef 2026',
        deadline: null,
        tikkie_enabled: true,
        auto_reminder_days: 3,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json(
      { error: 'Kon instellingen niet ophalen' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/settings
 * Create or update payment settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    const settingsData = {
      amount_cents: body.amount_cents || 5000,
      amount_partner_cents: body.amount_partner_cents || 4000,
      description: body.description || 'Deelname event',
      deadline: body.deadline || null,
      tikkie_enabled: body.tikkie_enabled ?? true,
      auto_reminder_days: body.auto_reminder_days || 3,
      updated_at: new Date().toISOString(),
    };

    // Check if settings exist
    const { data: existing } = await supabase
      .from('payment_settings')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existing) {
      // Update existing
      result = await supabase
        .from('payment_settings')
        .update(settingsData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from('payment_settings')
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return NextResponse.json(
      { error: 'Kon instellingen niet opslaan' },
      { status: 500 }
    );
  }
}
