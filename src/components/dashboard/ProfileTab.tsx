'use client';

import { motion } from 'framer-motion';
import { User, Mail, Users, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { PaymentCard } from '@/components/PaymentCard';

interface ProfileTabProps {
  formData: {
    name: string;
    email: string;
    hasPartner: boolean;
    partnerName?: string;
  };
}

export function ProfileTab({ formData }: ProfileTabProps) {
  return (
    <div className="space-y-4">
      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              Mijn Profiel
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
        transition={{ delay: 0.1 }}
      >
        <PaymentCard
          userId={formData.email}
          hasPartner={formData.hasPartner}
          partnerName={formData.partnerName}
        />
      </motion.div>

      {/* Registration Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
