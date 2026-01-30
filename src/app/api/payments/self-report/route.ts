import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/payments/self-report
 * User self-reports that they have paid via Tikkie.
 * Creates or updates a payment_requests record with status 'processing'.
 * Admin can later confirm by setting status to 'paid'.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is vereist' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Find registration
    const { data: registration } = await supabase
      .from('registrations')
      .select('id, has_partner, partner_name')
      .eq('user_id', user.id)
      .single();

    // Check if payment_requests record already exists
    const { data: existingPayment } = await supabase
      .from('payment_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existingPayment) {
      // Only update if not already paid
      if (existingPayment.status === 'paid') {
        return NextResponse.json({
          status: 'paid',
          message: 'Betaling al bevestigd',
        });
      }

      // Update to processing
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);

      if (updateError) {
        console.error('Error updating payment:', updateError);
        return NextResponse.json({ error: 'Kon betaling niet updaten' }, { status: 500 });
      }

      return NextResponse.json({
        status: 'processing',
        message: 'Betaling gemeld — wacht op bevestiging',
      });
    }

    // No record exists — create one with status 'processing'
    const hasPartner = registration?.has_partner || false;
    const PRICE_PER_PERSON_CENTS = 5000; // €50
    const amountCents = hasPartner ? PRICE_PER_PERSON_CENTS * 2 : PRICE_PER_PERSON_CENTS;

    const { error: insertError } = await supabase
      .from('payment_requests')
      .insert({
        user_id: user.id,
        registration_id: registration?.id || null,
        amount_cents: amountCents,
        status: 'processing',
        description: `Deelname Winterproef — ${user.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error creating payment record:', insertError);
      return NextResponse.json({ error: 'Kon betaling niet registreren' }, { status: 500 });
    }

    return NextResponse.json({
      status: 'processing',
      message: 'Betaling gemeld — wacht op bevestiging',
    });
  } catch (error) {
    console.error('Self-report payment error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
