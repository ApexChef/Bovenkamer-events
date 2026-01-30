'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ExpectedParticipant } from '@/types';
import Link from 'next/link';
import { Trophy, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

export default function AdminParticipantsPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminParticipantsContent />
    </AuthGuard>
  );
}

interface PointsEntry {
  rank: number;
  userId: string;
  name: string;
  points: number;
  registrationPoints: number;
  predictionPoints: number;
  quizPoints: number;
  gamePoints: number;
  bonusPoints: number;
}

const POINT_CATEGORIES = [
  { key: 'registrationPoints' as const, label: 'Registratie', max: 300, color: 'text-green-400', bgColor: 'bg-green-400' },
  { key: 'predictionPoints' as const, label: 'Voorspellingen', max: null, color: 'text-blue-400', bgColor: 'bg-blue-400' },
  { key: 'quizPoints' as const, label: 'Quiz', max: null, color: 'text-purple-400', bgColor: 'bg-purple-400' },
  { key: 'gamePoints' as const, label: 'Game', max: null, color: 'text-orange-400', bgColor: 'bg-orange-400' },
  { key: 'bonusPoints' as const, label: 'Bonus', max: 5, color: 'text-yellow-400', bgColor: 'bg-yellow-400' },
];

function AdminParticipantsContent() {
  const [participants, setParticipants] = useState<ExpectedParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Points overview
  const [pointsData, setPointsData] = useState<PointsEntry[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Generate assignments
  const [isGeneratingAssignments, setIsGeneratingAssignments] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add participant form
  const [newName, setNewName] = useState('');
  const [newEmailHint, setNewEmailHint] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchParticipants();
    fetchPointsOverview();
  }, []);

  const fetchParticipants = async () => {
    try {
      const response = await fetch('/api/admin/participants');
      const data = await response.json();

      if (response.ok) {
        setParticipants(data.participants || []);
      } else {
        setError(data.message || 'Kon deelnemers niet laden');
      }
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      setError('Netwerkfout bij ophalen deelnemers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPointsOverview = async () => {
    try {
      const response = await fetch('/api/leaderboard/full');
      if (response.ok) {
        const data = await response.json();
        setPointsData(
          (data.leaderboard || []).map((e: any) => ({
            rank: e.rank,
            userId: e.userId,
            name: e.name,
            points: e.points,
            registrationPoints: e.registrationPoints || 0,
            predictionPoints: e.predictionPoints || 0,
            quizPoints: e.quizPoints || 0,
            gamePoints: e.gamePoints || 0,
            bonusPoints: e.bonusPoints || 0,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch points overview:', err);
    } finally {
      setIsLoadingPoints(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!newName.trim()) {
      setAddError('Naam is verplicht');
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email_hint: newEmailHint.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setParticipants([...participants, data.participant]);
        setNewName('');
        setNewEmailHint('');
      } else {
        setAddError(data.message || 'Kon deelnemer niet toevoegen');
      }
    } catch (err) {
      console.error('Failed to add participant:', err);
      setAddError('Netwerkfout bij toevoegen deelnemer');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteParticipant = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze deelnemer wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/participants/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setParticipants(participants.filter(p => p.id !== id));
      } else {
        const data = await response.json();
        alert(data.message || 'Kon deelnemer niet verwijderen');
      }
    } catch (err) {
      console.error('Failed to delete participant:', err);
      alert('Netwerkfout bij verwijderen deelnemer');
    }
  };

  const handleGenerateAssignments = async () => {
    setIsGeneratingAssignments(true);
    setAssignmentMessage(null);

    try {
      const response = await fetch('/api/admin/assignments/generate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Kon toewijzingen niet genereren');

      setAssignmentMessage({
        type: 'success',
        text: `${data.generated} toewijzingen gegenereerd${data.failed > 0 ? ` (${data.failed} mislukt)` : ''}`,
      });
    } catch (err) {
      console.error('Error generating assignments:', err);
      setAssignmentMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Kon toewijzingen niet genereren',
      });
    } finally {
      setIsGeneratingAssignments(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-green p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
            &larr; Terug naar admin dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif text-gold mb-2">Verwachte Deelnemers</h1>
              <p className="text-cream/70">
                Beheer de lijst van verwachte deelnemers voor het evenement
              </p>
            </div>
            <Button
              onClick={handleGenerateAssignments}
              disabled={isGeneratingAssignments}
              variant="ghost"
            >
              {isGeneratingAssignments ? 'Genereren...' : 'Genereer Toewijzingen'}
            </Button>
          </div>
          {assignmentMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-lg ${
                assignmentMessage.type === 'success'
                  ? 'bg-success-green/20 text-success-green'
                  : 'bg-warm-red/20 text-warm-red'
              }`}
            >
              {assignmentMessage.text}
            </motion.div>
          )}
        </div>

        {/* Add Participant Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Nieuwe deelnemer toevoegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddParticipant} className="space-y-4">
              {addError && (
                <div className="p-3 bg-warm-red/20 border border-warm-red rounded-lg">
                  <p className="text-sm text-warm-red">{addError}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Naam"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Volledige naam"
                  disabled={isAdding}
                  required
                />

                <Input
                  label="Email hint (optioneel)"
                  value={newEmailHint}
                  onChange={(e) => setNewEmailHint(e.target.value)}
                  placeholder="j.***@gmail.com"
                  disabled={isAdding}
                  hint="Eerste letter + domein voor herkenning"
                />
              </div>

              <Button type="submit" isLoading={isAdding}>
                Deelnemer toevoegen
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Participants List */}
        <Card>
          <CardHeader>
            <CardTitle>Deelnemers lijst ({participants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                <p className="text-cream/70 text-sm">Laden...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-warm-red/20 border border-warm-red rounded-lg">
                <p className="text-warm-red">{error}</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-8 text-cream/50">
                <p>Nog geen deelnemers toegevoegd</p>
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      p-4 rounded-lg border
                      ${participant.is_registered
                        ? 'bg-success-green/10 border-success-green/30'
                        : 'bg-dark-wood/30 border-gold/20'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-cream font-semibold">
                            {participant.name}
                          </h3>
                          {participant.is_registered && (
                            <span className="px-2 py-1 bg-success-green/20 text-success-green text-xs rounded-full">
                              Geregistreerd
                            </span>
                          )}
                        </div>
                        {participant.email_hint && (
                          <p className="text-cream/50 text-sm mt-1">
                            {participant.email_hint}
                          </p>
                        )}
                      </div>

                      {!participant.is_registered && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteParticipant(participant.id)}
                          className="text-warm-red hover:bg-warm-red/10"
                        >
                          Verwijder
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              Punten Overzicht ({pointsData.length} gebruikers)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPoints ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                <p className="text-cream/70 text-sm">Laden...</p>
              </div>
            ) : pointsData.length === 0 ? (
              <div className="text-center py-8 text-cream/50">
                <p>Nog geen puntendata beschikbaar</p>
              </div>
            ) : (
              <>
                {/* Category legend */}
                <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gold/10">
                  {POINT_CATEGORIES.map(cat => (
                    <div key={cat.key} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${cat.bgColor}`} />
                      <span className="text-xs text-cream/60">{cat.label}{cat.max !== null && ` (max ${cat.max})`}</span>
                    </div>
                  ))}
                </div>

                {/* User rows */}
                <div className="space-y-1">
                  {pointsData.map((entry, index) => {
                    const isExpanded = expandedUserId === entry.userId;

                    return (
                      <div
                        key={entry.userId}
                        className="rounded-lg bg-dark-wood/30 hover:bg-dark-wood/50 transition-colors"
                      >
                        <button
                          onClick={() => setExpandedUserId(isExpanded ? null : entry.userId)}
                          className="w-full flex items-center gap-3 p-3 text-left"
                        >
                          {/* Rank */}
                          <span className="w-8 text-center text-cream/40 text-sm font-mono">
                            #{entry.rank}
                          </span>

                          {/* Name */}
                          <span className="flex-1 text-cream font-medium truncate">
                            {entry.name}
                          </span>

                          {/* Mini category bars */}
                          <div className="hidden sm:flex items-center gap-1">
                            {POINT_CATEGORIES.map(cat => {
                              const val = entry[cat.key];
                              const hasPoints = val > 0;
                              return (
                                <div
                                  key={cat.key}
                                  title={`${cat.label}: ${val}${cat.max ? `/${cat.max}` : ''}`}
                                  className={`w-2 h-2 rounded-full ${hasPoints ? cat.bgColor : 'bg-cream/10'}`}
                                />
                              );
                            })}
                          </div>

                          {/* Total */}
                          <span className="text-gold font-bold w-12 text-right">
                            {entry.points}
                          </span>

                          <ChevronDown className={`w-4 h-4 text-cream/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                  {POINT_CATEGORIES.map(cat => {
                                    const val = entry[cat.key];
                                    const isComplete = cat.max !== null && val >= cat.max;
                                    const isMissing = val === 0;

                                    return (
                                      <div
                                        key={cat.key}
                                        className={`rounded p-2 ${
                                          isMissing
                                            ? 'bg-warm-red/10 border border-warm-red/20'
                                            : isComplete
                                            ? 'bg-success-green/10 border border-success-green/20'
                                            : 'bg-deep-green/50'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <p className="text-xs text-cream/50">{cat.label}</p>
                                          {isComplete && <CheckCircle className="w-3 h-3 text-success-green" />}
                                          {isMissing && cat.max !== null && <XCircle className="w-3 h-3 text-warm-red/60" />}
                                        </div>
                                        <p className={`text-sm font-semibold ${cat.color}`}>
                                          {val}
                                          {cat.max !== null && (
                                            <span className="text-cream/30 font-normal">/{cat.max}</span>
                                          )}
                                        </p>
                                        {cat.max !== null && (
                                          <div className="mt-1 h-1 rounded-full bg-cream/10 overflow-hidden">
                                            <div
                                              className={`h-full rounded-full ${cat.bgColor}`}
                                              style={{ width: `${Math.min(100, (val / cat.max) * 100)}%` }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-cream/50">
            Deelnemers die al geregistreerd zijn kunnen niet worden verwijderd
          </p>
        </div>
      </div>
    </div>
  );
}
