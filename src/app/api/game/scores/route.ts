import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COOKIE_NAME = 'bovenkamer_auth_token';

async function getUserFromToken(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// GET /api/game/scores - Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get top scores with user names (fetch more to filter unique users)
    const { data: allScores, error: leaderboardError } = await supabase
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
      .limit(100); // Fetch more to ensure we get enough unique users

    if (leaderboardError) {
      console.error('Leaderboard error:', leaderboardError);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Filter to only show best score per user
    const bestScoresByUser = new Map<string, typeof allScores[0]>();
    for (const entry of allScores || []) {
      const existing = bestScoresByUser.get(entry.user_id);
      if (!existing || entry.score > existing.score) {
        bestScoresByUser.set(entry.user_id, entry);
      }
    }

    // Convert to array, sort by score, and limit
    const uniqueLeaderboard = Array.from(bestScoresByUser.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Format leaderboard with ranks
    const formattedLeaderboard = uniqueLeaderboard.map((entry, index) => ({
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

    // Verify user exists in database
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.userId)
      .single();

    if (userError || !existingUser) {
      console.error('User not found in database:', user.userId);
      return NextResponse.json({
        success: false,
        saved: false,
        message: 'Gebruiker niet gevonden - log opnieuw in',
      }, { status: 200 });
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

    // Update user's game_points with their best score (+ recalculate total_points)
    const { data: bestScore } = await supabase
      .from('game_scores')
      .select('score')
      .eq('user_id', user.userId)
      .eq('game_type', 'burger_stack')
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (bestScore) {
      const { error: rpcError } = await supabase.rpc('set_game_points', {
        p_user_id: user.userId,
        p_score: bestScore.score,
      });
      if (rpcError) {
        console.error('set_game_points RPC error:', rpcError, '— falling back to direct update');
        // Fallback: direct update if RPC function doesn't exist
        const { error: updateError } = await supabase
          .from('users')
          .update({ game_points: bestScore.score })
          .eq('id', user.userId);
        if (updateError) {
          console.error('Fallback game_points update error:', updateError);
        }
      }
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
