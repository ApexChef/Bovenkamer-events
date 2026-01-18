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

const DECLINE_REASONS = [
  { id: 'washing', label: 'Ik moet mijn haar wassen', emoji: '🧴' },
  { id: 'cat', label: 'Mijn kat heeft me nodig', emoji: '🐱' },
  { id: 'netflix', label: 'Netflix kijkt zichzelf niet', emoji: '📺' },
  { id: 'aliens', label: 'Buitenaardse ontvoering gepland', emoji: '👽' },
  { id: 'grandma', label: 'Oma belde, ze heeft wifi problemen', emoji: '👵' },
  { id: 'plants', label: 'Mijn planten hebben een feestje', emoji: '🌱' },
  { id: 'serious', label: 'Ik heb echt een goede reden...', emoji: '😢' },
];

export function HomeTab({
  formData,
  aiAssignment,
  profileCompletion,
}: HomeTabProps) {
  const [attendanceConfirmed, setAttendanceConfirmed] = useState<boolean | null>(null);
  const [bringingPlusOne, setBringingPlusOne] = useState<boolean | null>(null);
  const [plusOneName, setPlusOneName] = useState(formData.partnerName || '');
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const isProfileComplete = profileCompletion.percentage === 100;

  const totalCost = bringingPlusOne ? 100 : 50;

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
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-cream/70">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Vanaf 14:00</span>
              </div>
              <a
                href="https://maps.google.com/?q=Merseloseweg+158+Venray"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 text-cream/70 hover:text-gold transition-colors"
              >
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Merseloseweg 158, Venray</span>
              </a>
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
                    onClick={() => setBringingPlusOne(false)}
                    className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      bringingPlusOne === false
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/70 hover:border-gold/40'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Alleen</span>
                    <span className="text-xs opacity-70">€50</span>
                  </button>
                  <button
                    onClick={() => setBringingPlusOne(true)}
                    className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      bringingPlusOne === true
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-cream/20 text-cream/70 hover:border-gold/40'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Met +1</span>
                    <span className="text-xs opacity-70">€100</span>
                  </button>
                </div>

                {/* Plus one name input */}
                {bringingPlusOne === true && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3"
                  >
                    <label className="block text-sm text-cream/70 mb-1.5">
                      Naam van je +1
                    </label>
                    <input
                      type="text"
                      value={plusOneName}
                      onChange={(e) => setPlusOneName(e.target.value)}
                      placeholder="Wie neem je mee?"
                      className="w-full px-4 py-2.5 bg-dark-wood/50 border border-cream/20 rounded-lg text-cream placeholder:text-cream/30 text-sm focus:outline-none focus:border-gold/50"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Cost reminder - only when attending and selection made */}
            {attendanceConfirmed === true && bringingPlusOne !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-dark-wood/50 rounded-lg p-3 text-center"
              >
                <p className="text-sm text-cream/70">
                  Totaal: <span className="text-gold font-bold text-lg">€{totalCost}</span>
                  {bringingPlusOne && plusOneName && (
                    <span className="text-cream/50 block text-xs mt-1">
                      Jij + {plusOneName}
                    </span>
                  )}
                </p>
                <p className="text-xs text-cream/50 mt-2">
                  Betalen kan via Tikkie op je dashboard
                </p>
              </motion.div>
            )}

            {/* Decline reasons - sarcastic options */}
            {attendanceConfirmed === false && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-3 border-t border-gold/20"
              >
                <p className="text-sm text-cream mb-3 font-medium">
                  Jammer! Wat is je (smoes) reden?
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {DECLINE_REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setDeclineReason(reason.id)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all text-left ${
                        declineReason === reason.id
                          ? 'border-warm-red bg-warm-red/10 text-cream'
                          : 'border-cream/10 text-cream/60 hover:border-cream/30'
                      }`}
                    >
                      <span className="text-lg">{reason.emoji}</span>
                      <span className="text-sm">{reason.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom reason input for "serious" option */}
                {declineReason === 'serious' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3"
                  >
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Vertel ons je echte reden..."
                      className="w-full px-4 py-2 bg-dark-wood/50 border border-cream/20 rounded-lg text-cream placeholder:text-cream/30 text-sm focus:outline-none focus:border-gold/50"
                    />
                  </motion.div>
                )}

                {declineReason && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-cream/50 text-xs mt-3 italic"
                  >
                    We missen je! Mocht je van gedachten veranderen, je bent altijd welkom.
                  </motion.p>
                )}
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
