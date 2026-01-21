'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  RefreshCw,
  Filter,
  X,
  ChevronLeft,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  Music,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useAuthStore } from '@/lib/store';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  points: number;
  birthYear: number | null;
  gender: string | null;
  jkvJoinYear: number | null;
  bovenkamerJoinYear: number | null;
  musicDecade: string | null;
  musicGenre: string | null;
}

interface LeaderboardStats {
  totalParticipants: number;
  totalPoints: number;
  averagePoints: number;
  pointsDistribution: { range: string; count: number }[];
  ageDistribution: { range: string; count: number }[];
}

type AgeFilter = 'all' | '20-29' | '30-39' | '40-49' | '50+';
type MusicDecadeFilter = 'all' | '70s' | '80s' | '90s' | '00s' | '10s';
type JkvFilter = 'all' | 'active' | 'alumni';

// Helper function to extract first name
const getFirstName = (fullName: string): string => {
  return fullName.split(' ')[0];
};

export default function LeaderboardPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters (hidden for now - not enough data)
  const showFilters = false; // Disabled until we have more data
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [musicDecadeFilter, setMusicDecadeFilter] = useState<MusicDecadeFilter>('all');
  const [jkvFilter, setJkvFilter] = useState<JkvFilter>('all');

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard/full?email=${encodeURIComponent(currentUser?.email || '')}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (_hasHydrated) {
      fetchLeaderboard();
    }
  }, [_hasHydrated, currentUser?.email]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeaderboard();
  };

  // Filter leaderboard
  const filteredLeaderboard = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return leaderboard.filter(entry => {
      // Age filter
      if (ageFilter !== 'all' && entry.birthYear) {
        const age = currentYear - entry.birthYear;
        switch (ageFilter) {
          case '20-29': if (age < 20 || age > 29) return false; break;
          case '30-39': if (age < 30 || age > 39) return false; break;
          case '40-49': if (age < 40 || age > 49) return false; break;
          case '50+': if (age < 50) return false; break;
        }
      } else if (ageFilter !== 'all' && !entry.birthYear) {
        return false;
      }

      // Music decade filter
      if (musicDecadeFilter !== 'all') {
        if (entry.musicDecade !== musicDecadeFilter) return false;
      }

      // JKV filter
      if (jkvFilter !== 'all') {
        if (jkvFilter === 'active' && entry.jkvJoinYear === null) return false;
        if (jkvFilter === 'alumni' && entry.bovenkamerJoinYear === null) return false;
      }

      return true;
    }).map((entry, index) => ({
      ...entry,
      rank: index + 1, // Re-rank after filtering
    }));
  }, [leaderboard, ageFilter, musicDecadeFilter, jkvFilter]);

  // Count active filters
  const activeFilterCount = [ageFilter, musicDecadeFilter, jkvFilter].filter(f => f !== 'all').length;

  // Clear all filters
  const clearFilters = () => {
    setAgeFilter('all');
    setMusicDecadeFilter('all');
    setJkvFilter('all');
  };

  // Get current user from filtered list
  const currentUserEntry = filteredLeaderboard.find(e => e.email === currentUser?.email);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-green">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-deep-green/95 backdrop-blur border-b border-gold/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 text-cream/70 hover:text-gold transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-display text-gold">Leaderboard</h1>
              <p className="text-xs text-cream/50">
                {filteredLeaderboard.length} deelnemers
                {activeFilterCount > 0 && ` (gefilterd)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter button - hidden until we have more data
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors relative ${
                showFilters || activeFilterCount > 0
                  ? 'bg-gold/20 text-gold'
                  : 'text-cream/70 hover:text-gold hover:bg-gold/10'
              }`}
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-deep-green text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-cream/70 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gold/20 overflow-hidden"
            >
              <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
                {/* Age Filter */}
                <div>
                  <label className="text-xs text-cream/50 uppercase tracking-wide mb-2 block">
                    Leeftijd
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', '20-29', '30-39', '40-49', '50+'] as AgeFilter[]).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setAgeFilter(filter)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          ageFilter === filter
                            ? 'bg-gold text-deep-green border-gold'
                            : 'border-cream/20 text-cream/70 hover:border-gold/50'
                        }`}
                      >
                        {filter === 'all' ? 'Alle' : filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Music Decade Filter */}
                <div>
                  <label className="text-xs text-cream/50 uppercase tracking-wide mb-2 block">
                    Muziek Decade
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', '70s', '80s', '90s', '00s', '10s'] as MusicDecadeFilter[]).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setMusicDecadeFilter(filter)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          musicDecadeFilter === filter
                            ? 'bg-gold text-deep-green border-gold'
                            : 'border-cream/20 text-cream/70 hover:border-gold/50'
                        }`}
                      >
                        {filter === 'all' ? 'Alle' : filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* JKV Filter */}
                <div>
                  <label className="text-xs text-cream/50 uppercase tracking-wide mb-2 block">
                    JKV Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Alle' },
                      { value: 'active', label: 'JKV Lid' },
                      { value: 'alumni', label: 'Bovenkamer' },
                    ].map(filter => (
                      <button
                        key={filter.value}
                        onClick={() => setJkvFilter(filter.value as JkvFilter)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          jkvFilter === filter.value
                            ? 'bg-gold text-deep-green border-gold'
                            : 'border-cream/20 text-cream/70 hover:border-gold/50'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-warm-red hover:text-warm-red/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Wis filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-gold/20">
              <CardContent className="py-4 text-center">
                <Users className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-2xl font-display text-gold">{stats.totalParticipants}</p>
                <p className="text-xs text-cream/50">Deelnemers</p>
              </CardContent>
            </Card>
            <Card className="border-gold/20">
              <CardContent className="py-4 text-center">
                <TrendingUp className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-2xl font-display text-gold">{stats.totalPoints}</p>
                <p className="text-xs text-cream/50">Totaal Punten</p>
              </CardContent>
            </Card>
            <Card className="border-gold/20">
              <CardContent className="py-4 text-center">
                <BarChart3 className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-2xl font-display text-gold">{stats.averagePoints}</p>
                <p className="text-xs text-cream/50">Gemiddeld</p>
              </CardContent>
            </Card>
            <Card className="border-gold/20">
              <CardContent className="py-4 text-center">
                <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-2xl font-display text-gold">
                  {currentUserEntry?.rank || '-'}
                </p>
                <p className="text-xs text-cream/50">Jouw Positie</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Points Distribution Chart */}
        {stats && (
          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gold" />
                Punten Verdeling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {stats.pointsDistribution.map((item, index) => {
                  const maxCount = Math.max(...stats.pointsDistribution.map(d => d.count));
                  const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                  return (
                    <div key={item.range} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gold font-medium">{item.count}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="w-full bg-gradient-to-t from-gold/50 to-gold rounded-t min-h-[4px]"
                      />
                      <span className="text-xs text-cream/50">{item.range}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current User Position (if not in top) */}
        {currentUserEntry && currentUserEntry.rank > 5 && (
          <Card className="bg-gradient-to-r from-gold/15 to-gold/5 border-gold/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                    <span className="text-gold font-bold text-lg">#{currentUserEntry.rank}</span>
                  </div>
                  <div>
                    <p className="text-cream font-semibold">{getFirstName(currentUserEntry.name)}</p>
                    <p className="text-cream/50 text-xs">Jouw positie</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gold font-display text-2xl">{currentUserEntry.points}</p>
                  <p className="text-cream/50 text-xs">punten</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard List */}
        <Card className="border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              Ranking
            </CardTitle>
            {activeFilterCount > 0 && (
              <CardDescription>
                {filteredLeaderboard.length} van {leaderboard.length} deelnemers
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto" />
                <p className="text-cream/50 mt-3 text-sm">Laden...</p>
              </div>
            ) : filteredLeaderboard.length > 0 ? (
              <div className="space-y-2">
                {filteredLeaderboard.slice(0, 20).map((entry, index) => {
                  const isCurrentUser = entry.email === currentUser?.email;
                  const isTop3 = index < 3;
                  const currentYear = new Date().getFullYear();
                  const age = entry.birthYear ? currentYear - entry.birthYear : null;

                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        isCurrentUser
                          ? 'bg-gold/20 border border-gold/30'
                          : 'bg-dark-wood/30 hover:bg-dark-wood/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? 'bg-yellow-500 text-dark-wood'
                              : index === 1
                              ? 'bg-gray-300 text-dark-wood'
                              : index === 2
                              ? 'bg-amber-600 text-dark-wood'
                              : 'bg-dark-wood text-cream/70 border border-gold/10'
                          }`}
                        >
                          {isTop3 ? (
                            <Medal className="w-4 h-4" />
                          ) : (
                            entry.rank
                          )}
                        </div>
                        <div>
                          <span className={`${isCurrentUser ? 'text-gold font-semibold' : 'text-cream'}`}>
                            {getFirstName(entry.name)}
                            {isCurrentUser && <span className="text-gold/70 text-xs ml-1">(jij)</span>}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {age && (
                              <span className="text-xs text-cream/40 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {age} jr
                              </span>
                            )}
                            {entry.musicDecade && (
                              <span className="text-xs text-cream/40 flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                {entry.musicDecade}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-gold font-bold">{entry.points}</span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gold/30 mx-auto mb-3" />
                <p className="text-cream/50 mb-2">Geen deelnemers gevonden</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-gold text-sm hover:underline"
                  >
                    Wis filters
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
