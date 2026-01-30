'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRegistrationStore, useAuthStore, EVENT_START } from '@/lib/store';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button, Card, CardContent, CardFooter } from '@/components/ui';
import { DynamicForm } from '@/components/forms/dynamic';
import { motion } from 'framer-motion';

export default function PredictionsPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const { formData, isComplete } = useRegistrationStore();
  const [participants, setParticipants] = useState<{ value: string; label: string }[]>([]);
  const [eventStarted, setEventStarted] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check if editing is allowed (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setEventStarted(new Date() >= EVENT_START);
  }, []);

  // Fetch participants for select_participant fields
  useEffect(() => {
    async function fetchParticipants() {
      try {
        const response = await fetch('/api/participants');
        if (response.ok) {
          setParticipants(await response.json());
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    }
    fetchParticipants();
  }, []);

  // Track page visit
  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: '/predictions',
        email: formData.email || null,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        isRegistered: isComplete,
      }),
    }).catch(() => {});
  }, []);

  const handleLoadStatus = useCallback(({ isSubmitted }: { isSubmitted: boolean }) => {
    setHasSubmitted(isSubmitted);
  }, []);

  // Show message if not registered
  if (!isComplete) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔮</span>
              </div>
              <h2 className="font-display text-2xl text-gold mb-2">
                Voorspellingen
              </h2>
              <p className="text-cream/60 mb-6">
                Deze functie wordt binnenkort geactiveerd. Registreer eerst om toegang te krijgen.
              </p>
              <Link href="/register">
                <Button>Registreren</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Lock when event has started
  if (eventStarted) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-warm-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔒</span>
              </div>
              <h2 className="font-display text-2xl text-gold mb-2">
                Voorspellingen Vergrendeld
              </h2>
              <p className="text-cream/60 mb-6">
                Het evenement is begonnen. Voorspellingen kunnen niet meer worden aangepast.
              </p>
              <Link href="/dashboard">
                <Button>Terug naar Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const email = currentUser?.email || formData.email;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gold mb-2">
            Voorspellingen
          </h1>
          <p className="text-cream/60">Waag uw gok en verdien punten</p>
        </div>

        {/* Previously submitted banner */}
        {hasSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-success-green/20 border border-success-green rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="text-success-green font-medium">Voorspellingen opgeslagen</p>
                <p className="text-cream/60 text-sm">Je kunt ze nog aanpassen tot het evenement begint.</p>
              </div>
            </div>
          </motion.div>
        )}

        <DynamicForm
          formKey="predictions"
          email={email}
          participants={participants}
          allowEditAfterSubmit
          onLoadStatus={handleLoadStatus}
          onSubmitSuccess={() => router.push('/dashboard')}
          onSaveDraftSuccess={() => router.push('/dashboard')}
          renderFooter={({ isValid, isLoading, isSavingDraft, isSubmitted, onSubmit, onSaveDraft }) => (
            <>
              {/* Points Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gold/10 border-gold/30">
                  <CardContent className="py-4">
                    <h4 className="text-gold font-semibold mb-2">Puntentoekenning</h4>
                    <ul className="text-sm text-cream/70 space-y-1">
                      <li>Exact goed: <span className="text-gold">+50 punten</span></li>
                      <li>Dichtbij (±10%): <span className="text-gold">+25 punten</span></li>
                      <li>Goede richting: <span className="text-gold">+10 punten</span></li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Submit buttons */}
              <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between px-0">
                <Link href="/dashboard">
                  <Button type="button" variant="ghost">
                    Terug
                  </Button>
                </Link>
                <div className="flex gap-3">
                  {!isSubmitted && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onSaveDraft}
                      isLoading={isSavingDraft}
                    >
                      Opslaan als concept
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={onSubmit}
                    isLoading={isLoading}
                    disabled={!isValid}
                  >
                    {isSubmitted ? 'Opnieuw indienen' : 'Definitief indienen'}
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        />
      </div>
    </DashboardLayout>
  );
}
