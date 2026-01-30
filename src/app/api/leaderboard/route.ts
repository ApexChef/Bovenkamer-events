import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Get leaderboard (top participants by points)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Get users with total_points (kept in sync by DB trigger)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, total_points');

    if (usersError) {
      console.error('Error fetching leaderboard:', usersError);
      return NextResponse.json({ error: 'Kon leaderboard niet ophalen' }, { status: 500 });
    }

    // Build and sort leaderboard
    const sortedLeaderboard = (users || [])
      .map(user => ({
        userId: user.id,
        name: user.name?.split(' ')[0] || 'Deelnemer',
        email: user.email,
        points: user.total_points || 0,
      }))
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