import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Get leaderboard (top participants by points)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Get leaderboard: sum points per user
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('points_ledger')
      .select(`
        user_id,
        users (
          id,
          name,
          email
        )
      `)
      .order('user_id');

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError);
      return NextResponse.json({ error: 'Kon leaderboard niet ophalen' }, { status: 500 });
    }

    // Aggregate points per user
    const userPoints: Record<string, { userId: string; name: string; email: string; points: number }> = {};

    // First get all points entries
    const { data: allPoints } = await supabase
      .from('points_ledger')
      .select('user_id, points');

    if (allPoints) {
      for (const entry of allPoints) {
        if (!userPoints[entry.user_id]) {
          userPoints[entry.user_id] = { userId: entry.user_id, name: '', email: '', points: 0 };
        }
        userPoints[entry.user_id].points += entry.points;
      }
    }

    // Get user details
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email');

    if (users) {
      for (const user of users) {
        if (userPoints[user.id]) {
          userPoints[user.id].name = user.name;
          userPoints[user.id].email = user.email;
        } else {
          // User exists but has no points yet
          userPoints[user.id] = { userId: user.id, name: user.name, email: user.email, points: 0 };
        }
      }
    }

    // Convert to array and sort by points
    const sortedLeaderboard = Object.values(userPoints)
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        rank: index + 1,
        ...user,
      }));

    // Get current user's points if email provided
    let currentUserPoints = null;
    let currentUserRank = null;
    if (email) {
      const currentUser = sortedLeaderboard.find(u => u.email === email);
      if (currentUser) {
        currentUserPoints = currentUser.points;
        currentUserRank = currentUser.rank;
      }
    }

    return NextResponse.json({
      leaderboard: sortedLeaderboard.slice(0, 10), // Top 10
      totalParticipants: sortedLeaderboard.length,
      currentUser: email ? { points: currentUserPoints || 0, rank: currentUserRank || sortedLeaderboard.length + 1 } : null,
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}