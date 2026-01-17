import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/payments/webhook
 * Handle Tikkie webhook notifications
 *
 * Tikkie sends webhooks for:
 * - PAYMENT_RECEIVED: When a payment is made
 * - PAYMENT_REQUEST_EXPIRED: When a payment request expires
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const supabase = createServerClient();

    // Log the webhook for debugging
    const { data: webhook, error: logError } = await supabase
      .from('payment_webhooks')
      .insert({
        tikkie_notification_token: payload.notificationToken,
        event_type: payload.subscriptionType,
        payload,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    // Process based on event type
    switch (payload.subscriptionType) {
      case 'PAYMENT': {
        // Payment received
        const paymentRequestToken = payload.paymentRequestToken;

        // Find the payment request
        const { data: paymentRequest, error: findError } = await supabase
          .from('payment_requests')
          .select('id, user_id')
          .eq('tikkie_payment_request_token', paymentRequestToken)
          .single();

        if (findError || !paymentRequest) {
          console.error('Payment request not found for token:', paymentRequestToken);
          // Still return 200 to acknowledge webhook
          return NextResponse.json({ received: true, processed: false });
        }

        // Update payment status
        const { error: updateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', paymentRequest.id);

        if (updateError) {
          console.error('Error updating payment status:', updateError);
        }

        // Add points for payment
        await supabase.from('points_ledger').insert({
          user_id: paymentRequest.user_id,
          source: 'bonus',
          points: 5,
          description: 'Betaling ontvangen',
        });

        // Mark webhook as processed
        if (webhook) {
          await supabase
            .from('payment_webhooks')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('id', webhook.id);
        }

        break;
      }

      case 'PAYMENT_REQUEST_EXPIRED': {
        // Payment request expired
        const expiredToken = payload.paymentRequestToken;

        await supabase
          .from('payment_requests')
          .update({ status: 'expired' })
          .eq('tikkie_payment_request_token', expiredToken);

        break;
      }

      default:
        console.log('Unknown webhook type:', payload.subscriptionType);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent retries for malformed payloads
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}
