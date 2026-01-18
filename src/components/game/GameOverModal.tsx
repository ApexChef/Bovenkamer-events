'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/game/store';
import { getGameDuration } from '@/lib/game/engine';
import { Button } from '@/components/ui';

export function GameOverModal() {
  const { gameState, lastDropResult, reset, start, setShowLeaderboard, personalBest } = useGameStore();

  if (gameState.status !== 'gameover') return null;

  const duration = getGameDuration(gameState);
  const isNewHighscore = gameState.score > personalBest && personalBest > 0;
  const isBurgerComplete = lastDropResult?.isBunTop;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-wood rounded-xl p-6 max-w-sm w-full text-center border-2 border-gold"
        >
          {/* Title */}
          <div className="mb-4">
            {isBurgerComplete ? (
              <>
                <h2 className="text-3xl font-display text-gold mb-2">
                  BURGER COMPLEET!
                </h2>
                <p className="text-cream">
                  Je hebt een perfecte burger gestapeld!
                </p>
              </>
            ) : isNewHighscore ? (
              <>
                <h2 className="text-3xl font-display text-gold mb-2">
                  NIEUWE HIGHSCORE!
                </h2>
                <p className="text-cream">
                  Je hebt je persoonlijk record verbroken!
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-display text-cream mb-2">
                  GAME OVER
                </h2>
                <p className="text-cream/70">
                  Je stapel is ingestort...
                </p>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="bg-deep-green/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-cream/70 text-sm">Score</p>
                <p className="text-2xl font-bold text-gold">{gameState.score}</p>
              </div>
              <div>
                <p className="text-cream/70 text-sm">Lagen</p>
                <p className="text-2xl font-bold text-cream">{gameState.stack.length}</p>
              </div>
              <div>
                <p className="text-cream/70 text-sm">Max Combo</p>
                <p className="text-xl font-bold text-cream">{gameState.maxCombo}x</p>
              </div>
              <div>
                <p className="text-cream/70 text-sm">Tijd</p>
                <p className="text-xl font-bold text-cream">{duration}s</p>
              </div>
            </div>

            {gameState.perfectDrops > 0 && (
              <div className="mt-3 pt-3 border-t border-cream/20">
                <p className="text-gold text-sm">
                  Perfecte drops: {gameState.perfectDrops}
                </p>
              </div>
            )}
          </div>

          {/* Personal Best */}
          {personalBest > 0 && !isNewHighscore && (
            <p className="text-cream/50 text-sm mb-4">
              Persoonlijk record: {personalBest} punten
            </p>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => {
                reset();
                start();
              }}
              className="w-full"
            >
              Opnieuw Spelen
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowLeaderboard(true)}
              className="w-full"
            >
              Bekijk Ranglijst
            </Button>

            <button
              onClick={reset}
              className="text-cream/50 hover:text-cream text-sm underline"
            >
              Terug naar menu
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
