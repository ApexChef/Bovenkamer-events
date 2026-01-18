'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/game/store';
import { X, Trophy, Medal } from 'lucide-react';

export function Leaderboard() {
  const {
    leaderboard,
    personalBest,
    showLeaderboard,
    setShowLeaderboard,
    fetchLeaderboard,
    isLoading
  } = useGameStore();

  useEffect(() => {
    if (showLeaderboard) {
      fetchLeaderboard();
    }
  }, [showLeaderboard, fetchLeaderboard]);

  if (!showLeaderboard) return null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-cream/50">{rank}</span>;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={() => setShowLeaderboard(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-wood rounded-xl p-6 max-w-sm w-full border-2 border-gold"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display text-gold">Ranglijst</h2>
            <button
              onClick={() => setShowLeaderboard(false)}
              className="text-cream/50 hover:text-cream"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Personal Best */}
          {personalBest > 0 && (
            <div className="bg-gold/20 rounded-lg p-3 mb-4 text-center">
              <p className="text-cream/70 text-sm">Jouw beste score</p>
              <p className="text-2xl font-bold text-gold">{personalBest}</p>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-cream/50">Laden...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-cream/50">Nog geen scores</p>
                <p className="text-cream/30 text-sm mt-1">
                  Wees de eerste!
                </p>
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.user_id + index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    ${index < 3 ? 'bg-gold/10' : 'bg-deep-green/30'}
                  `}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cream font-medium truncate">
                      {entry.user_name}
                    </p>
                    <p className="text-cream/50 text-sm">
                      {entry.layers} lagen
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${index < 3 ? 'text-gold' : 'text-cream'}`}>
                      {entry.score}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowLeaderboard(false)}
            className="w-full mt-4 py-2 text-cream/70 hover:text-cream text-sm"
          >
            Sluiten
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
