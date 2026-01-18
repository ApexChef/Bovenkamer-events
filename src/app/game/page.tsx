'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { GameCanvas, GameOverModal, Leaderboard } from '@/components/game';
import { useGameStore } from '@/lib/game/store';
import { AuthGuard } from '@/components/AuthGuard';
import { Button } from '@/components/ui';

function GameContent() {
  const {
    gameState,
    initGame,
    fetchLeaderboard,
    setShowLeaderboard,
    personalBest
  } = useGameStore();

  useEffect(() => {
    initGame();
    fetchLeaderboard();
  }, [initGame, fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-deep-green">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-cream hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Terug</span>
        </Link>

        <h1 className="text-xl font-display text-gold">Burger Stack</h1>

        <button
          onClick={() => setShowLeaderboard(true)}
          className="flex items-center gap-2 text-cream hover:text-gold transition-colors"
        >
          <Trophy className="w-5 h-5" />
        </button>
      </header>

      {/* Game Container */}
      <main className="flex flex-col items-center px-4 pb-8">
        {/* Instructions (only shown when idle) */}
        {gameState.status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center max-w-sm"
          >
            <div className="bg-dark-wood/50 rounded-lg p-4 mb-4">
              <h2 className="text-lg font-display text-gold mb-2">Hoe te spelen</h2>
              <ul className="text-cream/80 text-sm space-y-1 text-left">
                <li>- Tik om ingrediënten te laten vallen</li>
                <li>- Stapel zo hoog mogelijk</li>
                <li>- Perfect droppen = combo bonus!</li>
                <li>- Sluit af met een broodje voor extra punten</li>
              </ul>
            </div>

            {personalBest > 0 && (
              <p className="text-cream/50 text-sm">
                Jouw beste score: <span className="text-gold">{personalBest}</span>
              </p>
            )}
          </motion.div>
        )}

        {/* Game Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <GameCanvas />

          {/* Pause button (only when playing) */}
          {gameState.status === 'playing' && (
            <button
              onClick={() => useGameStore.getState().pause()}
              className="absolute top-2 right-2 bg-dark-wood/80 text-cream px-3 py-1 rounded text-sm hover:bg-dark-wood"
            >
              Pauze
            </button>
          )}
        </motion.div>

        {/* Controls hint */}
        {gameState.status === 'playing' && (
          <p className="mt-4 text-cream/50 text-sm">
            Tik of druk op spatie om te droppen
          </p>
        )}

        {/* Quick stats during game */}
        {gameState.status === 'playing' && gameState.combo > 2 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-2 bg-gold/20 px-4 py-2 rounded-full"
          >
            <span className="text-gold font-bold">
              {gameState.combo}x COMBO!
            </span>
          </motion.div>
        )}
      </main>

      {/* Modals */}
      <GameOverModal />
      <Leaderboard />
    </div>
  );
}

export default function GamePage() {
  return (
    <AuthGuard>
      <GameContent />
    </AuthGuard>
  );
}
