'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, Star, Target, Flame, ChevronRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

interface AIAssignment {
  officialTitle: string;
  task: string;
  reasoning: string;
  warningLevel: 'GROEN' | 'GEEL' | 'ORANJE' | 'ROOD';
  specialPrivilege: string;
}

interface HomeTabProps {
  formData: {
    name: string;
    hasPartner: boolean;
    partnerName?: string;
  };
  aiAssignment: AIAssignment | null;
  userPoints: number;
  userRank: number | string;
  isLoading: boolean;
  predictionsSubmitted: boolean;
  profileCompletion: {
    percentage: number;
    points: number;
    completedSections: string[];
  };
}

const WARNING_COLORS = {
  GROEN: 'bg-success-green',
  GEEL: 'bg-yellow-500',
  ORANJE: 'bg-orange-500',
  ROOD: 'bg-warm-red',
};

export function HomeTab({
  formData,
  aiAssignment,
  userPoints,
  userRank,
  isLoading,
  predictionsSubmitted,
  profileCompletion,
}: HomeTabProps) {
  return (
    <div className="space-y-4">
      {/* Points Summary - Compact */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-gold/10 to-gold/5 border-gold/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-gold" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-gold text-dark-wood text-xs font-bold px-1.5 py-0.5 rounded-full">
                    #{userRank}
                  </div>
                </div>
                <div>
                  <p className="text-cream/50 text-xs uppercase tracking-wider">Punten</p>
                  <p className="font-display text-3xl text-gold">
                    {isLoading ? '...' : userPoints}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs space-y-1">
                <div className="flex items-center justify-end gap-1">
                  <Star className="w-3 h-3 text-gold" />
                  <span className="text-cream/50">Registratie</span>
                  <span className="text-gold">+10</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Target className="w-3 h-3 text-gold" />
                  <span className="text-cream/50">Voorspellingen</span>
                  <span className={predictionsSubmitted ? 'text-gold' : 'text-cream/30'}>
                    {predictionsSubmitted ? '+5' : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Flame className="w-3 h-3 text-gold" />
                  <span className="text-cream/50">Quiz</span>
                  <span className="text-cream/30">31 jan</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Completion Card */}
      {profileCompletion.percentage < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/profile">
            <Card className="border-gold/30 hover:border-gold/50 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center relative">
                    <User className="w-6 h-6 text-gold" />
                    <svg
                      className="absolute inset-0 w-12 h-12"
                      viewBox="0 0 48 48"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-dark-wood"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${profileCompletion.percentage * 1.26} 126`}
                        strokeLinecap="round"
                        className="text-gold"
                        transform="rotate(-90 24 24)"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-cream">Profiel Aanvullen</p>
                      <span className="text-xs text-gold bg-gold/20 px-2 py-0.5 rounded-full">
                        +{200 - profileCompletion.points} punten
                      </span>
                    </div>
                    <p className="text-xs text-cream/60">
                      {profileCompletion.percentage}% compleet - verdien extra punten
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-cream/40" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* Assignment Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: profileCompletion.percentage < 100 ? 0.2 : 0.1 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Uw Toewijzing</CardTitle>
                <CardDescription className="text-xs">Namens de commissie</CardDescription>
              </div>
              {aiAssignment && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold text-dark-wood ${
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
              <div className="space-y-3">
                <div className="text-center py-3 bg-dark-wood/50 rounded-lg border border-gold/20">
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">
                    Officiële Titel
                  </p>
                  <h2 className="font-display text-xl text-gold">
                    {aiAssignment.officialTitle}
                  </h2>
                </div>
                <div className="bg-gold/10 rounded-lg p-3 border border-gold/20">
                  <p className="text-gold text-xs uppercase tracking-wider mb-1 font-semibold">
                    Taak
                  </p>
                  <p className="text-cream text-sm">{aiAssignment.task}</p>
                </div>
                <p className="text-cream/70 italic text-xs">
                  &ldquo;{aiAssignment.reasoning}&rdquo;
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-cream/50">Privilege:</span>
                  <span className="text-gold">{aiAssignment.specialPrivilege}</span>
                </div>
              </div>
            ) : (
              <p className="text-cream/50 text-sm">Toewijzing wordt geladen...</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Event Info - Compact */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Event Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="text-gold font-semibold">31 jan 2026</p>
                <p className="text-cream/50 text-xs">Zaterdag</p>
              </div>
              <div>
                <p className="text-gold font-semibold">14:00+</p>
                <p className="text-cream/50 text-xs">Aanvang</p>
              </div>
              <div>
                <p className="text-gold font-semibold">Bij Boy</p>
                <p className="text-cream/50 text-xs">Adres volgt</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gold/10 flex justify-between items-center text-sm">
              <div>
                <span className="text-cream/50">Kosten: </span>
                <span className="text-gold font-bold">€50 p.p.</span>
              </div>
              {formData.hasPartner && (
                <div className="text-right">
                  <span className="text-cream/50">Partner: </span>
                  <span className="text-gold">{formData.partnerName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
