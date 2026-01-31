'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Trophy,
  RefreshCw,
  Filter,
  X,
  ChevronLeft,
  ChevronDown,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  Music,
  Search,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useAuthStore } from '@/lib/store';
import { MUSIC_GENRES } from '@/types';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  points: number;
  registrationPoints: number;
  predictionPoints: number;
  quizPoints: number;
  gamePoints: number;
  bonusPoints: number;
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
type MusicGenreFilter = 'all' | string;
type SortCategory = 'total' | 'registration' | 'prediction' | 'quiz' | 'game';

const SORT_CATEGORIES: { value: SortCategory; label: string }[] = [
  { value: 'total', label: 'Totaal' },
  { value: 'registration', label: 'Registratie' },
  { value: 'prediction', label: 'Voorspellingen' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'game', label: 'Games' },
];

// Helper function to extract first name
const getFirstName = (fullName: string): string => {
  return fullName.split(' ')[0];
};

// Helper to get points for a category
const getCategoryPoints = (entry: LeaderboardEntry, category: SortCategory): number => {
  switch (category) {
    case 'total': return entry.points;
    case 'registration': return entry.registrationPoints;
    case 'prediction': return entry.predictionPoints;
    case 'quiz': return entry.quizPoints;
    case 'game': return entry.gamePoints;
  }
};

