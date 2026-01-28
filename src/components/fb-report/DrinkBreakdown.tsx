'use client';

import { motion } from 'framer-motion';
import type { DrinkStats } from '@/types';

interface DrinkBreakdownProps {
  stats: DrinkStats;
}

export function DrinkBreakdown({ stats }: DrinkBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6 print:page-break-inside-avoid"
    >
      <div className="bg-dark-wood/80 border border-gold/20 rounded-lg p-6 print:border-black print:p-4">
        <h2 className="font-display text-2xl text-gold mb-4 print:text-xl print:text-black">
          Drank Overzicht
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wine */}
          <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
            <h3 className="font-semibold text-cream text-lg mb-3 flex items-center gap-2 print:text-black">
              <span>🍷</span>
              Wijn
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-cream print:text-black">
                <span>Totaal Flessen:</span>
                <span className="font-bold text-gold print:text-black">
                  {stats.wine.bottles}
                </span>
              </div>
              <div className="flex justify-between text-cream/80 text-sm print:text-black">
                <span>Drinkers:</span>
                <span>{stats.wine.totalDrinkers.toFixed(1)} personen</span>
              </div>
              <div className="mt-3 pt-3 border-t border-cream/20 print:border-black">
                <div className="space-y-2">
                  <div className="flex justify-between text-cream text-sm print:text-black">
                    <span>🔴 Rood:</span>
                    <span>{stats.wine.red.bottles} flessen ({stats.wine.red.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between text-cream text-sm print:text-black">
                    <span>⚪ Wit:</span>
                    <span>{stats.wine.white.bottles} flessen ({stats.wine.white.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Beer */}
          <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
            <h3 className="font-semibold text-cream text-lg mb-3 flex items-center gap-2 print:text-black">
              <span>🍺</span>
              Bier
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-cream print:text-black">
                <span>Totaal Kratten:</span>
                <span className="font-bold text-gold print:text-black">
                  {stats.beer.crates}
                </span>
              </div>
              <div className="flex justify-between text-cream/80 text-sm print:text-black">
                <span>Flessen:</span>
                <span>{stats.beer.bottles} stuks</span>
              </div>
              <div className="flex justify-between text-cream/80 text-sm print:text-black">
                <span>Drinkers:</span>
                <span>{stats.beer.totalDrinkers.toFixed(1)} personen</span>
              </div>
              <div className="mt-3 pt-3 border-t border-cream/20 print:border-black">
                <div className="space-y-2">
                  <div className="flex justify-between text-cream text-sm print:text-black">
                    <span>Pils:</span>
                    <span>{stats.beer.pils.count} personen ({stats.beer.pils.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between text-cream text-sm print:text-black">
                    <span>Speciaal:</span>
                    <span>{stats.beer.speciaal.count} personen ({stats.beer.speciaal.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Soft Drinks */}
          <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
            <h3 className="font-semibold text-cream text-lg mb-3 flex items-center gap-2 print:text-black">
              <span>🥤</span>
              Frisdrank
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-cream/80 text-sm mb-3 print:text-black">
                <span>Drinkers:</span>
                <span>{stats.softDrinks.totalDrinkers.toFixed(1)} personen</span>
              </div>
              {Object.keys(stats.softDrinks.breakdown).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(stats.softDrinks.breakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-between text-cream text-sm print:text-black">
                        <span className="capitalize">{type}:</span>
                        <span>{count} personen</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-cream/60 text-sm italic print:text-black">
                  Geen specifieke voorkeuren
                </div>
              )}
            </div>
          </div>

          {/* Water & Bubbles */}
          <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
            <h3 className="font-semibold text-cream text-lg mb-3 flex items-center gap-2 print:text-black">
              <span>💧</span>
              Water & Aperitief
            </h3>
            <div className="space-y-3">
              {/* Water */}
              <div>
                <div className="text-cream/80 text-sm mb-2 print:text-black">Water:</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-cream text-sm print:text-black">
                    <span>Bruisend:</span>
                    <span>{stats.water.sparkling} personen</span>
                  </div>
                  <div className="flex justify-between text-cream text-sm print:text-black">
                    <span>Plat:</span>
                    <span>{stats.water.flat} personen</span>
                  </div>
                </div>
              </div>

              {/* Bubbles */}
              {stats.bubbles.total > 0 && (
                <div className="pt-3 border-t border-cream/20 print:border-black">
                  <div className="text-cream/80 text-sm mb-2 print:text-black">
                    🥂 Aperitief ({stats.bubbles.total} personen):
                  </div>
                  <div className="space-y-1">
                    {stats.bubbles.champagne.count > 0 && (
                      <div className="flex justify-between text-cream text-sm print:text-black">
                        <span>Champagne:</span>
                        <span>
                          {stats.bubbles.champagne.count} personen ({stats.bubbles.champagne.bottles} flessen)
                        </span>
                      </div>
                    )}
                    {stats.bubbles.prosecco.count > 0 && (
                      <div className="flex justify-between text-cream text-sm print:text-black">
                        <span>Prosecco:</span>
                        <span>
                          {stats.bubbles.prosecco.count} personen ({stats.bubbles.prosecco.bottles} flessen)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
