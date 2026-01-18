'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button, Card, CardContent } from '@/components/ui';

interface LeaderboardEntry {
  userId: string;
  name: string;
  totalPoints: number;
  predictionPoints: number;
  registrationPoints: number;
  quizPoints: number;
  previousPosition?: number;
  breakdown?: Record<string, number>;
}

interface LiveStats {
  resultsEntered: number;
  totalFields: number;
  lastUpdate: string;
}

const POLL_INTERVAL = 5000; // 5 seconds

export default function LiveLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [previousLeaderboard, setPreviousLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);
  const [lastLeader, setLastLeader] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard/live');
      if (response.ok) {
        const data = await response.json();

        // Store previous positions before updating
        setPreviousLeaderboard(leaderboard);

        // Add previous positions to new data
        const newLeaderboard = data.leaderboard.map((entry: LeaderboardEntry, index: number) => {
          const prevEntry = leaderboard.find(e => e.userId === entry.userId);
          const prevIndex = prevEntry ? leaderboard.indexOf(prevEntry) : -1;
          return {
            ...entry,
            previousPosition: prevIndex >= 0 ? prevIndex : index,
          };
        });

        setLeaderboard(newLeaderboard);
        setStats(data.stats);

        // Check if leader changed
        if (newLeaderboard.length > 0) {
          const newLeader = newLeaderboard[0].userId;
          if (lastLeader && newLeader !== lastLeader) {
            // New leader! Celebrate!
            triggerCelebration();
          }
          setLastLeader(newLeader);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [leaderboard, lastLeader]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(fetchLeaderboard, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const triggerCelebration = () => {
    // Fire confetti from both sides
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.2 } });
    fire(0.2, { spread: 60, origin: { x: 0.2 } });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.2 } });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, origin: { x: 0.2 } });
    fire(0.1, { spread: 120, startVelocity: 45, origin: { x: 0.2 } });

    fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.8 } });
    fire(0.2, { spread: 60, origin: { x: 0.8 } });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.8 } });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, origin: { x: 0.8 } });
    fire(0.1, { spread: 120, startVelocity: 45, origin: { x: 0.8 } });
  };

  const getPositionChange = (entry: LeaderboardEntry, currentIndex: number) => {
    if (entry.previousPosition === undefined) return 0;
    return entry.previousPosition - currentIndex;
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${position + 1}`;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 0: return 'from-yellow-400 to-amber-600';
      case 1: return 'from-gray-300 to-gray-500';
      case 2: return 'from-amber-600 to-amber-800';
      default: return 'from-gold/20 to-gold/10';
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold text-xl">Laden...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl md:text-6xl font-bold text-gold mb-2">
            🏆 Live Ranglijst
          </h1>
          <p className="text-cream/60 text-lg">Bovenkamer Winterproef 2026</p>
          {stats && (
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <span className="bg-gold/20 text-gold px-3 py-1 rounded-full">
                {stats.resultsEntered}/{stats.totalFields} uitkomsten
              </span>
              <span className="text-cream/40">
                Update: {new Date(stats.lastUpdate).toLocaleTimeString('nl-NL')}
              </span>
            </div>
          )}
        </motion.div>

        {/* Podium for top 3 */}
        {leaderboard.length >= 3 && (
          <motion.div
            className="flex items-end justify-center gap-4 mb-12 h-64"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Second Place */}
            <motion.div
              className="flex flex-col items-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-4xl mb-2">🥈</div>
              <div className="bg-gradient-to-b from-gray-300 to-gray-500 rounded-t-lg p-4 w-28 h-32 flex flex-col items-center justify-end">
                <p className="text-dark-wood font-bold text-center truncate w-full">{leaderboard[1].name}</p>
                <p className="text-dark-wood/80 text-2xl font-bold">{leaderboard[1].totalPoints}</p>
              </div>
            </motion.div>

            {/* First Place */}
            <motion.div
              className="flex flex-col items-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="text-5xl mb-2"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                👑
              </motion.div>
              <div className="bg-gradient-to-b from-yellow-400 to-amber-600 rounded-t-lg p-4 w-32 h-44 flex flex-col items-center justify-end shadow-lg shadow-gold/30">
                <p className="text-dark-wood font-bold text-center truncate w-full text-lg">{leaderboard[0].name}</p>
                <motion.p
                  className="text-dark-wood text-3xl font-bold"
                  key={leaderboard[0].totalPoints}
                  initial={{ scale: 1.5, color: '#fff' }}
                  animate={{ scale: 1, color: '#1B4332' }}
                  transition={{ duration: 0.3 }}
                >
                  {leaderboard[0].totalPoints}
                </motion.p>
              </div>
            </motion.div>

            {/* Third Place */}
            <motion.div
              className="flex flex-col items-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-4xl mb-2">🥉</div>
              <div className="bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-lg p-4 w-28 h-24 flex flex-col items-center justify-end">
                <p className="text-cream font-bold text-center truncate w-full">{leaderboard[2].name}</p>
                <p className="text-cream/90 text-2xl font-bold">{leaderboard[2].totalPoints}</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardContent className="p-0">
            <AnimatePresence mode="popLayout">
              {leaderboard.map((entry, index) => {
                const positionChange = getPositionChange(entry, index);

                return (
                  <motion.div
                    key={entry.userId}
                    layout
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{
                      layout: { type: "spring", stiffness: 300, damping: 30 },
                      duration: 0.3,
                      delay: index * 0.05
                    }}
                    className={`
                      border-b border-gold/10 last:border-0
                      ${index < 3 ? 'bg-gradient-to-r ' + getPositionColor(index) : ''}
                      ${showBreakdown === entry.userId ? 'bg-dark-wood/50' : 'hover:bg-dark-wood/30'}
                      cursor-pointer transition-colors
                    `}
                    onClick={() => setShowBreakdown(showBreakdown === entry.userId ? null : entry.userId)}
                  >
                    <div className="flex items-center p-4">
                      {/* Position */}
                      <div className="w-12 text-center">
                        <span className={`text-2xl ${index < 3 ? '' : 'text-cream/50'}`}>
                          {getPositionIcon(index)}
                        </span>
                      </div>

                      {/* Position change indicator */}
                      <div className="w-8 text-center">
                        {positionChange > 0 && (
                          <motion.span
                            className="text-success-green text-sm"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                          >
                            ▲{positionChange}
                          </motion.span>
                        )}
                        {positionChange < 0 && (
                          <motion.span
                            className="text-warm-red text-sm"
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                          >
                            ▼{Math.abs(positionChange)}
                          </motion.span>
                        )}
                        {positionChange === 0 && previousLeaderboard.length > 0 && (
                          <span className="text-cream/30 text-sm">–</span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 ml-4">
                        <p className={`font-semibold ${index < 3 ? 'text-dark-wood' : 'text-cream'}`}>
                          {entry.name}
                        </p>
                        <p className={`text-xs ${index < 3 ? 'text-dark-wood/60' : 'text-cream/40'}`}>
                          Voorspellingen: {entry.predictionPoints}p • Quiz: {entry.quizPoints}p
                        </p>
                      </div>

                      {/* Score */}
                      <motion.div
                        className="text-right"
                        key={entry.totalPoints}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <p className={`text-3xl font-bold ${index < 3 ? 'text-dark-wood' : 'text-gold'}`}>
                          {entry.totalPoints}
                        </p>
                        <p className={`text-xs ${index < 3 ? 'text-dark-wood/60' : 'text-cream/40'}`}>
                          punten
                        </p>
                      </motion.div>
                    </div>

                    {/* Breakdown */}
                    <AnimatePresence>
                      {showBreakdown === entry.userId && entry.breakdown && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gold/10 overflow-hidden"
                        >
                          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {Object.entries(entry.breakdown).map(([key, points]) => (
                              <div
                                key={key}
                                className={`p-2 rounded ${points > 0 ? 'bg-success-green/20' : 'bg-dark-wood/30'}`}
                              >
                                <p className="text-cream/60 text-xs capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className={points > 0 ? 'text-success-green font-bold' : 'text-cream/40'}>
                                  +{points}
                                </p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Legend */}
        <motion.div
          className="mt-8 text-center text-cream/40 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>Klik op een naam om de puntenverdeling te zien</p>
          <p className="mt-2">
            <span className="text-success-green">▲</span> Gestegen •
            <span className="text-warm-red ml-2">▼</span> Gedaald
          </p>
        </motion.div>

        {/* Back button */}
        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button variant="ghost">← Terug naar dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
