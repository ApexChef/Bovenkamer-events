import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { tikkie, calculateTotalAmount } from '@/lib/tikkie';

/**
 * GET /api/payments
 * Get all payment requests with status
 * Optional query params: user_id (filters by user email or id)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const userFilter = searchParams.get('user_id');

    let query = supabase
      .from('payment_requests')
      .select(`
        *,
        users (
          id,
          name,
          email
        ),
        registrations (
          has_partner,
          partner_name
        )
      `)
      .order('created_at', { ascending: false });

    // If filtering by user, look up user by email or id
    if (userFilter) {
      // First try to find user by email, then by id
      let user = null;

      // Try email first
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', userFilter)
        .single();

      if (userByEmail) {
        user = userByEmail;
      } else {
        // Try by id
        const { data: userById } = await supabase
          .from('users')
          .select('id')
          .eq('id', userFilter)
          .single();
        user = userById;
      }

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        // No user found, return empty
        return NextResponse.json({ payments: [], settings: null, stats: null });
      }
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Kon betalingen niet ophalen' }, { status: 500 });
    }

    // Get settings
    const { data: settings } = await supabase
      .from('payment_settings')
      .select('*')
      .limit(1)
      .single();

    // Calculate stats
    const stats = {
      total: payments?.length || 0,
      paid: payments?.filter((p) => p.status === 'paid').length || 0,
      pending: payments?.filter((p) => p.status === 'pending').length || 0,
      expired: payments?.filter((p) => p.status === 'expired').length || 0,
      totalExpected: payments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0,
      totalReceived: payments
        ?.filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount_cents, 0) || 0,
    };

    return NextResponse.json({
      payments,
      settings,
      stats,
    });
  } catch (error) {
    console.error('Payments API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

/**
 * POST /api/payments
 * Create a new payment request for a user
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, registrationId } = await request.json();
    const supabase = createServerClient();

    // Get user and registration info
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: 'Registratie niet gevonden' }, { status: 404 });
    }

    // Get payment settings
    const { data: settings } = await supabase
      .from('payment_settings')
      .select('*')
      .limit(1)
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Betaalinstellingen niet geconfigureerd' }, { status: 400 });
    }

    // Calculate amount
    const amount = calculateTotalAmount(
      settings.amount_cents,
      settings.amount_partner_cents || 0,
      registration.has_partner
    );

    // Check if payment request already exists
    const { data: existingPayment } = await supabase
      .from('payment_requests')
      .select('id, tikkie_url, status')
      .eq('registration_id', registrationId)
      .single();

    if (existingPayment && existingPayment.status !== 'expired') {
      return NextResponse.json({
        paymentRequest: existingPayment,
        message: 'Betaalverzoek bestaat al',
      });
    }

    let tikkieUrl = null;
    let tikkieToken = null;

    // Create Tikkie payment request if configured
    if (tikkie.isConfigured()) {
      try {
        const tikkieResponse = await tikkie.createPaymentRequest({
          amountInCents: amount,
          description: `${settings.description} - ${registration.users.name}`,
          expiryDate: settings.deadline,
          referenceId: registrationId,
        });

        tikkieUrl = tikkieResponse.url;
        tikkieToken = tikkieResponse.paymentRequestToken;
      } catch (tikkieError) {
        console.error('Tikkie API error:', tikkieError);
        // Continue without Tikkie - manual payment possible
      }
    }

    // Create payment request record
    const { data: paymentRequest, error: paymentError } = await supabase
      .from('payment_requests')
      .insert({
        user_id: userId,
        registration_id: registrationId,
        tikkie_payment_request_token: tikkieToken,
        tikkie_url: tikkieUrl,
        amount_cents: amount,
        description: settings.description,
        status: 'pending',
        expires_at: settings.deadline,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment request:', paymentError);
      return NextResponse.json({ error: 'Kon betaalverzoek niet aanmaken' }, { status: 500 });
    }

    return NextResponse.json({
      paymentRequest,
      message: tikkieUrl ? 'Tikkie betaalverzoek aangemaakt' : 'Betaalverzoek aangemaakt (zonder Tikkie)',
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
