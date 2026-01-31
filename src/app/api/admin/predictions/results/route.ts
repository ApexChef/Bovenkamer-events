/**
 * File: src/app/api/admin/predictions/results/route.ts
 * Purpose: Admin endpoint for managing actual prediction results
 *
 * Security:
 * - Requires admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

// GET: Fetch actual results
export async function GET(request: NextRequest) {
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

    const supabase = createServerClient();

    // Fetch actual results from settings table
    const { data, error } = await supabase
      .from('prediction_results')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is OK
      console.error('Error fetching results:', error);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon resultaten niet ophalen',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: data?.results || {},
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}

// POST: Save actual results
export async function POST(request: NextRequest) {
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

    const { results }: { results: Record<string, unknown> } = await request.json();
    const supabase = createServerClient();

    // Check if results record exists
    const { data: existing } = await supabase
      .from('prediction_results')
      .select('id')
      .limit(1)
      .single();

    let error;
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('prediction_results')
        .update({
          results,
          updated_at: new Date().toISOString(),
          updated_by: adminUser.userId,
        })
        .eq('id', existing.id);
      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('prediction_results')
        .insert({
          results,
          created_by: adminUser.userId,
          updated_by: adminUser.userId,
        });
      error = insertError;
    }

    if (error) {
      console.error('Error saving results:', error);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Kon resultaten niet opslaan',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Resultaten opgeslagen',
    });
  } catch (error) {
    console.error('Save results error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}
