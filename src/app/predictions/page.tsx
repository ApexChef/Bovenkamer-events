'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePredictionsStore, useRegistrationStore } from '@/lib/store';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Select } from '@/components/ui';
import { Slider } from '@/components/ui/Slider';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { motion } from 'framer-motion';

// Mock participants for selection (in real app, fetch from database)
const PARTICIPANTS = [
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

const TIME_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const hour = 20 + Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return { value: time, label: time };
});

export default function PredictionsPage() {
  const router = useRouter();
  const { isComplete } = useRegistrationStore();
  const { predictions, setPrediction, isSubmitted, setSubmitted } = usePredictionsStore();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not registered
  if (typeof window !== 'undefined' && !isComplete) {
    router.push('/register');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In real app, save to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
              <h2 className="font-display text-2xl text-gold mb-2">Voorspellingen Ingediend</h2>
              <p className="text-cream/60 mb-6">Uw voorspellingen zijn geregistreerd. Na de BBQ worden de punten toegekend.</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  min={5}
                  max={15}
                  value={predictions.meatKilos ?? 10}
                  onChange={(e) => setPrediction('meatKilos', parseInt(e.target.value))}
                  unit=" kg"
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
                  options={PARTICIPANTS}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.firstSleeper ?? ''}
                  onChange={(e) => setPrediction('firstSleeper', e.target.value)}
                />

                <Select
                  label="Wie begint spontaan te zingen?"
                  options={PARTICIPANTS}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.spontaneousSinger ?? ''}
                  onChange={(e) => setPrediction('spontaneousSinger', e.target.value)}
                />

                <Select
                  label="Wie gaat als laatste naar huis?"
                  options={PARTICIPANTS}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.lastToLeave ?? ''}
                  onChange={(e) => setPrediction('lastToLeave', e.target.value)}
                />

                <Select
                  label="Wie is de luidste lacher?"
                  options={PARTICIPANTS}
                  placeholder="Selecteer een deelnemer"
                  value={predictions.loudestLaugher ?? ''}
                  onChange={(e) => setPrediction('loudestLaugher', e.target.value)}
                />

                <Select
                  label="Wie vertelt het langste verhaal?"
                  options={PARTICIPANTS}
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

                <Select
                  label="Hoe laat vertrekt de laatste gast?"
                  options={TIME_OPTIONS}
                  placeholder="Selecteer een tijd"
                  value={predictions.lastGuestTime ?? ''}
                  onChange={(e) => setPrediction('lastGuestTime', e.target.value)}
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

          {/* Submit */}
          <CardFooter className="flex justify-between px-0">
            <Link href="/dashboard">
              <Button type="button" variant="ghost">
                Terug
              </Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>
              Voorspellingen Indienen
            </Button>
          </CardFooter>
        </form>
      </div>
    </main>
  );
}
