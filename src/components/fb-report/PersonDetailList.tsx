'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PersonPreference } from '@/types';
import { formatWinePreference } from '@/lib/fb-calculations';

interface PersonDetailListProps {
  persons: PersonPreference[];
}

export function PersonDetailList({ persons }: PersonDetailListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group persons by userId (participant + partner)
  const groupedPersons = persons.reduce((acc, person) => {
    const key = person.personType === 'self' ? person.userId : person.userId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(person);
    return acc;
  }, {} as Record<string, PersonPreference[]>);

  const groups = Object.values(groupedPersons);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-6"
    >
      <div className="bg-dark-wood/80 border border-gold/20 rounded-lg print:border-black">
        {/* Header with toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-deep-green/20 transition-colors print:hidden"
        >
          <h2 className="font-display text-2xl text-gold">
            Detail per Persoon ({persons.length})
          </h2>
          {isExpanded ? (
            <ChevronUp className="w-6 h-6 text-gold" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gold" />
          )}
        </button>

        {/* Print-only header */}
        <div className="hidden print:block p-4 border-b border-black">
          <h2 className="font-display text-xl text-black">
            Detail per Persoon ({persons.length})
          </h2>
        </div>

        {/* Content */}
        <AnimatePresence>
          {(isExpanded || true) && ( // Always show for print
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden print:!h-auto print:!opacity-100"
            >
              <div className="p-6 pt-0 print:p-4 space-y-4">
                {groups.map((group, idx) => (
                  <PersonGroup key={idx} persons={group} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PersonGroup({ persons }: { persons: PersonPreference[] }) {
  const self = persons.find((p) => p.personType === 'self');
  const partner = persons.find((p) => p.personType === 'partner');

  return (
    <div className="bg-deep-green/20 rounded-lg p-4 space-y-3 print:border print:border-black print:page-break-inside-avoid">
      {self && <PersonDetail person={self} />}
      {partner && <PersonDetail person={partner} isPartner />}
    </div>
  );
}

function PersonDetail({ person, isPartner = false }: { person: PersonPreference; isPartner?: boolean }) {
  return (
    <div className={isPartner ? 'pl-4 border-l-2 border-gold/30 print:border-black' : ''}>
      {/* Name */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-cream text-lg print:text-black">
          {person.name}
        </h3>
        {isPartner && (
          <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded print:bg-gray-200 print:text-black">
            Partner
          </span>
        )}
      </div>

      {/* Dietary requirements */}
      {person.dietaryRequirements && (
        <div className="mb-2 text-sm">
          <span className="text-cream/70 print:text-black">Dieet:</span>{' '}
          <span className="text-warm-red font-medium print:text-black">{person.dietaryRequirements}</span>
        </div>
      )}

      {/* Meat distribution */}
      <div className="mb-2 text-sm">
        <span className="text-cream/70 print:text-black">Vlees:</span>{' '}
        <span className="text-cream print:text-black">
          {Object.entries(person.meatDistribution)
            .filter(([, pct]) => pct > 0)
            .map(([type, pct]) => {
              const labels: Record<string, string> = {
                pork: 'varken',
                beef: 'rund',
                chicken: 'kip',
                game: 'wild',
                fish: 'vis',
                vegetarian: 'vega',
              };
              return `${pct}% ${labels[type]}`;
            })
            .join(', ')}
        </span>
      </div>

      {/* Drinks */}
      <div className="mb-2 text-sm">
        <span className="text-cream/70 print:text-black">Drank:</span>{' '}
        <span className="text-cream print:text-black">
          {Object.entries(person.drinkDistribution)
            .filter(([, pct]) => pct > 0)
            .map(([type, pct]) => {
              const labels: Record<string, string> = {
                softDrinks: 'fris',
                wine: 'wijn',
                beer: 'bier',
              };
              let detail = '';
              if (type === 'wine' && person.winePreference !== null) {
                detail = ` (${formatWinePreference(person.winePreference)})`;
              } else if (type === 'beer' && person.beerType) {
                detail = ` (${person.beerType})`;
              } else if (type === 'softDrinks' && person.softDrinkPreference) {
                detail = ` (${person.softDrinkPreference})`;
              }
              return `${pct}% ${labels[type]}${detail}`;
            })
            .join(', ')}
        </span>
      </div>

      {/* Bubbles */}
      {person.startsWithBubbles && (
        <div className="mb-2 text-sm">
          <span className="text-cream/70 print:text-black">Aperitief:</span>{' '}
          <span className="text-cream print:text-black">
            Ja, {person.bubbleType || 'geen voorkeur'}
          </span>
        </div>
      )}

      {/* Sides */}
      <div className="text-sm">
        <span className="text-cream/70 print:text-black">Bijgerechten:</span>{' '}
        <span className="text-cream print:text-black">
          Groenten {person.veggiesPreference}/5, Sauzen {person.saucesPreference}/5
        </span>
      </div>
    </div>
  );
}
