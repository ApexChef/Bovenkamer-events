'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  ChevronRight,
  Sparkles,
  Gamepad2,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { TOTAL_PROFILE_POINTS } from '@/lib/store';
import { FeatureToggle } from '@/components/FeatureToggle';

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
  predictionEvaluation: AIAssignment | null;
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

// Event date: January 31, 2026 at 16:00
const EVENT_DATE = new Date('2026-01-31T16:00:00');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const difference = EVENT_DATE.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export function HomeTab({
  formData,
  aiAssignment,
  predictionEvaluation,
  profileCompletion,
}: HomeTabProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const isProfileComplete = profileCompletion.percentage === 100;

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      {/* Countdown Timer */}
      <FeatureToggle feature="show_countdown">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
            <CardContent className="py-4">
              <p className="text-center text-sm text-cream/60 mb-3">
                Nog tot de Winterproef
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-dark-wood/50 rounded-lg p-3">
                  <p className="text-2xl sm:text-3xl font-bold text-gold">{timeLeft.days}</p>
                  <p className="text-xs text-cream/50">dagen</p>
                </div>
                <div className="bg-dark-wood/50 rounded-lg p-3">
                  <p className="text-2xl sm:text-3xl font-bold text-gold">{timeLeft.hours}</p>
                  <p className="text-xs text-cream/50">uren</p>
                </div>
                <div className="bg-dark-wood/50 rounded-lg p-3">
                  <p className="text-2xl sm:text-3xl font-bold text-gold">{timeLeft.minutes}</p>
                  <p className="text-xs text-cream/50">min</p>
                </div>
                <div className="bg-dark-wood/50 rounded-lg p-3">
                  <p className="text-2xl sm:text-3xl font-bold text-gold">{timeLeft.seconds}</p>
                  <p className="text-xs text-cream/50">sec</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </FeatureToggle>

      {/* Profile Completion CTA */}
      {!isProfileComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/profile">
            <Card className="border-gold/30 hover:border-gold/50 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center relative">
                    <User className="w-7 h-7 text-gold" />
                    <svg
                      className="absolute inset-0 w-14 h-14"
                      viewBox="0 0 56 56"
                    >
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-dark-wood"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${profileCompletion.percentage * 1.51} 151`}
                        strokeLinecap="round"
                        className="text-gold"
                        transform="rotate(-90 28 28)"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-cream">Vul je profiel aan</p>
                      <span className="text-xs text-gold bg-gold/20 px-2 py-0.5 rounded-full">
                        +{TOTAL_PROFILE_POINTS - profileCompletion.points} punten
                      </span>
                    </div>
                    <p className="text-xs text-cream/60 mt-1">
                      {profileCompletion.percentage}% compleet • Verdien punten voor het leaderboard
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-cream/40 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* AI Assignment - Show when assignment exists and feature enabled */}
      <FeatureToggle feature="show_ai_assignment">
        {aiAssignment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-gold/30 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-gold/10 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold" />
                    <CardTitle className="text-lg">Uw Officiële Toewijzing</CardTitle>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold text-dark-wood ${
                      WARNING_COLORS[aiAssignment.warningLevel]
                    }`}
                  >
                    {aiAssignment.warningLevel}
                  </span>
                </div>
                <CardDescription className="text-xs">Namens de commissie</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="text-center py-4 bg-dark-wood/50 rounded-lg border border-gold/20">
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">
                    Officiële Titel
                  </p>
                  <h2 className="font-display text-2xl text-gold">
                    {aiAssignment.officialTitle}
                  </h2>
                </div>
                <div className="bg-gold/10 rounded-lg p-4 border border-gold/20">
                  <p className="text-gold text-xs uppercase tracking-wider mb-2 font-semibold">
                    Uw Taak
                  </p>
                  <p className="text-cream">{aiAssignment.task}</p>
                </div>
                <p className="text-cream/70 italic text-sm px-2">
                  &ldquo;{aiAssignment.reasoning}&rdquo;
                </p>
                <div className="flex items-center gap-2 text-sm bg-dark-wood/30 rounded-lg p-3">
                  <span className="text-cream/50">Speciaal privilege:</span>
                  <span className="text-gold font-medium">{aiAssignment.specialPrivilege}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </FeatureToggle>

      {/* Prediction Evaluation Card */}
      <FeatureToggle feature="show_prediction_evaluation">
        {predictionEvaluation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <Card className="border-gold/30 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-gold/10 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gold" />
                    <CardTitle className="text-lg">Voorspellingen Evaluatie</CardTitle>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold text-dark-wood ${
                      WARNING_COLORS[predictionEvaluation.warningLevel]
                    }`}
                  >
                    {predictionEvaluation.warningLevel}
                  </span>
                </div>
                <CardDescription className="text-xs">Beoordeling door de commissie</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="text-center py-4 bg-dark-wood/50 rounded-lg border border-gold/20">
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">
                    Voorspeltitel
                  </p>
                  <h2 className="font-display text-2xl text-gold">
                    {predictionEvaluation.officialTitle}
                  </h2>
                </div>
                <div className="bg-gold/10 rounded-lg p-4 border border-gold/20">
                  <p className="text-gold text-xs uppercase tracking-wider mb-2 font-semibold">
                    Aanbeveling
                  </p>
                  <p className="text-cream">{predictionEvaluation.task}</p>
                </div>
                <p className="text-cream/70 italic text-sm px-2">
                  &ldquo;{predictionEvaluation.reasoning}&rdquo;
                </p>
                <div className="flex items-center gap-2 text-sm bg-dark-wood/30 rounded-lg p-3">
                  <span className="text-cream/50">Speciaal privilege:</span>
                  <span className="text-gold font-medium">{predictionEvaluation.specialPrivilege}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </FeatureToggle>

      {/* Burger Stack Game CTA - Lower priority, fun engagement */}
      <FeatureToggle feature="show_burger_game">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Link href="/game">
            <Card className="border-orange-500/40 bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-transparent hover:border-orange-500/60 transition-all cursor-pointer group overflow-hidden">
              <CardContent className="py-4 relative">
                {/* Background burger emoji decoration */}
                <div className="absolute -right-4 -top-4 text-6xl opacity-20 group-hover:opacity-30 transition-opacity transform rotate-12">
                  🍔
                </div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-3xl">🍔</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display text-lg text-orange-400 group-hover:text-orange-300 transition-colors">
                        Burger Stack
                      </p>
                      <span className="text-xs bg-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Verdien punten!
                      </span>
                    </div>
                    <p className="text-xs text-cream/60 mt-1">
                      Stapel de perfecte burger en scoor de hoogste punten
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Gamepad2 className="w-6 h-6 text-orange-400/70 group-hover:text-orange-400 transition-colors" />
                    <ChevronRight className="w-4 h-4 text-cream/40 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </FeatureToggle>
    </div>
  );
}
