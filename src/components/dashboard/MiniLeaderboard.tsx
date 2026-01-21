'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, ChevronRight, Medal, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  points: number;
}

interface MiniLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserName: string;
  currentUserRank: number | string;
  currentUserPoints: number;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

const RANK_MEDALS = ['', '🥇', '🥈', '🥉'];
const RANK_COLORS = ['', 'text-yellow-400', 'text-gray-300', 'text-amber-600'];

// Helper function to extract first name
const getFirstName = (fullName: string): string => {
  return fullName.split(' ')[0];
};

export function MiniLeaderboard({
  leaderboard,
  currentUserName,
  currentUserRank,
  currentUserPoints,
  isLoading = false,
  onRefresh,
}: MiniLeaderboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get top 5
  const topFive = leaderboard.slice(0, 5);

  // Check if current user is in top 5
  const isUserInTop5 = topFive.some(
    (entry) => entry.name.toLowerCase() === currentUserName.toLowerCase()
  );

  if (isLoading) {
    return (
      <Card className="border-gold/30">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-cream/50">
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <span className="text-sm">Ranking laden...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topFive.length === 0) {
    return (
      <Card className="border-gold/30">
        <CardContent className="py-6 text-center">
          <Trophy className="w-8 h-8 text-cream/30 mx-auto mb-2" />
          <p className="text-cream/50 text-sm">Nog geen ranking beschikbaar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-gold/30 hover:border-gold/50 transition-colors overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-gold/10 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-gold" />
              Leaderboard
            </CardTitle>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 text-cream/50 hover:text-gold hover:bg-gold/10 rounded-md transition-colors disabled:opacity-50"
                  aria-label="Ververs ranking"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3 pb-4">
          {/* Top 5 List */}
          <div className="space-y-1">
            {topFive.map((entry, index) => {
              const isCurrentUser = entry.name.toLowerCase() === currentUserName.toLowerCase();
              const rank = entry.rank || index + 1;

              return (
                <div
                  key={entry.userId || index}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isCurrentUser
                      ? 'bg-gold/20 border border-gold/30'
                      : 'hover:bg-cream/5'
                    }
                  `}
                >
                  {/* Rank */}
                  <div className="w-6 text-center">
                    {rank <= 3 ? (
                      <span className={`text-lg ${RANK_COLORS[rank]}`}>
                        {RANK_MEDALS[rank]}
                      </span>
                    ) : (
                      <span className="text-sm text-cream/50 font-medium">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <span
                    className={`flex-1 text-sm truncate ${
                      isCurrentUser ? 'text-gold font-medium' : 'text-cream/80'
                    }`}
                  >
                    {getFirstName(entry.name)}
                    {isCurrentUser && (
                      <span className="text-gold/60 ml-1">(jij)</span>
                    )}
                  </span>

                  {/* Points */}
                  <span
                    className={`text-sm font-medium ${
                      isCurrentUser ? 'text-gold' : 'text-cream/60'
                    }`}
                  >
                    {entry.points}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current user position if not in top 5 */}
          {!isUserInTop5 && currentUserRank !== '-' && (
            <>
              <div className="flex items-center gap-2 my-2 px-3">
                <div className="flex-1 border-t border-dashed border-cream/20" />
                <span className="text-xs text-cream/30">...</span>
                <div className="flex-1 border-t border-dashed border-cream/20" />
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gold/10 border border-gold/20">
                <div className="w-6 text-center">
                  <span className="text-sm text-gold font-medium">
                    {currentUserRank}
                  </span>
                </div>
                <span className="flex-1 text-sm text-gold font-medium truncate">
                  {getFirstName(currentUserName)}
                  <span className="text-gold/60 ml-1">(jij)</span>
                </span>
                <span className="text-sm font-medium text-gold">
                  {currentUserPoints}
                </span>
              </div>
            </>
          )}

          {/* CTA Button */}
          <Link
            href="/leaderboard"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold text-sm font-medium transition-colors"
          >
            <Medal className="w-4 h-4" />
            Bekijk volledige ranking
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
