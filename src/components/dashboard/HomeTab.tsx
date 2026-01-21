'use client';

import { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  Edit3,
  X,
  Gamepad2,
  Trophy
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';
import { TOTAL_PROFILE_POINTS, useRegistrationStore, useAuthStore } from '@/lib/store';
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

// Event date: January 31, 2026 at 14:00
const EVENT_DATE = new Date('2026-01-31T14:00:00');

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
  profileCompletion,
}: HomeTabProps) {
  const { attendance, setAttendance } = useRegistrationStore();
  const { currentUser } = useAuthStore();
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [showPlusOneConfirmation, setShowPlusOneConfirmation] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // NOTE: We no longer auto-sync attendance from formData
  // Attendance is managed independently - user must explicitly choose in the form
  // The login flow handles restoring attendance for returning users who already answered
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const isProfileComplete = profileCompletion.percentage === 100;

  // Save attendance to database
  const saveAttendanceToDb = useCallback(async () => {
    if (!currentUser?.email || isSavingAttendance) return;

    setIsSavingAttendance(true);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          section: 'attendance',
          data: {
            attendanceConfirmed: attendance.confirmed,
            hasPartner: attendance.bringingPlusOne,
            partnerName: attendance.plusOneName || null,
          },
        }),
      });
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setIsSavingAttendance(false);
    }
  }, [currentUser?.email, attendance.confirmed, attendance.bringingPlusOne, attendance.plusOneName, isSavingAttendance]);

  const totalCost = attendance.bringingPlusOne ? 100 : 50;

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if attendance step is complete
  // - If not coming: just need confirmed = false
  // - If coming alone: need confirmed = true AND bringingPlusOne = false
  // - If coming with +1: need confirmed = true AND bringingPlusOne = true AND plusOneName filled
  const isAttendanceComplete = attendance.confirmed !== null && (
    attendance.confirmed === false ||
    (attendance.bringingPlusOne === false) ||
    (attendance.bringingPlusOne === true && attendance.plusOneName.trim() !== '')
  );

  // Get first name for personalized greeting
  const firstName = formData.name?.split(' ')[0] || 'daar';

  const handleAttendanceChange = (confirmed: boolean) => {
    setAttendance({ confirmed });
    if (!confirmed) {
      // Reset plus one when declining
      setAttendance({ bringingPlusOne: null, plusOneName: '' });
    }
  };

  const handlePlusOneChange = (bringingPlusOne: boolean) => {
    setAttendance({ bringingPlusOne });
    if (!bringingPlusOne) {
      setAttendance({ plusOneName: '' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Attendance Summary - Show when complete and not editing */}
      {isAttendanceComplete && !isEditingAttendance && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`border-2 ${attendance.confirmed ? 'border-success-green/40' : 'border-warm-red/40'}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    attendance.confirmed ? 'bg-success-green/20' : 'bg-warm-red/20'
                  }`}>
                    {attendance.confirmed ? (
                      <Check className="w-5 h-5 text-success-green" />
                    ) : (
                      <X className="w-5 h-5 text-warm-red" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${attendance.confirmed ? 'text-success-green' : 'text-warm-red'}`}>
                      {attendance.confirmed
                        ? attendance.bringingPlusOne
                          ? `Jij en ${attendance.plusOneName || 'je +1'} komen naar de Winterproef!`
                          : `Je komt naar de Winterproef!`
                        : 'Je komt helaas niet'
                      }
                    </p>
                    <p className="text-xs text-cream/60">
                      {attendance.confirmed
                        ? `Totaal: €${attendance.bringingPlusOne ? '100' : '50'}`
                        : DECLINE_REASONS.find(r => r.id === attendance.declineReason)?.label || ''
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingAttendance(true)}
                  className="p-2 text-cream/50 hover:text-gold transition-colors"
                  aria-label="Wijzigen"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Quick event info */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-cream/10 text-xs text-cream/50">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>31 jan 2026</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>14:00</span>
                </div>
                <a
                  href="https://maps.google.com/?q=Merseloseweg+158+Venray"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-gold transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Venray</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Attendance Form - Show when not complete OR when editing */}
      {(!isAttendanceComplete || isEditingAttendance) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-gold/40 bg-gradient-to-br from-gold/10 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-gold" />
                    Zaterdag 31 januari 2026
                  </CardTitle>
                  <CardDescription>Bovenkamer Winterproef bij Boy</CardDescription>
                </div>
                {isEditingAttendance && (
                  <button
                    onClick={() => setIsEditingAttendance(false)}
                    className="p-2 text-cream/50 hover:text-cream transition-colors"
                    aria-label="Sluiten"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
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
                  Hey {firstName}, kom je ook naar het feest?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAttendanceChange(true)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      attendance.confirmed === true
                        ? 'border-success-green bg-success-green/20 text-success-green'
                        : 'border-cream/20 text-cream/70 hover:border-gold/40'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span className="font-medium">Ja, ik kom!</span>
                  </button>
                  <button
                    onClick={() => handleAttendanceChange(false)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      attendance.confirmed === false
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
              {attendance.confirmed === true && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-3 border-t border-gold/20"
                >
                  <p className="text-sm text-cream mb-3 font-medium">
                    Neem je iemand mee?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePlusOneChange(false)}
                      className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        attendance.bringingPlusOne === false
                          ? 'border-gold bg-gold/20 text-gold'
                          : 'border-cream/20 text-cream/70 hover:border-gold/40'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Alleen</span>
                      <span className="text-xs opacity-70">€50</span>
                    </button>
                    <button
                      onClick={() => handlePlusOneChange(true)}
                      className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        attendance.bringingPlusOne === true
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
                  {attendance.bringingPlusOne === true && (
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
                        value={attendance.plusOneName}
                        onChange={(e) => setAttendance({ plusOneName: e.target.value })}
                        placeholder="Wie neem je mee?"
                        className="w-full px-4 py-2.5 bg-dark-wood/50 border border-cream/20 rounded-lg text-cream placeholder:text-cream/30 text-sm focus:outline-none focus:border-gold/50"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Summary and save button when attending and selection made */}
              {attendance.confirmed === true && attendance.bringingPlusOne !== null && !showPlusOneConfirmation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 pt-3 border-t border-gold/20"
                >
                  <div className="bg-dark-wood/50 rounded-lg p-3 text-center">
                    <p className="text-sm text-cream/70">
                      Totaal: <span className="text-gold font-bold text-lg">€{totalCost}</span>
                      {attendance.bringingPlusOne && attendance.plusOneName && (
                        <span className="text-cream/50 block text-xs mt-1">
                          Jij + {attendance.plusOneName}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (attendance.bringingPlusOne && attendance.plusOneName.trim()) {
                        // Show confirmation for +1
                        setShowPlusOneConfirmation(true);
                      } else {
                        // Coming alone - save to database
                        setIsEditingAttendance(false);
                        saveAttendanceToDb();
                      }
                    }}
                    disabled={attendance.bringingPlusOne && !attendance.plusOneName.trim()}
                    className="w-full py-2.5 bg-gold/20 border border-gold/30 rounded-lg text-gold font-medium hover:bg-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Opslaan
                  </button>
                  {attendance.bringingPlusOne && !attendance.plusOneName.trim() && (
                    <p className="text-xs text-cream/50 text-center">
                      Vul eerst de naam van je +1 in
                    </p>
                  )}
                </motion.div>
              )}

              {/* Sarcastic confirmation dialog for +1 */}
              {showPlusOneConfirmation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="pt-3 border-t border-gold/20"
                >
                  <div className="bg-dark-wood/70 rounded-lg p-4 space-y-4">
                    <p className="text-cream text-sm">
                      Hé {firstName}, wil je echt <span className="text-gold font-medium">{attendance.plusOneName}</span> meenemen?
                      Het hoeft niet per se hè. Je mag ook iemand anders meenemen.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setShowPlusOneConfirmation(false);
                          setIsEditingAttendance(false);
                          saveAttendanceToDb();
                        }}
                        className="py-2.5 bg-success-green/20 border border-success-green/30 rounded-lg text-success-green font-medium hover:bg-success-green/30 transition-colors text-sm"
                      >
                        Ja, toch wel
                      </button>
                      <button
                        onClick={() => {
                          setShowPlusOneConfirmation(false);
                          setAttendance({ plusOneName: '' });
                        }}
                        className="py-2.5 bg-warm-red/20 border border-warm-red/30 rounded-lg text-warm-red font-medium hover:bg-warm-red/30 transition-colors text-sm"
                      >
                        Nee, iemand anders
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Decline reasons - sarcastic options */}
              {attendance.confirmed === false && (
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
                        onClick={() => setAttendance({ declineReason: reason.id })}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all text-left ${
                          attendance.declineReason === reason.id
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
                  {attendance.declineReason === 'serious' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3"
                    >
                      <input
                        type="text"
                        value={attendance.customDeclineReason}
                        onChange={(e) => setAttendance({ customDeclineReason: e.target.value })}
                        placeholder="Vertel ons je echte reden..."
                        className="w-full px-4 py-2 bg-dark-wood/50 border border-cream/20 rounded-lg text-cream placeholder:text-cream/30 text-sm focus:outline-none focus:border-gold/50"
                      />
                    </motion.div>
                  )}

                  {attendance.declineReason && (
                    <>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-cream/50 text-xs mt-3 italic"
                      >
                        We missen je! Mocht je van gedachten veranderen, je bent altijd welkom.
                      </motion.p>
                      {isEditingAttendance && (
                        <button
                          onClick={() => {
                            setIsEditingAttendance(false);
                            saveAttendanceToDb();
                          }}
                          className="w-full mt-3 py-2.5 bg-warm-red/20 border border-warm-red/30 rounded-lg text-warm-red font-medium hover:bg-warm-red/30 transition-colors"
                        >
                          Opslaan
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

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

      {/* AI Assignment - Only show if profile is complete and feature enabled */}
      <FeatureToggle feature="show_ai_assignment">
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
