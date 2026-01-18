'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar,
  Users,
  User,
  ChevronRight,
  Check,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';
import { TOTAL_PROFILE_POINTS } from '@/lib/store';

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
  profileCompletion,
}: HomeTabProps) {
  const [attendanceConfirmed, setAttendanceConfirmed] = useState<boolean | null>(null);
  const isProfileComplete = profileCompletion.percentage === 100;

  return (
    <div className="space-y-4">
      {/* Welcome & Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center py-2">
          <h2 className="font-display text-xl text-gold">
            Welkom, {formData.name}!
          </h2>
          <p className="text-cream/60 text-sm">
            {isProfileComplete
              ? 'Je profiel is compleet'
              : `Profiel ${profileCompletion.percentage}% compleet`
            }
          </p>
        </div>
      </motion.div>

      {/* Attendance Confirmation - Most Important */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-gold/40 bg-gradient-to-br from-gold/10 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-gold" />
              Zaterdag 31 januari 2026
            </CardTitle>
            <CardDescription>Bovenkamer Winterproef bij Boy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick event details */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-cream/70">
                <Clock className="w-4 h-4" />
                <span>Vanaf 14:00</span>
              </div>
              <div className="flex items-center gap-1.5 text-cream/70">
                <MapPin className="w-4 h-4" />
                <span>Adres volgt</span>
              </div>
            </div>

            {/* Attendance question */}
            <div className="pt-2 border-t border-gold/20">
              <p className="text-sm text-cream mb-3 font-medium">
                Kom je naar het feest?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAttendanceConfirmed(true)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    attendanceConfirmed === true
                      ? 'border-success-green bg-success-green/20 text-success-green'
                      : 'border-cream/20 text-cream/70 hover:border-gold/40'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Ja, ik kom!</span>
                </button>
                <button
                  onClick={() => setAttendanceConfirmed(false)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    attendanceConfirmed === false
                      ? 'border-warm-red bg-warm-red/20 text-warm-red'
                      : 'border-cream/20 text-cream/70 hover:border-gold/40'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Helaas niet</span>
                </button>
              </div>
            </div>

            {/* Partner question - only if attending */}
            {attendanceConfirmed === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-3 border-t border-gold/20"
              >
                <p className="text-sm text-cream mb-3 font-medium">
                  Kom je alleen of met iemand?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.hasPartner === false
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/70 hover:border-gold/40'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Alleen</span>
                  </button>
                  <button
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.hasPartner === true
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/70 hover:border-gold/40'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Met +1</span>
                  </button>
                </div>
                {formData.hasPartner && formData.partnerName && (
                  <p className="text-xs text-cream/50 mt-2 text-center">
                    Partner: {formData.partnerName}
                  </p>
                )}
              </motion.div>
            )}

            {/* Cost reminder */}
            {attendanceConfirmed === true && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-dark-wood/50 rounded-lg p-3 text-center"
              >
                <p className="text-sm text-cream/70">
                  Kosten: <span className="text-gold font-bold">€50</span> p.p.
                  {formData.hasPartner && (
                    <span className="text-cream/50"> (€100 totaal)</span>
                  )}
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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

      {/* AI Assignment - Only show if profile is complete */}
      {isProfileComplete && aiAssignment && (
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

      {/* Placeholder when profile not complete but would show assignment */}
      {!isProfileComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-dashed border-cream/20 bg-dark-wood/20">
            <CardContent className="py-8 text-center">
              <Sparkles className="w-8 h-8 text-cream/30 mx-auto mb-3" />
              <p className="text-cream/50 text-sm font-medium">
                Jouw officiële toewijzing
              </p>
              <p className="text-cream/30 text-xs mt-1">
                Vul eerst je profiel aan om je toewijzing te ontvangen
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
