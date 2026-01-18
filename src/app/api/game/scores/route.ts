import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getUserFromToken(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // Debug: log all cookies
  const allCookies = cookieStore.getAll();
  console.log('Available cookies:', allCookies.map(c => c.name));

  if (!token) {
    console.log('No auth_token cookie found');
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    console.log('JWT verified for user:', payload.email);
    return payload as { userId: string; email: string; role: string };
  } catch (error) {
    console.log('JWT verification failed:', error);
    return null;
  }
}

// GET /api/game/scores - Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get top scores with user names
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('game_scores')
      .select(`
        id,
        user_id,
        score,
        layers,
        max_combo,
        perfect_drops,
        duration_seconds,
        created_at,
        users!inner(name)
      `)
      .eq('game_type', 'burger_stack')
      .order('score', { ascending: false })
      .limit(limit);

    if (leaderboardError) {
      console.error('Leaderboard error:', leaderboardError);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Format leaderboard with ranks
    const formattedLeaderboard = (leaderboard || []).map((entry, index) => ({
      rank: index + 1,
      user_id: entry.user_id,
      user_name: Array.isArray(entry.users) ? (entry.users as { name: string }[])[0]?.name ?? 'Onbekend' : (entry.users as { name?: string })?.name ?? 'Onbekend',
      score: entry.score,
      layers: entry.layers,
      created_at: entry.created_at,
    }));

    // Get personal best if user is logged in
    let personalBest = 0;
    if (user) {
      const { data: userBest } = await supabase
        .from('game_scores')
        .select('score')
        .eq('user_id', user.userId)
        .eq('game_type', 'burger_stack')
        .order('score', { ascending: false })
        .limit(1)
        .single();

      personalBest = userBest?.score || 0;
    }

    return NextResponse.json({
      leaderboard: formattedLeaderboard,
      personalBest,
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/game/scores - Save a new score
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      // Return success but indicate score wasn't saved (for anonymous/unauthenticated users)
      console.log('Game score not saved - user not authenticated');
      return NextResponse.json({
        success: false,
        saved: false,
        message: 'Score niet opgeslagen - log in om je scores te bewaren',
      }, { status: 200 }); // Return 200 so frontend doesn't show error
    }

    const body = await request.json();
    const { score, layers, max_combo, perfect_drops, duration_seconds } = body;

    // Validate input
    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    // Insert new score
    const { data, error } = await supabase
      .from('game_scores')
      .insert({
        user_id: user.userId,
        game_type: 'burger_stack',
        score,
        layers: layers || 0,
        max_combo: max_combo || 0,
        perfect_drops: perfect_drops || 0,
        duration_seconds: duration_seconds || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Save score error:', error);
      return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
    }

    // Update user's game_points with their best score
    const { data: bestScore } = await supabase
      .from('game_scores')
      .select('score')
      .eq('user_id', user.userId)
      .eq('game_type', 'burger_stack')
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (bestScore) {
      await supabase
        .from('users')
        .update({ game_points: bestScore.score })
        .eq('id', user.userId);
    }

    return NextResponse.json({
      success: true,
      score: data,
    });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
