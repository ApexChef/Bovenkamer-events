'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePredictionsStore, useRegistrationStore, EVENT_START } from '@/lib/store';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { DynamicQuestion } from '@/components/predictions/DynamicQuestion';
import { motion } from 'framer-motion';
import { PredictionQuestion } from '@/types';

export default function PredictionsPage() {
  const router = useRouter();
  const { formData, isComplete } = useRegistrationStore();
  const { predictions, setPrediction, isDraft, isSubmitted, saveDraft, submitFinal, canEdit } = usePredictionsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [participants, setParticipants] = useState<{ value: string; label: string }[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [eventStarted, setEventStarted] = useState(false);
  const [questions, setQuestions] = useState<PredictionQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  // Track page visit (runs for all visitors, including unauthorized)
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: '/predictions',
            email: formData.email || null,
            referrer: document.referrer || null,
            userAgent: navigator.userAgent,
            isRegistered: isComplete,
          }),
        });
      } catch (error) {
        // Silently fail - tracking is not critical
      }
    };
    trackVisit();
  }, []); // Run once on mount

  // Check if editing is allowed (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsLocked(!canEdit());
    setEventStarted(new Date() >= EVENT_START);
  }, [canEdit, isSubmitted]);

  // Fetch dynamic questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/prediction-questions');
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.questions || []);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  // Fetch participants from database (includes partners)
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch('/api/participants');
        if (response.ok) {
          const data = await response.json();
          setParticipants(data);
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };

    fetchParticipants();
  }, []);

  // Show message if not registered (no redirect)
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

  const savePredictionsToServer = async () => {
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          predictions,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save predictions to database');
      }
    } catch (error) {
      console.error('Error saving predictions:', error);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    await savePredictionsToServer();
    saveDraft();
    setIsSavingDraft(false);
    router.push('/dashboard');
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await savePredictionsToServer();
    submitFinal();
    setIsLoading(false);
    router.push('/dashboard');
  };

  // Group questions by category
  const consumptionQuestions = questions.filter((q) => q.category === 'consumption');
  const socialQuestions = questions.filter((q) => q.category === 'social');
  const otherQuestions = questions.filter((q) => q.category === 'other');

  // Category display configuration
  const categories = [
    {
      key: 'consumption',
      title: 'Consumptie',
      description: 'Hoeveel wordt er geconsumeerd?',
      questions: consumptionQuestions,
      delay: 0.1,
    },
    {
      key: 'social',
      title: 'Sociale Voorspellingen',
      description: 'Wie doet wat?',
      questions: socialQuestions,
      delay: 0.2,
    },
    {
      key: 'other',
      title: 'Overige Voorspellingen',
      description: 'Diverse gokjes',
      questions: otherQuestions,
      delay: 0.3,
    },
  ];

  // Only lock when event has started (allow editing after submission until event starts)
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
        {isSubmitted && (
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

        <form onSubmit={handleSubmitFinal} className="space-y-6">
          {/* Loading state */}
          {isLoadingQuestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">⏳</span>
                  </div>
                  <p className="text-cream/60">Vragen laden...</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Dynamic question categories */}
          {!isLoadingQuestions && categories.map((category) => {
            // Only render category if it has questions
            if (category.questions.length === 0) return null;

            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: category.delay }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {category.questions.map((question) => (
                      <DynamicQuestion
                        key={question.id}
                        question={question}
                        value={predictions[question.key]}
                        onChange={(value) => setPrediction(question.key, value)}
                        participants={participants}
                      />
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

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

          {/* Draft status */}
          {isDraft && !isSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="py-4">
                  <p className="text-blue-400 text-sm">
                    Je voorspellingen zijn opgeslagen als concept. Je kunt ze nog aanpassen tot het evenement begint.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Submit */}
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between px-0">
            <Link href="/dashboard">
              <Button type="button" variant="ghost">
                Terug
              </Button>
            </Link>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDraft}
                isLoading={isSavingDraft}
              >
                Opslaan als concept
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Definitief indienen
              </Button>
            </div>
          </CardFooter>
        </form>
      </div>
    </DashboardLayout>
  );
}
