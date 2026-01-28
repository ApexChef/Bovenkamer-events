'use client';

import { motion } from 'framer-motion';
import type { DietaryGroups } from '@/types';

interface DietaryWarningsProps {
  groups: DietaryGroups;
}

export function DietaryWarnings({ groups }: DietaryWarningsProps) {
  const hasAllergies = groups.allergies.length > 0;
  const hasVegVegan = groups.vegetarian.length > 0 || groups.vegan.length > 0;
  const hasOther = groups.other.length > 0;

  // Don't render if no dietary requirements
  if (!hasAllergies && !hasVegVegan && !hasOther) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 print:page-break-inside-avoid"
    >
      <div className="bg-dark-wood/80 border border-gold/20 rounded-lg p-6 print:border-black print:p-4">
        <h2 className="font-display text-2xl text-gold mb-4 flex items-center gap-2 print:text-xl print:text-black">
          <span>⚠️</span>
          Dieetwensen & Allergieën
        </h2>

        {/* Allergies - Most prominent */}
        {hasAllergies && (
          <div className="mb-6 bg-warm-red/20 border-2 border-warm-red rounded-lg p-4 print:border-black">
            <h3 className="font-semibold text-warm-red text-lg mb-3 flex items-center gap-2 print:text-black">
              <span>🚫</span>
              ALLERGIEËN & INTOLERANTIES
            </h3>
            <ul className="space-y-2">
              {groups.allergies.map((person, idx) => (
                <li key={idx} className="text-cream print:text-black">
                  <span className="font-semibold">
                    {person.name}{person.isPartner && ' (partner)'}:
                  </span>{' '}
                  <span className="text-warm-red font-medium print:text-black">
                    {person.details}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vegetarian & Vegan */}
        {hasVegVegan && (
          <div className="mb-6 bg-gold/10 border border-gold/30 rounded-lg p-4 print:border-black">
            <h3 className="font-semibold text-gold text-lg mb-3 flex items-center gap-2 print:text-black">
              <span>🥗</span>
              Vegetarisch & Veganistisch
            </h3>
            <div className="space-y-3">
              {groups.vegan.length > 0 && (
                <div>
                  <div className="text-cream/80 font-medium mb-1 print:text-black">
                    Veganistisch ({groups.vegan.length}):
                  </div>
                  <ul className="list-disc list-inside text-cream print:text-black">
                    {groups.vegan.map((person, idx) => (
                      <li key={idx}>
                        {person.name}{person.isPartner && ' (partner)'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {groups.vegetarian.length > 0 && (
                <div>
                  <div className="text-cream/80 font-medium mb-1 print:text-black">
                    Vegetarisch ({groups.vegetarian.length}):
                  </div>
                  <ul className="list-disc list-inside text-cream print:text-black">
                    {groups.vegetarian.map((person, idx) => (
                      <li key={idx}>
                        {person.name}{person.isPartner && ' (partner)'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other dietary requirements */}
        {hasOther && (
          <div className="bg-deep-green/30 border border-cream/20 rounded-lg p-4 print:border-black">
            <h3 className="font-semibold text-cream text-lg mb-3 flex items-center gap-2 print:text-black">
              <span>📝</span>
              Overige Opmerkingen
            </h3>
            <ul className="space-y-2">
              {groups.other.map((person, idx) => (
                <li key={idx} className="text-cream print:text-black">
                  <span className="font-semibold">
                    {person.name}{person.isPartner && ' (partner)'}:
                  </span>{' '}
                  {person.details}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
