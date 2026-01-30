'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Wine, UtensilsCrossed, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { MenuEvent, EventCourseWithItems } from '@/types';

interface MenuData {
  event: MenuEvent | null;
  courses: EventCourseWithItems[];
  winePreference: number | null;
}

function getWineSuggestion(pref: number): { label: string; description: string } {
  if (pref < 25) {
    return { label: 'Rode wijn', description: 'Op basis van jouw voorkeur schenken we bij voorkeur rode wijn voor je in.' };
  }
  if (pref < 50) {
    return { label: 'Rode wijn (met een vleugje wit)', description: 'Je hebt een lichte voorkeur voor rood — we houden daar rekening mee.' };
  }
  if (pref < 75) {
    return { label: 'Witte wijn (met een vleugje rood)', description: 'Je neigt naar wit, maar een rood tintje mag ook — goed om te weten!' };
  }
  return { label: 'Witte wijn', description: 'Op basis van jouw voorkeur schenken we bij voorkeur witte wijn voor je in.' };
}

export default function MenuPage() {
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Fout bij het ophalen van het menu');
        const json: MenuData = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er ging iets mis');
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-cream/60">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <p>Menu laden...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <p className="text-warm-red mb-4">{error}</p>
            <Link href="/" className="text-gold hover:underline">
              Terug naar home
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!data?.event) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <UtensilsCrossed className="w-12 h-12 text-cream/30 mx-auto mb-4" />
            <p className="text-cream/60 mb-4">Het menu is nog niet beschikbaar.</p>
            <Link href="/" className="text-gold hover:underline">
              Terug naar home
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { event, courses, winePreference } = data;
  const eventDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-cream/60 hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug</span>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <UtensilsCrossed className="w-10 h-10 text-gold mx-auto mb-4" />
          <h1 className="font-display text-4xl md:text-5xl text-gold mb-2">
            {event.name}
          </h1>
          {eventDate && (
            <p className="text-cream/60 text-lg capitalize">{eventDate}</p>
          )}
        </motion.div>

        {/* Courses */}
        <div className="space-y-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * (index + 1) }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                  {course.notes && (
                    <p className="text-sm text-cream/50 mt-1">{course.notes}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {course.menuItems.length === 0 ? (
                    <p className="text-cream/40 italic text-sm">
                      Wordt nog bekendgemaakt
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {course.menuItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start gap-2 text-cream/80"
                        >
                          <span className="text-gold/60 mt-1">•</span>
                          <span>{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Wine suggestion */}
        {winePreference !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * (courses.length + 1) }}
            className="mt-8"
          >
            <Card className="border-gold/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Wine className="w-6 h-6 text-gold" />
                  <CardTitle>Jouw wijnsuggestie</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-cream font-semibold text-lg mb-1">
                  {getWineSuggestion(winePreference).label}
                </p>
                <p className="text-cream/60 text-sm">
                  {getWineSuggestion(winePreference).description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gold/30" />
            <div className="w-2 h-2 bg-gold/50 rotate-45" />
            <div className="h-px w-16 bg-gold/30" />
          </div>
          <p className="text-cream/30 text-xs uppercase tracking-widest">
            Bovenkamer Winterproef
          </p>
        </div>
      </div>
    </main>
  );
}
