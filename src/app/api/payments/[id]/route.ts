import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type PaymentStatus = 'pending' | 'processing' | 'paid' | 'expired' | 'cancelled';

interface UpdatePaymentRequest {
  status: PaymentStatus;
}

/**
 * PATCH /api/payments/[id]
 * Update payment status (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    const body: UpdatePaymentRequest = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses: PaymentStatus[] = ['pending', 'processing', 'paid', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Ongeldige status', validStatuses },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set paid_at when marking as paid
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    // Clear paid_at when reverting from paid
    if (status !== 'paid') {
      updateData.paid_at = null;
    }

    // Update payment request
    const { data: payment, error } = await supabase
      .from('payment_requests')
      .update(updateData)
      .eq('id', paymentId)
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      return NextResponse.json(
        { error: 'Kon betaling niet updaten' },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Betaling niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
      message: `Status gewijzigd naar "${status}"`,
    });
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/[id]
 * Get single payment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    const supabase = createServerClient();

    const { data: payment, error } = await supabase
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
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Betaling niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
