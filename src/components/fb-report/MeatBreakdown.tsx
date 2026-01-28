'use client';

import { motion } from 'framer-motion';
import type { MeatStats, MeatCategory } from '@/types';

interface MeatBreakdownProps {
  stats: MeatStats;
}

const MEAT_LABELS: Record<MeatCategory, string> = {
  pork: 'Varkensvlees',
  beef: 'Rundvlees',
  chicken: 'Kip',
  game: 'Wild',
  fish: 'Vis & Schaaldieren',
  vegetarian: 'Vegetarisch',
};

const MEAT_EMOJIS: Record<MeatCategory, string> = {
  pork: '🐷',
  beef: '🐮',
  chicken: '🐔',
  game: '🦌',
  fish: '🐟',
  vegetarian: '🥬',
};

export function MeatBreakdown({ stats }: MeatBreakdownProps) {
  const categories: MeatCategory[] = ['beef', 'pork', 'chicken', 'fish', 'game', 'vegetarian'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6 print:page-break-inside-avoid"
    >
      <div className="bg-dark-wood/80 border border-gold/20 rounded-lg p-6 print:border-black print:p-4">
        <h2 className="font-display text-2xl text-gold mb-2 print:text-xl print:text-black">
          Vlees & Vis Verdeling
        </h2>
        <p className="text-cream/70 text-sm mb-4 print:text-black">
          Totaal: <span className="font-bold text-gold print:text-black">{stats.totalKg.toFixed(2)} kg</span> (200g per persoon)
        </p>

        <div className="space-y-4">
          {categories.map((category) => {
            const cat = stats.categories[category];
            const percentage = cat.percentage;

            return (
              <div key={category} className="print:page-break-inside-avoid">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-cream font-medium flex items-center gap-2 print:text-black">
                    <span>{MEAT_EMOJIS[category]}</span>
                    {MEAT_LABELS[category]}
                  </span>
                  <span className="text-gold font-semibold print:text-black">
                    {cat.kg.toFixed(2)} kg
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-8 bg-deep-green/40 rounded-lg overflow-hidden border border-gold/20 print:border-black">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-gold/70 print:bg-gray-400"
                  />
                  <div className="relative flex items-center justify-between px-3 h-full">
                    <span className="text-cream text-sm font-medium z-10 print:text-black">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="text-cream/80 text-sm z-10 print:text-black">
                      {cat.weightedCount.toFixed(1)} personen
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gold/20 print:border-black">
          <div className="text-cream/70 text-sm print:text-black">
            <span className="font-semibold">Let op:</span> Percentages zijn gewogen op basis van individuele voorkeuren.
            Bij 50% rund kiest de helft van de personen volledig voor rundvlees.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
