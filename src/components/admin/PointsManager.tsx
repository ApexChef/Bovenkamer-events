'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User } from '@/types';

interface PointsHistoryEntry {
  id: string;
  source: 'registration' | 'prediction' | 'quiz' | 'game' | 'bonus';
  points: number;
  description?: string;
  createdAt: string;
}

interface PointsManagerProps {
  user: User;
  pointsHistory: PointsHistoryEntry[];
  onPointsUpdate: (points: number, reason: string) => Promise<void>;
}

export function PointsManager({ user, pointsHistory, onPointsUpdate }: PointsManagerProps) {
  const [pointsAmount, setPointsAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleQuickAdd = (amount: number) => {
    setPointsAmount((prev) => prev + amount);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (pointsAmount === 0) {
      setError('Voer een puntenaantal in (positief of negatief)');
      return;
    }

    if (!reason.trim()) {
      setError('Reden is verplicht');
      return;
    }

    setIsLoading(true);

    try {
      await onPointsUpdate(pointsAmount, reason.trim());
      setSuccessMessage(`${pointsAmount > 0 ? '+' : ''}${pointsAmount} punten ${pointsAmount > 0 ? 'toegevoegd' : 'verwijderd'}`);
      setPointsAmount(0);
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij wijzigen punten');
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceLabel = (source: PointsHistoryEntry['source']) => {
    switch (source) {
      case 'registration':
        return 'Registratie';
      case 'prediction':
        return 'Voorspelling';
      case 'quiz':
        return 'Quiz';
      case 'game':
        return 'Spel';
      case 'bonus':
        return 'Bonus';
      default:
        return source;
    }
  };

  const getSourceColor = (source: PointsHistoryEntry['source']) => {
    switch (source) {
      case 'registration':
        return 'text-blue-400';
      case 'prediction':
        return 'text-purple-400';
      case 'quiz':
        return 'text-gold';
      case 'game':
        return 'text-green-400';
      case 'bonus':
        return 'text-cream/70';
      default:
        return 'text-cream/70';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Points Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gold mb-3">Huidige punten</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-deep-green/30 rounded-lg border border-gold/10">
            <div className="text-cream/50 text-xs mb-1">Totaal</div>
            <div className="text-cream font-bold text-2xl">{user.total_points}</div>
          </div>
          <div className="p-3 bg-deep-green/30 rounded-lg border border-gold/10">
            <div className="text-cream/50 text-xs mb-1">Registratie</div>
            <div className="text-cream font-semibold">{user.registration_points}</div>
          </div>
          <div className="p-3 bg-deep-green/30 rounded-lg border border-gold/10">
            <div className="text-cream/50 text-xs mb-1">Voorspellingen</div>
            <div className="text-cream font-semibold">{user.prediction_points}</div>
          </div>
          <div className="p-3 bg-deep-green/30 rounded-lg border border-gold/10">
            <div className="text-cream/50 text-xs mb-1">Quiz</div>
            <div className="text-cream font-semibold">{user.quiz_points}</div>
          </div>
          <div className="p-3 bg-deep-green/30 rounded-lg border border-gold/10">
            <div className="text-cream/50 text-xs mb-1">Spel</div>
            <div className="text-cream font-semibold">{user.game_points}</div>
          </div>
        </div>
      </div>

      {/* Add/Subtract Points Form */}
      <div>
        <h4 className="text-sm font-semibold text-gold mb-3">Punten aanpassen</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Add Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAdd(-50)}
              disabled={isLoading}
            >
              -50
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAdd(-10)}
              disabled={isLoading}
            >
              -10
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAdd(-5)}
              disabled={isLoading}
            >
              -5
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAdd(5)}
              disabled={isLoading}
            >
              +5
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAdd(10)}
              disabled={isLoading}
            >
              +10
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAdd(50)}
              disabled={isLoading}
            >
              +50
            </Button>
          </div>

          {/* Custom Amount Input */}
          <Input
            type="number"
            label="Puntenaantal"
            value={pointsAmount}
            onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
            placeholder="0"
            disabled={isLoading}
            hint="Gebruik negatieve getallen om punten af te trekken"
          />

          {/* Reason Input */}
          <Input
            label="Reden"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bijv. Bonus voor goede quiz prestatie"
            disabled={isLoading}
            required
          />

          {error && (
            <div className="p-3 bg-warm-red/20 border border-warm-red rounded-lg">
              <p className="text-sm text-warm-red">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-success-green/20 border border-success-green rounded-lg">
              <p className="text-sm text-success-green">{successMessage}</p>
            </div>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full">
            Punten bijwerken
          </Button>
        </form>
      </div>

      {/* Points History */}
      <div>
        <h4 className="text-sm font-semibold text-gold mb-3">Puntengeschiedenis (laatste 10)</h4>
        {pointsHistory.length === 0 ? (
          <div className="p-4 text-center text-cream/50 text-sm bg-deep-green/20 rounded-lg border border-gold/10">
            Nog geen puntengeschiedenis
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {pointsHistory.slice(0, 10).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-deep-green/20 rounded-lg border border-gold/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${getSourceColor(entry.source)}`}>
                          {getSourceLabel(entry.source)}
                        </span>
                        <span className={`text-sm font-bold ${entry.points > 0 ? 'text-success-green' : 'text-warm-red'}`}>
                          {entry.points > 0 ? '+' : ''}{entry.points}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-cream/70 text-xs">{entry.description}</p>
                      )}
                      <p className="text-cream/50 text-xs mt-1">
                        {new Date(entry.createdAt).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
