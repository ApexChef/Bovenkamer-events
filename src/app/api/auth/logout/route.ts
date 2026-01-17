/**
 * File: src/app/api/auth/logout/route.ts
 * Purpose: User logout endpoint - clears JWT cookie
 *
 * Flow:
 * 1. Clear httpOnly cookie
 * 2. Return success response
 *
 * Note: Client should also clear localStorage cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearTokenCookie } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: 'Uitgelogd',
      },
      { status: 200 }
    );

    return clearTokenCookie(response);
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis bij het uitloggen',
      },
      { status: 500 }
    );
  }
}
