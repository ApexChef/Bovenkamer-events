import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  points: number;
  // Category breakdown
  registrationPoints: number;
  predictionPoints: number;
  quizPoints: number;
  gamePoints: number;
  bonusPoints: number;
  // Profile data for filtering
  birthYear: number | null;
  gender: string | null;
  jkvJoinYear: number | null;
  bovenkamerJoinYear: number | null;
  musicDecade: string | null;
  musicGenre: string | null;
}

export interface LeaderboardStats {
  totalParticipants: number;
  totalPoints: number;
  averagePoints: number;
  pointsDistribution: { range: string; count: number }[];
  ageDistribution: { range: string; count: number }[];
}

// Get full leaderboard with profile data for filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Get users with point columns (kept in sync by points_ledger trigger + set_game_points RPC)
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, total_points, registration_points, prediction_points, quiz_points, game_points, bonus_points');

    const { data: registrations } = await supabase
      .from('registrations')
      .select('user_id, birth_year, jkv_join_year, bovenkamer_join_year, music_decade, music_genre');

    // Create registration lookup
    const regLookup: Record<string, {
      birthYear: number | null;
      jkvJoinYear: number | null;
      bovenkamerJoinYear: number | null;
      musicDecade: string | null;
      musicGenre: string | null;
    }> = {};

    if (registrations) {
      for (const reg of registrations) {
        regLookup[reg.user_id] = {
          birthYear: reg.birth_year,
          jkvJoinYear: reg.jkv_join_year,
          bovenkamerJoinYear: reg.bovenkamer_join_year,
          musicDecade: reg.music_decade,
          musicGenre: reg.music_genre,
        };
      }
    }

    // Build leaderboard entries
    const leaderboardEntries: Omit<LeaderboardEntry, 'rank'>[] = [];

    if (users) {
      for (const user of users) {
        const reg = regLookup[user.id] || {};
        leaderboardEntries.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          points: user.total_points || 0,
          registrationPoints: user.registration_points || 0,
          predictionPoints: user.prediction_points || 0,
          quizPoints: user.quiz_points || 0,
          gamePoints: user.game_points || 0,
          bonusPoints: user.bonus_points || 0,
          birthYear: reg.birthYear || null,
          gender: null, // We don't have gender field yet
          jkvJoinYear: reg.jkvJoinYear || null,
          bovenkamerJoinYear: reg.bovenkamerJoinYear || null,
          musicDecade: reg.musicDecade || null,
          musicGenre: reg.musicGenre || null,
        });
      }
    }

    // Sort by points and add rank
    const sortedLeaderboard: LeaderboardEntry[] = leaderboardEntries
      .sort((a, b) => b.points - a.points)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    // Calculate stats
    const totalPoints = sortedLeaderboard.reduce((sum, e) => sum + e.points, 0);
    const averagePoints = sortedLeaderboard.length > 0 ? Math.round(totalPoints / sortedLeaderboard.length) : 0;

    // Points distribution (0-50, 51-100, 101-150, etc.)
    const pointsRanges = [
      { min: 0, max: 50, label: '0-50' },
      { min: 51, max: 100, label: '51-100' },
      { min: 101, max: 150, label: '101-150' },
      { min: 151, max: 200, label: '151-200' },
      { min: 201, max: 300, label: '201+' },
    ];

    const pointsDistribution = pointsRanges.map(range => ({
      range: range.label,
      count: sortedLeaderboard.filter(e =>
        e.points >= range.min && (range.max === 300 ? true : e.points <= range.max)
      ).length,
    }));

    // Age distribution
    const currentYear = new Date().getFullYear();
    const ageRanges = [
      { min: 20, max: 29, label: '20-29' },
      { min: 30, max: 39, label: '30-39' },
      { min: 40, max: 49, label: '40-49' },
      { min: 50, max: 59, label: '50-59' },
      { min: 60, max: 100, label: '60+' },
    ];

    const ageDistribution = ageRanges.map(range => ({
      range: range.label,
      count: sortedLeaderboard.filter(e => {
        if (!e.birthYear) return false;
        const age = currentYear - e.birthYear;
        return age >= range.min && age <= range.max;
      }).length,
    }));

    // Get current user
    let currentUser = null;
    if (email) {
      currentUser = sortedLeaderboard.find(u => u.email === email) || null;
    }

    const stats: LeaderboardStats = {
      totalParticipants: sortedLeaderboard.length,
      totalPoints,
      averagePoints,
      pointsDistribution,
      ageDistribution,
    };

    return NextResponse.json({
      leaderboard: sortedLeaderboard,
      stats,
      currentUser,
    });
  } catch (error) {
    console.error('Full leaderboard API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
