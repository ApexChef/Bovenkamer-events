'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRegistrationStore } from '@/lib/store';
import { Button, Card, CardContent } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type GameState = 'joining' | 'lobby' | 'question' | 'answered' | 'results' | 'leaderboard' | 'finished';

interface Question {
  id: string;
  question: string;
  options: string[];
  timeLimit: number;
  category: string;
}

interface PlayerScore {
  name: string;
  score: number;
  position: number;
}

export default function QuizPage() {
  const { formData, isComplete } = useRegistrationStore();
  const [gameState, setGameState] = useState<GameState>('joining');
  const [playerName, setPlayerName] = useState(formData.name || '');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number; correctAnswer: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);
  const [myPosition, setMyPosition] = useState(0);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Join the quiz
  const handleJoin = async () => {
    if (!playerName.trim()) return;

    try {
      // Find active session
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('id')
        .in('status', ['lobby', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !session) {
        setError('Geen actieve quiz gevonden. Wacht tot de quizmaster een sessie start.');
        return;
      }

      setSessionId(session.id);

      // Join as player
      const { data: player, error: playerError } = await supabase
        .from('quiz_players')
        .insert({
          session_id: session.id,
          display_name: playerName.trim(),
          score: 0,
          streak: 0,
        })
        .select('id')
        .single();

      if (playerError) {
        console.error('Error joining:', playerError);
        setError('Kon niet deelnemen. Probeer opnieuw.');
        return;
      }

      setPlayerId(player.id);
      setGameState('lobby');
    } catch (err) {
      console.error('Join error:', err);
      setError('Er ging iets mis. Probeer opnieuw.');
    }
  };

  // Subscribe to quiz updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`quiz:${sessionId}`)
      .on(
        'broadcast',
        { event: 'question' },
        ({ payload }) => {
          setCurrentQuestion(payload.question);
          setTimeLeft(payload.question.timeLimit);
          setSelectedAnswer(null);
          setLastResult(null);
          setGameState('question');
        }
      )
      .on(
        'broadcast',
        { event: 'reveal' },
        ({ payload }) => {
          setLastResult({
            correct: payload.correctAnswer === selectedAnswer,
            points: payload.yourPoints || 0,
            correctAnswer: payload.correctAnswer,
          });
          if (payload.yourPoints) {
            setScore((s) => s + payload.yourPoints);
            if (payload.correctAnswer === selectedAnswer) {
              setStreak((s) => s + 1);
            } else {
              setStreak(0);
            }
          }
          setGameState('results');
        }
      )
      .on(
        'broadcast',
        { event: 'leaderboard' },
        ({ payload }) => {
          setLeaderboard(payload.leaderboard);
          setMyPosition(payload.leaderboard.findIndex((p: PlayerScore) => p.name === playerName) + 1);
          setGameState('leaderboard');
        }
      )
      .on(
        'broadcast',
        { event: 'finished' },
        ({ payload }) => {
          setLeaderboard(payload.finalLeaderboard);
          setGameState('finished');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, selectedAnswer, playerName]);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'question' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Submit answer
  const submitAnswer = useCallback(async (answer: string) => {
    if (selectedAnswer || !playerId || !currentQuestion) return;

    setSelectedAnswer(answer);
    setGameState('answered');

    try {
      const responseTime = (currentQuestion.timeLimit - timeLeft) * 1000;

      await supabase.from('quiz_answers').insert({
        player_id: playerId,
        question_id: currentQuestion.id,
        answer,
        response_time_ms: responseTime,
      });
    } catch (err) {
      console.error('Submit answer error:', err);
    }
  }, [selectedAnswer, playerId, currentQuestion, timeLeft]);

  // Render based on game state
  const renderContent = () => {
    switch (gameState) {
      case 'joining':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-8">
              <span className="stamp text-xs mb-4 inline-block">LIVE QUIZ</span>
              <h1 className="font-display text-3xl text-gold mb-2">
                Bovenkamer Quiz
              </h1>
              <p className="text-cream/60">Voer je naam in om deel te nemen</p>
            </div>

            <Card className="max-w-md mx-auto">
              <CardContent className="py-8 space-y-6">
                <Input
                  label="Jouw naam"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Bijv. Jan"
                />
                {error && (
                  <p className="text-warm-red text-sm">{error}</p>
                )}
                <Button
                  onClick={handleJoin}
                  disabled={!playerName.trim()}
                  className="w-full"
                  size="lg"
                >
                  Deelnemen
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'lobby':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-6" />
            <h2 className="font-display text-2xl text-gold mb-2">
              Welkom, {playerName}!
            </h2>
            <p className="text-cream/60">
              Wacht tot de quizmaster de quiz start...
            </p>
          </motion.div>
        );

      case 'question':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Timer */}
            <div className="text-center">
              <div className={`text-5xl font-bold ${timeLeft <= 5 ? 'text-warm-red animate-pulse' : 'text-gold'}`}>
                {timeLeft}
              </div>
              <p className="text-cream/50 text-sm uppercase tracking-wider">seconden</p>
            </div>

            {/* Question */}
            <Card>
              <CardContent className="py-6">
                <p className="text-gold/60 text-xs uppercase tracking-wider mb-2">
                  {currentQuestion?.category}
                </p>
                <p className="text-cream text-xl font-medium">
                  {currentQuestion?.question}
                </p>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion?.options.map((option, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => submitAnswer(option)}
                  disabled={!!selectedAnswer}
                  className={`p-4 rounded-lg border-2 text-left font-medium transition-all ${
                    selectedAnswer === option
                      ? 'bg-gold border-gold text-dark-wood'
                      : 'bg-dark-wood/50 border-gold/30 text-cream hover:border-gold/60'
                  }`}
                >
                  <span className="text-gold/60 mr-3">{String.fromCharCode(65 + index)}</span>
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 'answered':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display text-xl text-gold mb-2">
              Antwoord ontvangen!
            </h2>
            <p className="text-cream/60">
              Wacht op de andere spelers...
            </p>
          </motion.div>
        );

      case 'results':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            {lastResult?.correct ? (
              <>
                <div className="w-20 h-20 bg-success-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl text-success-green mb-2">
                  Correct!
                </h2>
                <p className="text-gold text-3xl font-bold mb-1">
                  +{lastResult.points} punten
                </p>
                {streak > 1 && (
                  <p className="text-cream/60">
                    🔥 {streak}x streak!
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-warm-red rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl text-warm-red mb-2">
                  Helaas!
                </h2>
                <p className="text-cream/60 mb-2">
                  Het juiste antwoord was:
                </p>
                <p className="text-gold font-medium">
                  {lastResult?.correctAnswer}
                </p>
              </>
            )}
            <p className="text-cream/50 mt-4">
              Totaal: {score} punten
            </p>
          </motion.div>
        );

      case 'leaderboard':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <h2 className="font-display text-2xl text-gold text-center mb-4">
              Tussenstand
            </h2>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((player, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    player.name === playerName
                      ? 'bg-gold/20 border border-gold'
                      : 'bg-dark-wood/50 border border-gold/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-gold text-dark-wood' :
                      index === 1 ? 'bg-gray-300 text-dark-wood' :
                      index === 2 ? 'bg-amber-600 text-cream' :
                      'bg-dark-wood text-cream/60'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-cream font-medium">{player.name}</span>
                  </div>
                  <span className="text-gold font-bold">{player.score}</span>
                </motion.div>
              ))}
            </div>
            {myPosition > 5 && (
              <p className="text-center text-cream/60">
                Jouw positie: #{myPosition}
              </p>
            )}
          </motion.div>
        );

      case 'finished':
        const winner = leaderboard[0];
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="font-display text-3xl text-gold mb-2">
              Quiz Afgelopen!
            </h2>
            {winner && (
              <p className="text-cream text-xl mb-6">
                Winnaar: <span className="text-gold font-bold">{winner.name}</span>
              </p>
            )}
            <div className="space-y-2 max-w-md mx-auto">
              {leaderboard.slice(0, 3).map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.name === playerName ? 'bg-gold/20 border border-gold' : 'bg-dark-wood/50'
                  }`}
                >
                  <span>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {player.name}
                  </span>
                  <span className="text-gold font-bold">{player.score}</span>
                </div>
              ))}
            </div>
            <p className="text-cream/50 mt-6">
              Jouw eindscore: {score} punten
            </p>
          </motion.div>
        );
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </main>
  );
}
