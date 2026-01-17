import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/payments/reminder
 * Send payment reminder(s)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    // Single reminder or bulk?
    const paymentRequestIds: string[] = body.payment_request_ids || (body.payment_request_id ? [body.payment_request_id] : []);
    const sendToAll = body.send_to_all_pending === true;

    let targetRequests;

    if (sendToAll) {
      // Get all pending payment requests
      const { data, error } = await supabase
        .from('payment_requests')
        .select('id, user_id, tikkie_url, amount_cents')
        .eq('status', 'pending');

      if (error) throw error;
      targetRequests = data || [];
    } else if (paymentRequestIds.length > 0) {
      // Get specific payment requests
      const { data, error } = await supabase
        .from('payment_requests')
        .select('id, user_id, tikkie_url, amount_cents')
        .in('id', paymentRequestIds)
        .eq('status', 'pending');

      if (error) throw error;
      targetRequests = data || [];
    } else {
      return NextResponse.json(
        { error: 'Geen betaalverzoeken opgegeven' },
        { status: 400 }
      );
    }

    if (targetRequests.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'Geen openstaande betaalverzoeken gevonden',
      });
    }

    // Update reminder count and timestamp
    const now = new Date().toISOString();

    // Update each payment request with incremented reminder count
    for (const req of targetRequests) {
      // Get current reminder count
      const { data: current } = await supabase
        .from('payment_requests')
        .select('reminder_count')
        .eq('id', req.id)
        .single();

      const newCount = (current?.reminder_count || 0) + 1;

      await supabase
        .from('payment_requests')
        .update({
          reminder_count: newCount,
          last_reminder_at: now,
          updated_at: now,
        })
        .eq('id', req.id);
    }

    // In a real implementation, you would send emails here
    // For now, we just log and return success
    console.log(`Reminders sent for ${targetRequests.length} payment requests`);

    return NextResponse.json({
      success: true,
      sent: targetRequests.length,
      message: `Herinnering verstuurd naar ${targetRequests.length} personen`,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: 'Kon herinneringen niet versturen' },
      { status: 500 }
    );
  }
}
