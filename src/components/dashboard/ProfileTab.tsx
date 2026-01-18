'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { User, Mail, Users, ChevronRight, Edit3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { PaymentCard } from '@/components/PaymentCard';
import { useRegistrationStore, SECTION_POINTS, TOTAL_PROFILE_POINTS } from '@/lib/store';

interface ProfileTabProps {
  formData: {
    name: string;
    email: string;
    hasPartner: boolean;
    partnerName?: string;
  };
}

export function ProfileTab({ formData }: ProfileTabProps) {
  const { getProfileCompletion, attendance } = useRegistrationStore();
  const { percentage, points } = getProfileCompletion();

  // Use attendance data for payment calculation (who is actually coming)
  const isComingWithPlusOne = attendance.bringingPlusOne === true;
  const plusOneName = attendance.plusOneName || formData.partnerName;

  return (
    <div className="space-y-4">
      {/* Profile Completion & Edit Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/profile">
          <Card className="border-gold/30 hover:border-gold/50 transition-colors cursor-pointer">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-cream font-semibold">Profiel Aanvullen</p>
                    <p className="text-cream/50 text-xs">{points} van {TOTAL_PROFILE_POINTS} punten</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gold" />
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-dark-wood rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-gold to-gold/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-cream/50 mt-2 text-center">
                {percentage === 100 ? 'Profiel compleet!' : `${percentage}% compleet - tik om aan te vullen`}
              </p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              Mijn Gegevens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-dark-wood/30 rounded-lg">
              <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-cream font-semibold">{formData.name}</p>
                <p className="text-cream/50 text-xs">Deelnemer</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-dark-wood/30 rounded-lg">
              <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-cream">{formData.email}</p>
                <p className="text-cream/50 text-xs">E-mail</p>
              </div>
            </div>

            {formData.hasPartner && (
              <div className="flex items-center gap-3 p-3 bg-dark-wood/30 rounded-lg">
                <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-cream">{formData.partnerName}</p>
                  <p className="text-cream/50 text-xs">Partner</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PaymentCard
          userId={formData.email}
          hasPartner={isComingWithPlusOne}
          partnerName={plusOneName}
        />
      </motion.div>

      {/* Registration Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-success-green/30 bg-success-green/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-green/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-success-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-cream font-semibold">Registratie compleet</p>
                <p className="text-cream/50 text-xs">Je staat op de gastenlijst voor 31 januari</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
