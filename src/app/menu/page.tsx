'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Wine, UtensilsCrossed, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { MenuEvent, MenuCardCourse, MeatDistribution } from '@/types';

interface MenuData {
  event: MenuEvent | null;
  courses: MenuCardCourse[];
  winePreference: number | null;
  userName: string | null;
  meatDistribution: MeatDistribution | null;
}

interface SplitResult {
  included: { item: string; index: number }[];
  missed: { item: string; index: number }[];
}

function splitItemsByPreference(
  course: MenuCardCourse,
  meatDistribution: MeatDistribution | null,
): SplitResult | null {
  if (!course.itemCategories || !meatDistribution) return null;

  const items = course.items.split('\n').filter(Boolean);
  const categories = course.itemCategories.split('\n');

  const included: SplitResult['included'] = [];
  const missed: SplitResult['missed'] = [];

  items.forEach((item, i) => {
    const category = categories[i]?.trim() as keyof MeatDistribution | undefined;
    if (category && category in meatDistribution && meatDistribution[category] === 0) {
      missed.push({ item, index: i });
    } else {
      included.push({ item, index: i });
    }
  });

  // Only return a split if there are actually missed items
  if (missed.length === 0) return null;

  return { included, missed };
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

  const { event, courses, winePreference, userName, meatDistribution } = data;
  const eventDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Determine wine text per course
  function getWineText(course: MenuCardCourse): string | null {
    if (winePreference === null || !userName) return null;
    const wineText = winePreference < 50 ? course.wineRed : course.wineWhite;
    if (!wineText) return null;
    return `${userName}, wij schenken bij deze gang ${wineText}`;
  }

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
          {courses.map((course, index) => {
            const items = course.items.split('\n').filter(Boolean);
            const wineText = getWineText(course);
            const split = splitItemsByPreference(course, meatDistribution);

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * (index + 1) }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    {course.subtitle && (
                      <p className="text-sm text-cream/50 mt-1 italic">{course.subtitle}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {split ? (
                      <>
                        <ul className="space-y-2">
                          {split.included.map(({ item, index: i }) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-cream/80"
                            >
                              <span className="text-gold/60 mt-1">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="border-t border-cream/10 pt-3">
                          <p className="text-cream/40 italic text-sm mb-2">
                            {userName}, helaas mis je deze heerlijke gerechten:
                          </p>
                          <ul className="space-y-1">
                            {split.missed.map(({ item, index: i }) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 opacity-40 line-through decoration-cream/20"
                              >
                                <span className="text-gold/60 mt-1">·</span>
                                <span className="text-cream/60">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-cream/80"
                          >
                            <span className="text-gold/60 mt-1">·</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {wineText && (
                      <div className="flex items-start gap-3 pt-3 border-t border-cream/10">
                        <Wine className="w-4 h-4 text-gold/70 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-cream/60 italic">
                          {wineText}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

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
