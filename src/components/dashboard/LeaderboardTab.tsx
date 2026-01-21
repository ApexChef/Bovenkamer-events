'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, Medal, RefreshCw, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  points: number;
}

interface LeaderboardTabProps {
  leaderboard: LeaderboardEntry[];
  totalParticipants: number;
  currentUserName: string;
  currentUserRank: number | string;
  currentUserPoints: number;
  isLoading: boolean;
  onRefresh?: () => Promise<void>;
}

// Helper function to extract first name
const getFirstName = (fullName: string): string => {
  return fullName.split(' ')[0];
};

export function LeaderboardTab({
  leaderboard,
  totalParticipants,
  currentUserName,
  currentUserRank,
  currentUserPoints,
  isLoading,
  onRefresh,
}: LeaderboardTabProps) {
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
  return (
    <div className="space-y-4">
      {/* Your Position - Sticky */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-gold/15 to-gold/5 border-gold/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-gold font-bold text-lg">#{currentUserRank}</span>
                </div>
                <div>
                  <p className="text-cream font-semibold">{getFirstName(currentUserName)}</p>
                  <p className="text-cream/50 text-xs">Jouw positie</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gold font-display text-2xl">{currentUserPoints}</p>
                <p className="text-cream/50 text-xs">punten</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Full Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                Leaderboard
              </CardTitle>
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
            <CardDescription>
              {totalParticipants} deelnemers strijden om de titel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto" />
                <p className="text-cream/50 mt-2 text-sm">Laden...</p>
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, index) => {
                    const isCurrentUser = entry.name === currentUserName;
                    const isTop3 = index < 3;

                    return (
                      <div
                        key={entry.userId}
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
                            <span
                              className={`${
                                isCurrentUser ? 'text-gold font-semibold' : 'text-cream'
                              }`}
                            >
                              {getFirstName(entry.name)}
                            </span>
                            {isCurrentUser && (
                              <span className="text-gold/70 text-xs ml-1">(jij)</span>
                            )}
                          </div>
                        </div>
                        <span className="text-gold font-bold">{entry.points}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Link to full leaderboard */}
                {leaderboard.length > 5 && (
                  <Link
                    href="/leaderboard"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold text-sm font-medium transition-colors"
                  >
                    Bekijk volledige ranking
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gold/30 mx-auto mb-3" />
                <p className="text-cream/50 mb-2">Nog geen andere deelnemers</p>
                <p className="text-cream/30 text-sm">Jij staat op #1! Nodig vrienden uit.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
