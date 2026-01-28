'use client';

import { motion } from 'framer-motion';

interface SidesBreakdownProps {
  averageVeggies: number;
  averageSauces: number;
}

export function SidesBreakdown({ averageVeggies, averageSauces }: SidesBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6 print:page-break-inside-avoid"
    >
      <div className="bg-dark-wood/80 border border-gold/20 rounded-lg p-6 print:border-black print:p-4">
        <h2 className="font-display text-2xl text-gold mb-4 print:text-xl print:text-black">
          Bijgerechten
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Veggies */}
          <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
            <h3 className="font-semibold text-cream text-lg mb-3 flex items-center gap-2 print:text-black">
              <span>🥗</span>
              Groentes & Salades
            </h3>
            <div className="flex items-end gap-4">
              <div>
                <div className="text-cream/70 text-sm mb-1 print:text-black">Gemiddelde voorkeur:</div>
                <div className="text-gold text-4xl font-bold print:text-black">
                  {averageVeggies.toFixed(1)}
                </div>
                <div className="text-cream/60 text-xs print:text-black">van 5</div>
              </div>
              <div className="flex-1">
                {/* Visual scale */}
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-8 rounded ${
                        level <= Math.round(averageVeggies)
                          ? 'bg-success-green print:bg-gray-400'
                          : 'bg-deep-green/40 print:bg-gray-200'
                      } border border-gold/20 print:border-black`}
                    />
                  ))}
                </div>
                <div className="text-cream/60 text-xs print:text-black">
                  {averageVeggies < 2.5 && 'Lage interesse'}
                  {averageVeggies >= 2.5 && averageVeggies < 3.5 && 'Gemiddelde interesse'}
                  {averageVeggies >= 3.5 && 'Hoge interesse'}
                </div>
              </div>
            </div>
          </div>

          {/* Sauces */}
          <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
            <h3 className="font-semibold text-cream text-lg mb-3 flex items-center gap-2 print:text-black">
              <span>🍯</span>
              Sauzen
            </h3>
            <div className="flex items-end gap-4">
              <div>
                <div className="text-cream/70 text-sm mb-1 print:text-black">Gemiddelde voorkeur:</div>
                <div className="text-gold text-4xl font-bold print:text-black">
                  {averageSauces.toFixed(1)}
                </div>
                <div className="text-cream/60 text-xs print:text-black">van 5</div>
              </div>
              <div className="flex-1">
                {/* Visual scale */}
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-8 rounded ${
                        level <= Math.round(averageSauces)
                          ? 'bg-gold print:bg-gray-400'
                          : 'bg-deep-green/40 print:bg-gray-200'
                      } border border-gold/20 print:border-black`}
                    />
                  ))}
                </div>
                <div className="text-cream/60 text-xs print:text-black">
                  {averageSauces < 2.5 && 'Mayo/ketchup niveau'}
                  {averageSauces >= 2.5 && averageSauces < 3.5 && 'Gemiddeld avontuurlijk'}
                  {averageSauces >= 3.5 && 'Chimichurri niveau'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-cream/70 text-sm print:text-black">
          <span className="font-semibold">Schaal uitleg:</span> 1 = minimaal, 3 = gemiddeld, 5 = maximaal
        </div>
      </div>
    </motion.div>
  );
}
