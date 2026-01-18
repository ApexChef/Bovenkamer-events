'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePredictionsStore, useRegistrationStore, EVENT_START } from '@/lib/store';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Select } from '@/components/ui';
import { Slider } from '@/components/ui/Slider';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { motion } from 'framer-motion';

// Fallback participants
const FALLBACK_PARTICIPANTS = [
  { value: 'alwin', label: 'Alwin' },
  { value: 'boy', label: 'Boy Boom' },
  { value: 'peter', label: 'Peter' },
  { value: 'jan', label: 'Jan' },
  { value: 'marco', label: 'Marco' },
  { value: 'henk', label: 'Henk' },
  { value: 'erik', label: 'Erik' },
  { value: 'bas', label: 'Bas' },
  { value: 'rob', label: 'Rob' },
  { value: 'kees', label: 'Kees' },
  { value: 'wim', label: 'Wim' },
];

// Time slider: 0=19:00, 22=06:00 (half-hour increments)
// 19:00 to 00:00 = 10 half-hours (0-10)
// 00:00 to 06:00 = 12 half-hours (10-22)
const formatTimeSlider = (value: number): string => {
  // value 0 = 19:00, value 22 = 06:00
  const totalMinutes = 19 * 60 + value * 30;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export default function PredictionsPage() {
  const router = useRouter();
  const { formData, isComplete } = useRegistrationStore();
  const { predictions, setPrediction, isDraft, isSubmitted, saveDraft, submitFinal, canEdit } = usePredictionsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [participants, setParticipants] = useState(FALLBACK_PARTICIPANTS);
  const [isLocked, setIsLocked] = useState(false);
  const [eventStarted, setEventStarted] = useState(false);

  // Check if editing is allowed (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsLocked(!canEdit());
    setEventStarted(new Date() >= EVENT_START);
  }, [canEdit, isSubmitted]);

  // Fetch participants from database
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch('/api/participants');
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setParticipants(data);
          }
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
        // Keep fallback participants
      }
    };

    fetchParticipants();
  }, []);

  // Redirect if not registered
  useEffect(() => {
    if (!isComplete) {
      router.push('/register');
    }
  }, [isComplete, router]);

  if (!isComplete) {
    return null;
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

  if (isSubmitted || eventStarted) {
    return (
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-success-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-gold mb-2">
                {eventStarted ? 'Voorspellingen Vergrendeld' : 'Voorspellingen Ingediend'}
              </h2>
              <p className="text-cream/60 mb-6">
                {eventStarted
                  ? 'Het evenement is begonnen. Voorspellingen kunnen niet meer worden aangepast.'
                  : 'Uw voorspellingen zijn definitief ingediend. Na de BBQ worden de punten toegekend.'}
              </p>
              <Link href="/dashboard">
                <Button>Terug naar Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-block">
            <h1 className="font-display text-3xl font-bold text-gold mb-2">
              Voorspellingen
            </h1>
          </Link>
          <p className="text-cream/60">Waag uw gok en verdien punten</p>
        </div>

        <form onSubmit={handleSubmitFinal} className="space-y-6">
          {/* Consumption Predictions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Consumptie</CardTitle>
                <CardDescription>Hoeveel wordt er geconsumeerd?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <Slider
                  label="Flessen wijn"
                  min={5}
                  max={30}
                  value={predictions.wineBottles ?? 15}
                  onChange={(e) => setPrediction('wineBottles', parseInt(e.target.value))}
                  unit=" flessen"
                />

                <Slider
                  label="Kratten bier"
                  min={2}
                  max={10}
                  value={predictions.beerCrates ?? 5}
                  onChange={(e) => setPrediction('beerCrates', parseInt(e.target.value))}
                  unit=" kratten"
                />

                <Slider
                  label="Kilo's vlees"
                  min={2}
                  max={8}
                  value={predictions.meatKilos ?? 4}
                  onChange={(e) => setPrediction('meatKilos', parseInt(e.target.value))}
                  unit=" kg"
                  hint="~20 personen × 200g = 4kg"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Social Predictions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Sociale Voorspellingen</CardTitle>
                <CardDescription>Wie doet wat?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Select
                  label="Wie valt als eerste in slaap?"
                  options={participants}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.firstSleeper ?? ''}
                  onChange={(e) => setPrediction('firstSleeper', e.target.value)}
                />

                <Select
                  label="Wie begint spontaan te zingen?"
                  options={participants}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.spontaneousSinger ?? ''}
                  onChange={(e) => setPrediction('spontaneousSinger', e.target.value)}
                />

                <Select
                  label="Wie vertrekt als eerste?"
                  options={participants}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.firstToLeave ?? ''}
                  onChange={(e) => setPrediction('firstToLeave', e.target.value)}
                />

                <Select
                  label="Wie gaat als laatste naar huis?"
                  options={participants}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.lastToLeave ?? ''}
                  onChange={(e) => setPrediction('lastToLeave', e.target.value)}
                />

                <Select
                  label="Wie is de luidste lacher?"
                  options={participants}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.loudestLaugher ?? ''}
                  onChange={(e) => setPrediction('loudestLaugher', e.target.value)}
                />

                <Select
                  label="Wie vertelt het langste verhaal?"
                  options={participants}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.longestStoryTeller ?? ''}
                  onChange={(e) => setPrediction('longestStoryTeller', e.target.value)}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Other Predictions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Overige Voorspellingen</CardTitle>
                <CardDescription>Diverse gokjes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  label="Wordt er iets aangebrand?"
                  name="somethingBurned"
                  options={[
                    { value: 'true', label: 'Ja' },
                    { value: 'false', label: 'Nee' },
                  ]}
                  value={predictions.somethingBurned === undefined ? '' : predictions.somethingBurned.toString()}
                  onChange={(v) => setPrediction('somethingBurned', v === 'true')}
                />

                <Slider
                  label="Hoe koud wordt het buiten?"
                  min={-10}
                  max={10}
                  value={predictions.outsideTemp ?? 0}
                  onChange={(e) => setPrediction('outsideTemp', parseInt(e.target.value))}
                  unit="°C"
                />

                <Slider
                  label="Hoe laat vertrekt de laatste gast?"
                  min={0}
                  max={22}
                  value={predictions.lastGuestTime ?? 10}
                  onChange={(e) => setPrediction('lastGuestTime', parseInt(e.target.value))}
                  formatValue={formatTimeSlider}
                  formatMin="19:00"
                  formatMax="06:00"
                />
              </CardContent>
            </Card>
          </motion.div>

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
    </main>
  );
}
