'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRegistrationStore, usePredictionsStore } from '@/lib/store';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { PaymentCard } from '@/components/PaymentCard';
import { motion } from 'framer-motion';

const WARNING_COLORS = {
  GROEN: 'bg-success-green',
  GEEL: 'bg-yellow-500',
  ORANJE: 'bg-orange-500',
  ROOD: 'bg-warm-red',
};

export default function DashboardPage() {
  const router = useRouter();
  const { formData, aiAssignment, isComplete } = useRegistrationStore();
  const { isSubmitted: predictionsSubmitted } = usePredictionsStore();

  // Redirect if not registered
  useEffect(() => {
    if (!isComplete) {
      router.push('/register');
    }
  }, [isComplete, router]);

  if (!isComplete) {
    return null;
  }

  return (
    <main className="min-h-screen py-8 px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 border border-gold/10 rounded-full" />
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-gold/10 rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="stamp text-xs mb-4 inline-block">GEREGISTREERD</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gold mb-2">
            Welkom, {formData.name}
          </h1>
          <p className="text-cream/60">Bovenkamer Winterproef 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assignment Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Uw Toewijzing</CardTitle>
                    <CardDescription>Namens de commissie</CardDescription>
                  </div>
                  {aiAssignment && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-dark-wood ${
                        WARNING_COLORS[aiAssignment.warningLevel]
                      }`}
                    >
                      {aiAssignment.warningLevel}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {aiAssignment ? (
                  <div className="space-y-4">
                    <div className="text-center py-4 bg-dark-wood/50 rounded-lg border border-gold/20">
                      <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">
                        Officiële Titel
                      </p>
                      <h2 className="font-display text-2xl text-gold">
                        {aiAssignment.officialTitle}
                      </h2>
                    </div>
                    <div className="bg-gold/10 rounded-lg p-4 border border-gold/20">
                      <p className="text-gold text-xs uppercase tracking-wider mb-1 font-semibold">
                        Taak
                      </p>
                      <p className="text-cream">{aiAssignment.task}</p>
                    </div>
                    <div>
                      <p className="text-cream/70 italic text-sm">
                        &ldquo;{aiAssignment.reasoning}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-cream/50">Privilege:</span>
                      <span className="text-gold">{aiAssignment.specialPrivilege}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-cream/50">Toewijzing wordt geladen...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Predictions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Voorspellingen</CardTitle>
                <CardDescription>Waag uw gok en verdien punten</CardDescription>
              </CardHeader>
              <CardContent>
                {predictionsSubmitted ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-success-green/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-success-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-cream/70 mb-2">Uw voorspellingen zijn ingediend</p>
                    <p className="text-cream/50 text-sm">Resultaten na de BBQ</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-cream/70 mb-4">
                      Doe uw voorspellingen over de avond en verdien punten!
                    </p>
                    <Link href="/predictions">
                      <Button>Voorspellingen Doen</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quiz Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Live Quiz</CardTitle>
                <CardDescription>Tijdens de BBQ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-cream/70 mb-2">De quiz start tijdens de BBQ</p>
                  <p className="text-cream/50 text-sm">24 januari 2026</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <PaymentCard userId={formData.email} />
          </motion.div>

          {/* Event Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Event Informatie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gold font-semibold">24 januari 2026</p>
                    <p className="text-cream/50 text-sm">Vrijdag</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gold font-semibold">14:00 - 19:00+</p>
                    <p className="text-cream/50 text-sm">Aanvang</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-gold font-semibold">Bij Boy Boom</p>
                    <p className="text-cream/50 text-sm">Adres volgt</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gold/10">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-cream/50 text-sm">Deelname kosten</p>
                      <p className="text-gold text-xl font-bold">€50 p.p.</p>
                    </div>
                    {formData.hasPartner && (
                      <div className="text-center sm:text-right">
                        <p className="text-cream/50 text-sm">Partner</p>
                        <p className="text-gold">{formData.partnerName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Points Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-2"
          >
            <Card className="bg-gold/5 border-gold/30">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cream/50 text-sm uppercase tracking-wider">Totaal Punten</p>
                    <p className="font-display text-4xl text-gold">0</p>
                  </div>
                  <div className="text-right text-sm text-cream/50">
                    <p>Registratie: +10</p>
                    <p>Voorspellingen: {predictionsSubmitted ? '+5' : '—'}</p>
                    <p>Quiz: binnenkort</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-cream/30 text-xs uppercase tracking-widest">
            Bovenkamer Winterproef • Alumni Junior Kamer Venray
          </p>
        </div>
      </div>
    </main>
  );
}
