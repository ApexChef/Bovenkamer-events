'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Question {
  id: string;
  question: string;
  correct_answer: string;
  options: string[];
  time_limit: number;
  category: string;
  point_value: number;
}

interface Player {
  id: string;
  display_name: string;
  score: number;
  streak: number;
}

type SessionStatus = 'idle' | 'lobby' | 'active' | 'finished';

export default function QuizMasterPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showingResults, setShowingResults] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data) {
        setQuestions(data);
      }
    };

    fetchQuestions();
  }, []);

  // Fetch players callback
  const fetchPlayers = useCallback(async () => {
    if (!sessionId) return;

    const { data } = await supabase
      .from('quiz_players')
      .select('*')
      .eq('session_id', sessionId)
      .order('score', { ascending: false });

    if (data) {
      setPlayers(data);
    }
  }, [sessionId]);

  // Subscribe to player joins and answers
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to player updates
    const playersChannel = supabase
      .channel(`players:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_players',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    // Initial fetch
    fetchPlayers();

    return () => {
      supabase.removeChannel(playersChannel);
    };
  }, [sessionId, fetchPlayers]);

  // Create a new quiz session
  const createSession = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert({
          status: 'lobby',
          current_question_index: 0,
          question_ids: questions.map((q) => q.id),
        })
        .select('id')
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setSessionStatus('lobby');
    } catch (err) {
      console.error('Error creating session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start the quiz
  const startQuiz = async () => {
    if (!sessionId) return;

    await supabase
      .from('quiz_sessions')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', sessionId);

    setSessionStatus('active');
    showQuestion(0);
  };

  // Show a question
  const showQuestion = useCallback(async (index: number) => {
    if (!sessionId || index >= questions.length) return;

    setCurrentQuestionIndex(index);
    setShowingResults(false);
    setAnsweredCount(0);

    const question = questions[index];

    // Broadcast question to all players
    await supabase.channel(`quiz:${sessionId}`).send({
      type: 'broadcast',
      event: 'question',
      payload: {
        question: {
          id: question.id,
          question: question.question,
          options: question.options,
          timeLimit: question.time_limit,
          category: question.category,
        },
      },
    });

    // Update session
    await supabase
      .from('quiz_sessions')
      .update({ current_question_index: index })
      .eq('id', sessionId);
  }, [sessionId, questions]);

  // Reveal answer
  const revealAnswer = async () => {
    if (!sessionId) return;

    const question = questions[currentQuestionIndex];
    setShowingResults(true);

    // Calculate points for each player
    const { data: answers } = await supabase
      .from('quiz_answers')
      .select('*, quiz_players(id, display_name, score, streak)')
      .eq('question_id', question.id);

    // Update player scores
    for (const answer of answers || []) {
      const isCorrect = answer.answer === question.correct_answer;
      let points = 0;

      if (isCorrect) {
        // Base points + speed bonus
        const speedBonus = Math.max(0, 500 - Math.floor(answer.response_time_ms / 20));
        const streakBonus = (answer.quiz_players?.streak || 0) >= 2 ? 200 : 0;
        points = question.point_value + speedBonus + streakBonus;

        await supabase
          .from('quiz_players')
          .update({
            score: (answer.quiz_players?.score || 0) + points,
            streak: (answer.quiz_players?.streak || 0) + 1,
          })
          .eq('id', answer.player_id);
      } else {
        await supabase
          .from('quiz_players')
          .update({ streak: 0 })
          .eq('id', answer.player_id);
      }

      // Update answer record
      await supabase
        .from('quiz_answers')
        .update({
          is_correct: isCorrect,
          points_earned: points,
        })
        .eq('id', answer.id);
    }

    // Broadcast reveal
    await supabase.channel(`quiz:${sessionId}`).send({
      type: 'broadcast',
      event: 'reveal',
      payload: {
        correctAnswer: question.correct_answer,
      },
    });

    // Refresh players
    await fetchPlayers();
  };

  // Show leaderboard
  const showLeaderboard = async () => {
    if (!sessionId) return;

    await supabase.channel(`quiz:${sessionId}`).send({
      type: 'broadcast',
      event: 'leaderboard',
      payload: {
        leaderboard: players.map((p, i) => ({
          name: p.display_name,
          score: p.score,
          position: i + 1,
        })),
      },
    });
  };

  // Next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      showQuestion(currentQuestionIndex + 1);
    }
  };

  // End quiz
  const endQuiz = async () => {
    if (!sessionId) return;

    await supabase
      .from('quiz_sessions')
      .update({ status: 'finished', ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    await supabase.channel(`quiz:${sessionId}`).send({
      type: 'broadcast',
      event: 'finished',
      payload: {
        finalLeaderboard: players.map((p, i) => ({
          name: p.display_name,
          score: p.score,
          position: i + 1,
        })),
      },
    });

    setSessionStatus('finished');
  };

  const currentQuestion = questions[currentQuestionIndex];
  const quizUrl = typeof window !== 'undefined' ? `${window.location.origin}/quiz` : '';

  return (
    <main className="min-h-screen py-8 px-4 bg-deep-green">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-gold mb-2">
            Quizmaster Control
          </h1>
          <p className="text-cream/60">Bovenkamer Winterproef Quiz</p>
        </div>

        {sessionStatus === 'idle' && (
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12">
                <h2 className="font-display text-2xl text-gold mb-4">
                  Start een nieuwe Quiz
                </h2>
                <p className="text-cream/60 mb-6">
                  {questions.length} vragen geladen
                </p>
                <Button
                  size="lg"
                  onClick={createSession}
                  isLoading={isLoading}
                  disabled={questions.length === 0}
                >
                  Nieuwe Sessie Starten
                </Button>
                {questions.length === 0 && (
                  <p className="text-warm-red text-sm mt-4">
                    Geen actieve quiz-vragen gevonden in de database.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {sessionStatus === 'lobby' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR/Link */}
            <Card>
              <CardHeader>
                <CardTitle>Deelname Link</CardTitle>
                <CardDescription>Deel deze link met de spelers</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  {/* QR Code placeholder - in production use a QR library */}
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                    QR Code
                  </div>
                </div>
                <p className="text-gold font-mono text-lg break-all">{quizUrl}</p>
              </CardContent>
            </Card>

            {/* Players */}
            <Card>
              <CardHeader>
                <CardTitle>Deelnemers ({players.length})</CardTitle>
                <CardDescription>Wacht tot iedereen is gejoind</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {players.map((player) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2 bg-dark-wood/30 rounded"
                    >
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <span className="text-gold font-bold">
                          {player.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-cream">{player.display_name}</span>
                    </motion.div>
                  ))}
                  {players.length === 0 && (
                    <p className="text-cream/50 text-center py-4">
                      Wacht op spelers...
                    </p>
                  )}
                </div>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={startQuiz}
                  disabled={players.length === 0}
                >
                  Start Quiz ({questions.length} vragen)
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {sessionStatus === 'active' && currentQuestion && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Question Display */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardDescription>
                        Vraag {currentQuestionIndex + 1} van {questions.length}
                      </CardDescription>
                      <CardTitle className="text-2xl">{currentQuestion.category}</CardTitle>
                    </div>
                    <span className="text-gold text-xl font-bold">
                      {currentQuestion.point_value} pts
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-cream text-2xl mb-8">{currentQuestion.question}</p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          showingResults && option === currentQuestion.correct_answer
                            ? 'bg-success-green/20 border-success-green'
                            : 'bg-dark-wood/30 border-gold/20'
                        }`}
                      >
                        <span className="text-gold font-bold mr-2">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-cream">{option}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    {!showingResults ? (
                      <Button size="lg" onClick={revealAnswer} className="flex-1">
                        Toon Antwoord
                      </Button>
                    ) : (
                      <>
                        <Button size="lg" onClick={showLeaderboard} variant="secondary" className="flex-1">
                          Toon Tussenstand
                        </Button>
                        {currentQuestionIndex < questions.length - 1 ? (
                          <Button size="lg" onClick={nextQuestion} className="flex-1">
                            Volgende Vraag
                          </Button>
                        ) : (
                          <Button size="lg" onClick={endQuiz} className="flex-1">
                            Eindig Quiz
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Scorebord</CardTitle>
                <CardDescription>{answeredCount}/{players.length} beantwoord</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.slice(0, 10).map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded bg-dark-wood/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-gold text-dark-wood' :
                          index === 1 ? 'bg-gray-300 text-dark-wood' :
                          index === 2 ? 'bg-amber-600 text-cream' :
                          'bg-dark-wood text-cream/60'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-cream text-sm">{player.display_name}</span>
                      </div>
                      <span className="text-gold font-bold">{player.score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {sessionStatus === 'finished' && (
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="font-display text-3xl text-gold mb-4">
                Quiz Afgelopen!
              </h2>
              {players[0] && (
                <p className="text-cream text-xl mb-8">
                  Winnaar: <span className="text-gold font-bold">{players[0].display_name}</span>
                  <br />
                  met {players[0].score} punten
                </p>
              )}
              <Button onClick={() => setSessionStatus('idle')}>
                Nieuwe Quiz Starten
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