export default function LeaderboardPage() {
  const { currentUser, _hasHydrated } = useAuthStore();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [musicDecadeFilter, setMusicDecadeFilter] = useState<MusicDecadeFilter>('all');
  const [jkvFilter, setJkvFilter] = useState<JkvFilter>('all');
  const [musicGenreFilter, setMusicGenreFilter] = useState<MusicGenreFilter>('all');

  // Sort category
  const [sortCategory, setSortCategory] = useState<SortCategory>('total');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter and sort leaderboard
  const filteredLeaderboard = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const query = searchQuery.toLowerCase().trim();

    return leaderboard
      .filter(entry => {
        // Search filter
        if (query && !entry.name.toLowerCase().includes(query)) {
          return false;
        }

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

        // Music genre filter
        if (musicGenreFilter !== 'all') {
          if (entry.musicGenre !== musicGenreFilter) return false;
        }

        // JKV filter
        if (jkvFilter !== 'all') {
          if (jkvFilter === 'active' && entry.jkvJoinYear === null) return false;
          if (jkvFilter === 'alumni' && entry.bovenkamerJoinYear === null) return false;
        }

        return true;
      })
      .sort((a, b) => getCategoryPoints(b, sortCategory) - getCategoryPoints(a, sortCategory))
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [leaderboard, ageFilter, musicDecadeFilter, musicGenreFilter, jkvFilter, sortCategory, searchQuery]);

  // Count active filters
  const activeFilterCount = [ageFilter, musicDecadeFilter, jkvFilter, musicGenreFilter].filter(f => f !== 'all').length;

  // Clear all filters
  const clearFilters = () => {
    setAgeFilter('all');
    setMusicDecadeFilter('all');
    setJkvFilter('all');
    setMusicGenreFilter('all');
  };

  // Get current user from filtered list
  const currentUserEntry = filteredLeaderboard.find(e => e.email === currentUser?.email);

  // Awards
  const awards = useMemo(() => {
    if (leaderboard.length === 0) return [];

    const categories: { key: SortCategory; emoji: string; title: string; getPoints: (e: LeaderboardEntry) => number }[] = [
      { key: 'quiz', emoji: '🧠', title: 'Beste Quizzer', getPoints: e => e.quizPoints },
      { key: 'prediction', emoji: '🔮', title: 'Voorspellingsmeester', getPoints: e => e.predictionPoints },
      { key: 'registration', emoji: '📝', title: 'Registratie Kampioen', getPoints: e => e.registrationPoints },
      { key: 'game', emoji: '🎮', title: 'Game Legende', getPoints: e => e.gamePoints },
      { key: 'total' as SortCategory, emoji: '🌟', title: 'Bonus Koning', getPoints: e => e.bonusPoints },
    ];

    return categories
      .map(cat => {
        const sorted = [...leaderboard].sort((a, b) => cat.getPoints(b) - cat.getPoints(a));
        const winner = sorted[0];
        const points = cat.getPoints(winner);
        if (points <= 0) return null;
        return {
          ...cat,
          winnerName: getFirstName(winner.name),
          winnerEmail: winner.email,
          points,
        };
      })
      .filter(Boolean) as {
        key: SortCategory;
        emoji: string;
        title: string;
        winnerName: string;
        winnerEmail: string;
        points: number;
      }[];
  }, [leaderboard]);

  // Top 3 for podium
  const top3 = filteredLeaderboard.slice(0, 3);
  const restOfLeaderboard = filteredLeaderboard.slice(3);

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

                {/* Music Genre Filter */}
                <div>
                  <label className="text-xs text-cream/50 uppercase tracking-wide mb-2 block">
                    Muziek Genre
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMusicGenreFilter('all')}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        musicGenreFilter === 'all'
                          ? 'bg-gold text-deep-green border-gold'
                          : 'border-cream/20 text-cream/70 hover:border-gold/50'
                      }`}
                    >
                      Alle
                    </button>
                    {MUSIC_GENRES.map(genre => (
                      <button
                        key={genre.value}
                        onClick={() => setMusicGenreFilter(genre.value)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          musicGenreFilter === genre.value
                            ? 'bg-gold text-deep-green border-gold'
                            : 'border-cream/20 text-cream/70 hover:border-gold/50'
                        }`}
                      >
                        {genre.label}
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

        {/* Awards Section */}
        {awards.length > 0 && (
          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-gold" />
                Awards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {awards.map(award => {
                  const isCurrentUserWinner = award.winnerEmail === currentUser?.email;
                  return (
                    <motion.div
                      key={award.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`text-center p-3 rounded-lg ${
                        isCurrentUserWinner
                          ? 'bg-gold/20 border border-gold/40 ring-1 ring-gold/30'
                          : 'bg-dark-wood/30'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{award.emoji}</span>
                      <p className="text-xs text-cream/50 mb-1">{award.title}</p>
                      <p className={`text-sm font-semibold ${isCurrentUserWinner ? 'text-gold' : 'text-cream'}`}>
                        {award.winnerName}
                      </p>
                      <p className="text-xs text-gold/70">{award.points} pt</p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current User Position (if not in top 5) */}
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
                  <p className="text-gold font-display text-2xl">
                    {getCategoryPoints(currentUserEntry, sortCategory)}
                  </p>
                  <p className="text-cream/50 text-xs">punten</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
          <input
            type="text"
            placeholder="Zoek op naam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-dark-wood/40 border border-gold/20 rounded-lg text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

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
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1 scrollbar-hide">
              {SORT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSortCategory(cat.value)}
                  className={`px-4 py-1.5 text-sm rounded-full border whitespace-nowrap transition-colors flex-shrink-0 ${
                    sortCategory === cat.value
                      ? 'bg-gold text-deep-green border-gold font-semibold'
                      : 'border-cream/20 text-cream/70 hover:border-gold/50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto" />
                <p className="text-cream/50 mt-3 text-sm">Laden...</p>
              </div>
            ) : filteredLeaderboard.length > 0 ? (
              <>
                {/* Podium for Top 3 */}
                {top3.length >= 3 && (
                  <motion.div
                    className="flex items-end justify-center gap-3 sm:gap-4 mb-6 h-52 sm:h-60"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {/* Second Place */}
                    <motion.div
                      className="flex flex-col items-center"
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="text-3xl sm:text-4xl mb-1">🥈</div>
                      <div
                        className={`bg-gradient-to-b from-gray-300 to-gray-500 rounded-t-lg p-2 sm:p-3 w-20 sm:w-28 h-28 sm:h-32 flex flex-col items-center justify-end ${
                          top3[1].email === currentUser?.email ? 'ring-2 ring-gold shadow-lg shadow-gold/20' : ''
                        }`}
                      >
                        <p className="text-dark-wood font-bold text-center text-xs sm:text-sm truncate w-full">
                          {getFirstName(top3[1].name)}
                        </p>
                        <p className="text-dark-wood/80 text-lg sm:text-2xl font-bold">
                          {getCategoryPoints(top3[1], sortCategory)}
                        </p>
                      </div>
                    </motion.div>

                    {/* First Place */}
                    <motion.div
                      className="flex flex-col items-center"
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div
                        className="text-3xl sm:text-4xl mb-1"
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, -10, 10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                      >
                        👑
                      </motion.div>
                      <div
                        className={`bg-gradient-to-b from-yellow-400 to-amber-600 rounded-t-lg p-2 sm:p-3 w-24 sm:w-32 h-36 sm:h-44 flex flex-col items-center justify-end shadow-lg shadow-gold/30 ${
                          top3[0].email === currentUser?.email ? 'ring-2 ring-gold' : ''
                        }`}
                      >
                        <p className="text-dark-wood font-bold text-center text-sm sm:text-lg truncate w-full">
                          {getFirstName(top3[0].name)}
                        </p>
                        <p className="text-dark-wood text-2xl sm:text-3xl font-bold">
                          {getCategoryPoints(top3[0], sortCategory)}
                        </p>
                      </div>
                    </motion.div>

                    {/* Third Place */}
                    <motion.div
                      className="flex flex-col items-center"
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="text-3xl sm:text-4xl mb-1">🥉</div>
                      <div
                        className={`bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-lg p-2 sm:p-3 w-20 sm:w-28 h-20 sm:h-24 flex flex-col items-center justify-end ${
                          top3[2].email === currentUser?.email ? 'ring-2 ring-gold shadow-lg shadow-gold/20' : ''
                        }`}
                      >
                        <p className="text-cream font-bold text-center text-xs sm:text-sm truncate w-full">
                          {getFirstName(top3[2].name)}
                        </p>
                        <p className="text-cream/90 text-lg sm:text-2xl font-bold">
                          {getCategoryPoints(top3[2], sortCategory)}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Leaderboard List (from position 4 if podium shown, otherwise all) */}
                <div className="space-y-2">
                  {(top3.length >= 3 ? restOfLeaderboard : filteredLeaderboard).slice(0, 20).map((entry, index) => {
                    const isCurrentUser = entry.email === currentUser?.email;
                    const currentYear = new Date().getFullYear();
                    const age = entry.birthYear ? currentYear - entry.birthYear : null;
                    const isExpanded = expandedUserId === entry.userId;
                    const displayPoints = getCategoryPoints(entry, sortCategory);

                    const categories = [
                      { label: 'Registratie', points: entry.registrationPoints, max: 300, color: 'text-green-400' },
                      { label: 'Voorspellingen', points: entry.predictionPoints, max: null, color: 'text-blue-400' },
                      { label: 'Quiz', points: entry.quizPoints, max: null, color: 'text-purple-400' },
                      { label: 'Game', points: entry.gamePoints, max: null, color: 'text-orange-400' },
                      { label: 'Bonus', points: entry.bonusPoints, max: 5, color: 'text-yellow-400' },
                    ];

                    return (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`rounded-lg transition-colors ${
                          isCurrentUser
                            ? 'bg-gold/20 border border-gold/30'
                            : 'bg-dark-wood/30 hover:bg-dark-wood/50'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedUserId(isExpanded ? null : entry.userId)}
                          className="w-full flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-dark-wood text-cream/70 border border-gold/10">
                              {entry.rank}
                            </div>
                            <div className="text-left">
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
                          <div className="flex items-center gap-2">
                            <span className="text-gold font-bold">{displayPoints}</span>
                            <ChevronDown className={`w-4 h-4 text-cream/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 pt-1 border-t border-gold/10">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {categories.map(cat => (
                                    <div key={cat.label} className="bg-deep-green/50 rounded p-2">
                                      <p className="text-xs text-cream/50">{cat.label}</p>
                                      <p className={`text-sm font-semibold ${cat.color}`}>
                                        {cat.points}
                                        {cat.max !== null && (
                                          <span className="text-cream/30 font-normal">/{cat.max}</span>
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gold/30 mx-auto mb-3" />
                <p className="text-cream/50 mb-2">Geen deelnemers gevonden</p>
                {(activeFilterCount > 0 || searchQuery) && (
                  <button
                    onClick={() => { clearFilters(); setSearchQuery(''); }}
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
