/**
 * File: src/app/api/admin/registrations/[id]/reject/route.ts
 * Purpose: Admin endpoint for rejecting a registration
 *
 * Flow:
 * 1. Verify admin authentication
 * 2. Validate rejection reason (required)
 * 3. Find user by ID
 * 4. Update registration_status to 'rejected'
 * 5. Store rejection reason
 * 6. Send rejection email
 * 7. Return success response
 *
 * Security:
 * - Requires admin role
 * - Rejection reason is mandatory
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';
import { sendRejectionEmail } from '@/lib/auth/email-service';

interface RejectRequest {
  reason: string;
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
    const body: RejectRequest = await request.json();
    const { reason, sendEmail = true } = body;

    // Validate rejection reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'REASON_REQUIRED',
          message: 'Reden voor afwijzing is verplicht',
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, registration_status')
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

    // Check if already rejected
    if (user.registration_status === 'rejected') {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_REJECTED',
          message: 'Deze registratie is al afgewezen',
        },
        { status: 400 }
      );
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        registration_status: 'rejected',
        rejection_reason: reason.trim(),
        approved_at: null,
        approved_by: null,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error rejecting registration:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Kon registratie niet afwijzen',
        },
        { status: 500 }
      );
    }

    // Send rejection email
    let emailSent = false;
    if (sendEmail) {
      const emailResult = await sendRejectionEmail(user.email, user.name, reason.trim());
      emailSent = emailResult.success;

      if (!emailResult.success) {
        console.error('Failed to send rejection email:', emailResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registratie afgewezen',
      emailSent,
    });
  } catch (error) {
    console.error('Reject registration error:', error);
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
