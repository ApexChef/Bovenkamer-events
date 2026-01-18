'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Target, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

interface PredictionsTabProps {
  predictionsSubmitted: boolean;
}

export function PredictionsTab({ predictionsSubmitted }: PredictionsTabProps) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-gold" />
              Voorspellingen
            </CardTitle>
            <CardDescription>Waag uw gok en verdien punten</CardDescription>
          </CardHeader>
          <CardContent>
            {predictionsSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-success-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success-green" />
                </div>
                <h3 className="text-xl text-cream font-semibold mb-2">
                  Voorspellingen ingediend!
                </h3>
                <p className="text-cream/70 mb-2">
                  Je hebt je voorspellingen gedaan.
                </p>
                <p className="text-cream/50 text-sm">
                  De resultaten worden bekend na de BBQ op 31 januari.
                </p>
                <div className="mt-6 p-4 bg-gold/10 rounded-lg border border-gold/20">
                  <p className="text-gold text-sm font-semibold">+5 punten verdiend!</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl text-cream font-semibold mb-2">
                  Doe je voorspellingen
                </h3>
                <p className="text-cream/70 mb-6">
                  Voorspel wat er gaat gebeuren tijdens de Winterproef en verdien punten!
                </p>

                <div className="space-y-3 text-left mb-6 bg-dark-wood/50 rounded-lg p-4 border border-gold/10">
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-2">Wat kun je voorspellen?</p>
                  <p className="text-cream/60 text-sm">• Hoe laat valt de eerste gast in slaap?</p>
                  <p className="text-cream/60 text-sm">• Wie wint de quiz?</p>
                  <p className="text-cream/60 text-sm">• Hoeveel burgers gaat Boy bakken?</p>
                  <p className="text-cream/60 text-sm">• En meer...</p>
                </div>

                <Link href="/predictions">
                  <Button className="w-full">
                    <Target className="w-4 h-4 mr-2" />
                    Start Voorspellingen (+5 punten)
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
