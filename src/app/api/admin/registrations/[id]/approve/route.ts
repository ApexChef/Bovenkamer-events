/**
 * File: src/app/api/admin/registrations/[id]/approve/route.ts
 * Purpose: Admin endpoint for approving a registration
 *
 * Flow:
 * 1. Verify admin authentication
 * 2. Find user by ID
 * 3. Update registration_status to 'approved'
 * 4. Set approved_at and approved_by fields
 * 5. Send approval email
 * 6. Add registration points to ledger
 * 7. Return success response
 *
 * Security:
 * - Requires admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { sendApprovalEmail } from '@/lib/auth/email-service';

interface ApproveRequest {
  sendEmail?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    const body: ApproveRequest = await request.json().catch(() => ({}));
    const sendEmail = body.sendEmail !== false; // Default true

    const supabase = createServerClient();

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, registration_status, email_verified')
      .eq('id', userId)
      .single();

    if (!user || userError) {
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Gebruiker niet gevonden',
        },
        { status: 404 }
      );
    }

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Email moet eerst geverifieerd worden',
        },
        { status: 400 }
      );
    }

    // Check if already approved
    if (user.registration_status === 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_APPROVED',
          message: 'Deze registratie is al goedgekeurd',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update user status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        registration_status: 'approved',
        approved_at: now,
        approved_by: adminUser.userId,
        rejection_reason: null, // Clear any previous rejection reason
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error approving registration:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Kon registratie niet goedkeuren',
        },
        { status: 500 }
      );
    }

    // Add points for approved registration (if not already added)
    const { data: existingPoints } = await supabase
      .from('points_ledger')
      .select('id')
      .eq('user_id', userId)
      .eq('source', 'registration')
      .single();

    if (!existingPoints) {
      await supabase.from('points_ledger').insert({
        user_id: userId,
        source: 'registration',
        points: 10,
        description: 'Registratie goedgekeurd',
      });
    }

    // Create payment request for approved registration
    const { data: registration } = await supabase
      .from('registrations')
      .select('id, has_partner')
      .eq('user_id', userId)
      .single();

    if (registration) {
      // Check if payment request already exists
      const { data: existingPayment } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('registration_id', registration.id)
        .single();

      if (!existingPayment) {
        // Calculate amount: €50 per person (5000 cents)
        const AMOUNT_PER_PERSON = 5000;
        const amountCents = registration.has_partner ? AMOUNT_PER_PERSON * 2 : AMOUNT_PER_PERSON;

        await supabase.from('payment_requests').insert({
          user_id: userId,
          registration_id: registration.id,
          amount_cents: amountCents,
          status: 'pending',
          description: 'Deelname Bovenkamer Winterproef 2026',
        });
      }
    }

    // Send approval email
    let emailSent = false;
    if (sendEmail) {
      const emailResult = await sendApprovalEmail(user.email, user.name);
      emailSent = emailResult.success;

      if (!emailResult.success) {
        console.error('Failed to send approval email:', emailResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registratie goedgekeurd',
      emailSent,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        registrationStatus: 'approved',
        approvedAt: now,
        approvedBy: adminUser.userId,
      },
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
