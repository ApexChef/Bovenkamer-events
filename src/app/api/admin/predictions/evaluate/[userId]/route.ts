import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || !isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 },
      );
    }

    const { userId } = params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('user_evaluations')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'prediction')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Geen evaluatie gevonden voor deze gebruiker' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      evaluation: data.evaluation,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Get evaluation error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Kon evaluatie niet ophalen' },
      { status: 500 },
    );
  }
}
