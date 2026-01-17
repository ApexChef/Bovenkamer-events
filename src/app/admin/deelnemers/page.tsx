'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ExpectedParticipant } from '@/types';
import Link from 'next/link';

export default function AdminParticipantsPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminParticipantsContent />
    </AuthGuard>
  );
}

function AdminParticipantsContent() {
  const [participants, setParticipants] = useState<ExpectedParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add participant form
  const [newName, setNewName] = useState('');
  const [newEmailHint, setNewEmailHint] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchParticipants();
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

  return (
    <div className="min-h-screen bg-deep-green p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
            &larr; Terug naar admin dashboard
          </Link>
          <h1 className="text-4xl font-serif text-gold mb-2">Verwachte Deelnemers</h1>
          <p className="text-cream/70">
            Beheer de lijst van verwachte deelnemers voor het evenement
          </p>
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

        <div className="mt-6 text-center">
          <p className="text-xs text-cream/50">
            Deelnemers die al geregistreerd zijn kunnen niet worden verwijderd
          </p>
        </div>
      </div>
    </div>
  );
}
