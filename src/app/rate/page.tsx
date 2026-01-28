'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, TextArea, Input } from '@/components/ui';
import { motion } from 'framer-motion';

interface Rating {
  email: string;
  location: number;
  hospitality: number;
  fireQuality: number;
  parking: number;
  overall: number;
  bestAspect: string;
  improvementSuggestion: string;
  isWorthy: boolean | null;
  worthyExplanation: string;
}

function StarRating({
  value,
  onChange,
  label,
  description
}: {
  value: number;
  onChange: (val: number) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-cream font-medium">{label}</p>
        <p className="text-cream/50 text-sm">{description}</p>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-10 h-10 rounded-lg border-2 transition-all ${
              star <= value
                ? 'bg-gold border-gold text-dark-wood'
                : 'bg-transparent border-gold/30 text-gold/30 hover:border-gold/60'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rating, setRating] = useState<Rating>({
    email: '',
    location: 0,
    hospitality: 0,
    fireQuality: 0,
    parking: 0,
    overall: 0,
    bestAspect: '',
    improvementSuggestion: '',
    isWorthy: null,
    worthyExplanation: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { email, ...ratingData } = rating;
      const response = await fetch('/api/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          rating: ratingData,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save rating');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error saving rating:', error);
      setIsSubmitted(true); // Show success anyway
    } finally {
      setIsLoading(false);
    }
  };

  const isValid =
    rating.email.trim() !== '' &&
    rating.location > 0 &&
    rating.hospitality > 0 &&
    rating.fireQuality > 0 &&
    rating.parking > 0 &&
    rating.overall > 0 &&
    rating.isWorthy !== null;

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
              <h2 className="font-display text-2xl text-gold mb-2">Beoordeling Ingediend</h2>
              <p className="text-cream/60 mb-6">
                Uw stem is geregistreerd. De resultaten worden na de BBQ bekendgemaakt.
              </p>
              <Link href="/">
                <Button>Terug naar Home</Button>
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
          <span className="stamp text-xs mb-4 inline-block">BEOORDELING</span>
          <h1 className="font-display text-3xl font-bold text-gold mb-2">
            Boy Boom Winterproef
          </h1>
          <p className="text-cream/60">Is de kandidaat waardig?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Uw Email</CardTitle>
                <CardDescription>Voor identificatie van uw beoordeling</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="email"
                  label="Email"
                  placeholder="uw@email.nl"
                  value={rating.email}
                  onChange={(e) => setRating({ ...rating, email: e.target.value })}
                  required
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Rating Criteria */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Beoordelingscriteria</CardTitle>
                <CardDescription>Geef een score van 1-5 sterren</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <StarRating
                  label="Locatie"
                  description="Ruimte, sfeer, faciliteiten"
                  value={rating.location}
                  onChange={(val) => setRating({ ...rating, location: val })}
                />

                <StarRating
                  label="Gastvrijheid"
                  description="Ontvangst, bediening, aandacht"
                  value={rating.hospitality}
                  onChange={(val) => setRating({ ...rating, hospitality: val })}
                />

                <StarRating
                  label="Kwaliteit Vuurvoorziening"
                  description="BBQ, vuurplaats, warmte"
                  value={rating.fireQuality}
                  onChange={(val) => setRating({ ...rating, fireQuality: val })}
                />

                <StarRating
                  label="Parkeergelegenheid"
                  description="Ruimte, bereikbaarheid"
                  value={rating.parking}
                  onChange={(val) => setRating({ ...rating, parking: val })}
                />

                <div className="pt-4 border-t border-gold/20">
                  <StarRating
                    label="Algemene Organisatie"
                    description="Totaalindruk van de avond"
                    value={rating.overall}
                    onChange={(val) => setRating({ ...rating, overall: val })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Open Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Open Vragen</CardTitle>
                <CardDescription>Optioneel maar gewaardeerd</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextArea
                  label="Wat was het beste aan de locatie?"
                  placeholder="Bijv. de sfeer, het uitzicht, de ruimte..."
                  value={rating.bestAspect}
                  onChange={(e) => setRating({ ...rating, bestAspect: e.target.value })}
                  rows={3}
                />

                <TextArea
                  label="Wat kan beter?"
                  placeholder="Constructieve feedback voor de toekomst..."
                  value={rating.improvementSuggestion}
                  onChange={(e) => setRating({ ...rating, improvementSuggestion: e.target.value })}
                  rows={3}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* The Big Question */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-gold/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Het Eindoordeel</CardTitle>
                <CardDescription>De ultieme vraag</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-4">
                  <p className="font-display text-xl text-gold mb-6">
                    Is Boy Boom waardig lid van de Bovenkamer?
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setRating({ ...rating, isWorthy: true })}
                      className={`px-8 py-4 rounded-lg border-2 font-semibold uppercase tracking-wider transition-all ${
                        rating.isWorthy === true
                          ? 'bg-success-green border-success-green text-cream'
                          : 'bg-transparent border-success-green/50 text-success-green hover:border-success-green'
                      }`}
                    >
                      Ja, Waardig
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating({ ...rating, isWorthy: false })}
                      className={`px-8 py-4 rounded-lg border-2 font-semibold uppercase tracking-wider transition-all ${
                        rating.isWorthy === false
                          ? 'bg-warm-red border-warm-red text-cream'
                          : 'bg-transparent border-warm-red/50 text-warm-red hover:border-warm-red'
                      }`}
                    >
                      Nee, Onwaardig
                    </button>
                  </div>
                </div>

                <TextArea
                  label="Toelichting"
                  placeholder="Waarom wel of niet waardig?"
                  value={rating.worthyExplanation}
                  onChange={(e) => setRating({ ...rating, worthyExplanation: e.target.value })}
                  rows={3}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit */}
          <CardFooter className="flex justify-between px-0">
            <Link href="/">
              <Button type="button" variant="ghost">
                Terug
              </Button>
            </Link>
            <Button type="submit" isLoading={isLoading} disabled={!isValid}>
              Beoordeling Indienen
            </Button>
          </CardFooter>
        </form>
      </div>
    </main>
  );
}
