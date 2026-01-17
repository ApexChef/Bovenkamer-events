'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import Link from 'next/link';

interface RegistrationDetails {
  id: string;
  user_id: string;
  name: string;
  email: string;
  birth_year: number;
  has_partner: boolean;
  partner_name?: string;
  dietary_requirements?: string;
  primary_skill: string;
  additional_skills?: string;
  music_decade: string;
  music_genre: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  email_verified: boolean;
}

export default function AdminRegistrationsPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminRegistrationsContent />
    </AuthGuard>
  );
}

function AdminRegistrationsContent() {
  const [registrations, setRegistrations] = useState<RegistrationDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReg, setSelectedReg] = useState<RegistrationDetails | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/registrations');
      const data = await response.json();

      if (response.ok) {
        setRegistrations(data.registrations || []);
      } else {
        setError(data.message || 'Kon registraties niet laden');
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setError('Netwerkfout bij ophalen registraties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (regId: string) => {
    if (!confirm('Weet je zeker dat je deze registratie wilt goedkeuren?')) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`/api/admin/registrations/${regId}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setRegistrations(registrations.filter(r => r.id !== regId));
        setSelectedReg(null);
        alert('Registratie goedgekeurd! Gebruiker ontvangt een notificatie email.');
      } else {
        alert(data.message || 'Kon registratie niet goedkeuren');
      }
    } catch (err) {
      console.error('Failed to approve registration:', err);
      alert('Netwerkfout bij goedkeuren registratie');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (regId: string) => {
    if (!rejectionReason.trim()) {
      alert('Vul een reden voor afwijzing in');
      return;
    }

    if (!confirm('Weet je zeker dat je deze registratie wilt afwijzen?')) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`/api/admin/registrations/${regId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setRegistrations(registrations.filter(r => r.id !== regId));
        setSelectedReg(null);
        setRejectionReason('');
        alert('Registratie afgekeurd. Gebruiker ontvangt een notificatie email.');
      } else {
        alert(data.message || 'Kon registratie niet afwijzen');
      }
    } catch (err) {
      console.error('Failed to reject registration:', err);
      alert('Netwerkfout bij afwijzen registratie');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRegs = registrations.filter(r => r.status === 'pending');
  const unverifiedRegs = pendingRegs.filter(r => !r.email_verified);
  const verifiedRegs = pendingRegs.filter(r => r.email_verified);

  return (
    <div className="min-h-screen bg-deep-green p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
            &larr; Terug naar admin dashboard
          </Link>
          <h1 className="text-4xl font-serif text-gold mb-2">Registraties Beoordelen</h1>
          <p className="text-cream/70">
            Bekijk en beoordeel nieuwe registraties
          </p>

          <div className="mt-4 flex gap-4 text-sm">
            <div className="text-cream/70">
              <span className="text-gold font-semibold">{verifiedRegs.length}</span> te beoordelen
            </div>
            <div className="text-cream/70">
              <span className="text-warm-red font-semibold">{unverifiedRegs.length}</span> wachten op email verificatie
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cream/70 text-sm">Laden...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-warm-red">{error}</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Registrations List */}
            <div className="space-y-4">
              <h2 className="text-xl font-serif text-gold mb-4">
                Geverifieerde registraties ({verifiedRegs.length})
              </h2>

              {verifiedRegs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-cream/50">
                    Geen registraties te beoordelen
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {verifiedRegs.map((reg, index) => (
                    <motion.div
                      key={reg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`
                          cursor-pointer transition-all
                          ${selectedReg?.id === reg.id
                            ? 'ring-2 ring-gold bg-dark-wood/60'
                            : 'hover:bg-dark-wood/40'
                          }
                        `}
                        onClick={() => setSelectedReg(reg)}
                      >
                        <CardContent className="p-4">
                          <h3 className="text-cream font-semibold">{reg.name}</h3>
                          <p className="text-cream/60 text-sm">{reg.email}</p>
                          <p className="text-cream/50 text-xs mt-2">
                            Geregistreerd:{' '}
                            {new Date(reg.created_at).toLocaleDateString('nl-NL')}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {unverifiedRegs.length > 0 && (
                <>
                  <h2 className="text-xl font-serif text-gold mb-4 mt-8">
                    Wachten op email verificatie ({unverifiedRegs.length})
                  </h2>
                  <div className="space-y-3">
                    {unverifiedRegs.map((reg, index) => (
                      <Card key={reg.id} className="opacity-60">
                        <CardContent className="p-4">
                          <h3 className="text-cream font-semibold">{reg.name}</h3>
                          <p className="text-cream/60 text-sm">{reg.email}</p>
                          <p className="text-warm-red text-xs mt-2">
                            Email nog niet geverifieerd
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Details & Actions */}
            <div className="sticky top-4">
              <AnimatePresence mode="wait">
                {selectedReg ? (
                  <motion.div
                    key={selectedReg.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Registratie Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gold mb-1">Naam</h4>
                          <p className="text-cream">{selectedReg.name}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gold mb-1">Email</h4>
                          <p className="text-cream">{selectedReg.email}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gold mb-1">Geboortejaar</h4>
                          <p className="text-cream">{selectedReg.birth_year}</p>
                        </div>

                        {selectedReg.has_partner && (
                          <div>
                            <h4 className="text-sm font-semibold text-gold mb-1">Partner</h4>
                            <p className="text-cream">{selectedReg.partner_name}</p>
                          </div>
                        )}

                        {selectedReg.dietary_requirements && (
                          <div>
                            <h4 className="text-sm font-semibold text-gold mb-1">Dieetwensen</h4>
                            <p className="text-cream">{selectedReg.dietary_requirements}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-semibold text-gold mb-1">Primaire skill</h4>
                          <p className="text-cream">{selectedReg.primary_skill}</p>
                        </div>

                        {selectedReg.additional_skills && (
                          <div>
                            <h4 className="text-sm font-semibold text-gold mb-1">Extra skills</h4>
                            <p className="text-cream">{selectedReg.additional_skills}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-semibold text-gold mb-1">Muziek voorkeuren</h4>
                          <p className="text-cream">
                            {selectedReg.music_decade} - {selectedReg.music_genre}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gold/20">
                          <h4 className="text-sm font-semibold text-gold mb-3">Afwijzen met reden</h4>
                          <TextArea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Optioneel: geef een reden voor afwijzing..."
                            rows={3}
                            disabled={actionLoading}
                          />
                        </div>

                        <div className="pt-4 space-y-2">
                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => handleApprove(selectedReg.id)}
                            isLoading={actionLoading}
                          >
                            Goedkeuren
                          </Button>
                          <Button
                            variant="secondary"
                            className="w-full text-warm-red border-warm-red hover:bg-warm-red/10"
                            onClick={() => handleReject(selectedReg.id)}
                            isLoading={actionLoading}
                          >
                            Afwijzen
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card>
                      <CardContent className="p-12 text-center text-cream/50">
                        <svg
                          className="w-16 h-16 mx-auto mb-4 opacity-30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p>Selecteer een registratie om details te bekijken</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
