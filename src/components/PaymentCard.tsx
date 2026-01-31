'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, Button } from '@/components/ui';
import { Euro } from 'lucide-react';

interface PaymentRecord {
  id: string;
  amount_cents: number;
  status: 'pending' | 'processing' | 'paid' | 'expired' | 'cancelled';
  tikkie_url: string | null;
  deadline: string | null;
  paid_at: string | null;
}

const PRICE_PER_PERSON = 50; // €50 per person

function formatCentsToEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function getRelativePaymentTime(paidAt: string): { label: string; footnote: string } {
  const paid = new Date(paidAt);
  const now = new Date();
  const diffMs = now.getTime() - paid.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  const isToday = paid.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = paid.toDateString() === yesterday.toDateString();

  let label: string;
  if (diffMin < 5) {
    label = 'Zojuist betaald';
  } else if (diffMin < 60) {
    label = `${diffMin} minuten geleden betaald`;
  } else if (diffHours === 1) {
    label = 'Een uur geleden betaald';
  } else if (isToday && paid.getHours() < 12) {
    label = 'Vanochtend betaald';
  } else if (isToday) {
    label = 'Vanmiddag betaald';
  } else if (isYesterday) {
    label = 'Gisteren betaald';
  } else {
    label = `Betaald op ${paid.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}`;
  }

  const footnote = paid.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return { label, footnote };
}

interface PaymentCardProps {
  userId?: string;
  userName?: string;
  hasPartner?: boolean;
  partnerName?: string;
}

export function PaymentCard({ userId, userName, hasPartner = false, partnerName }: PaymentCardProps) {
  const firstName = userName?.split(' ')[0] || '';
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const numberOfPersons = hasPartner ? 2 : 1;
  const totalAmountCents = numberOfPersons * PRICE_PER_PERSON * 100;

  useEffect(() => {
    const fetchPayment = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payments?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const userPayment = data.payments?.[0] || null;
          if (userPayment) {
            setPayment(userPayment);
          }
        }
      } catch (err) {
        console.error('Error fetching payment:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [userId]);

  // User clicks "Ik heb betaald" — self-report to DB
  const handlePaymentConfirmed = async () => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch('/api/payments/self-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPayment((prev) => prev
          ? { ...prev, status: data.status }
          : {
              id: 'self-reported',
              amount_cents: totalAmountCents,
              status: data.status,
              tikkie_url: null,
              deadline: null,
              paid_at: null,
            }
        );
      }
    } catch (err) {
      console.error('Error reporting payment:', err);
    } finally {
      setIsUpdatingStatus(false);
      setShowModal(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const status = payment?.status || 'pending';
  const displayAmount = payment?.amount_cents || totalAmountCents;

  // Card when paid — show details, relative time, and amount
  if (status === 'paid') {
    const paidText = hasPartner && partnerName
      ? `Jij en ${partnerName} zijn helemaal geregeld`
      : 'Je bent helemaal geregeld';

    const timeInfo = payment?.paid_at ? getRelativePaymentTime(payment.paid_at) : null;

    return (
      <Card className="border-success-green/30 bg-dark-wood">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-green/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Euro className="w-5 h-5 text-success-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-success-green font-semibold">
                {firstName ? `Bedankt ${firstName}!` : 'Bedankt!'}
              </p>
              <p className="text-cream/50 text-xs">
                {paidText}
              </p>
            </div>
          </div>

          {/* Payment details */}
          <div className="mt-3 pt-3 border-t border-cream/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cream/40">Betaald via Tikkie</span>
              <span className="text-cream/70 font-medium">{formatCentsToEuros(displayAmount)}</span>
            </div>
            {timeInfo && (
              <div>
                <p className="text-cream/50 text-xs">{timeInfo.label}</p>
                <p className="text-cream/30 text-[10px] mt-0.5">{timeInfo.footnote}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Minimal card when processing (user said they paid, admin hasn't confirmed)
  if (status === 'processing') {
    return (
      <Card className="border-orange-400/30 bg-dark-wood">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-400/20 rounded-full flex items-center justify-center">
              <Euro className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-orange-400 font-semibold">
                {firstName ? `Top ${firstName}!` : 'Top!'}
              </p>
              <p className="text-cream/50 text-xs">
                We checken je betaling — even geduld
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full card with CTA for pending / no payment
  const ctaSubtext = hasPartner && partnerName
    ? `Voor jou en ${partnerName} — ${formatCentsToEuros(displayAmount)}`
    : `Jouw bijdrage — ${formatCentsToEuros(displayAmount)}`;

  return (
    <>
      <Card className="border-warm-red/30 bg-dark-wood">
        <CardContent className="py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warm-red/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Euro className="w-5 h-5 text-warm-red" />
              </div>
              <div>
                <p className="text-cream font-semibold">
                  {firstName ? `Hoi ${firstName}, nog even tikken!` : 'Nog even tikken!'}
                </p>
                <p className="text-cream/50 text-xs mt-0.5">
                  {ctaSubtext}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowModal(true)}
              className="w-full"
              size="lg"
            >
              Betaal via Tikkie
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-wood border border-gold/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="font-display text-2xl text-gold mb-2">
                  Tikkie tijd!
                </h3>
                <p className="text-cream/70 text-sm mb-4">
                  Scan de QR-code en tik {formatCentsToEuros(displayAmount)} over
                </p>

                <div className="bg-white rounded-xl p-4 inline-block mx-auto mb-4">
                  <Image
                    src="/tikkie-qr.png"
                    alt="Tikkie QR Code"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>

                <p className="text-cream/50 text-xs mb-6">
                  Vermeld &lsquo;{firstName || 'je naam'}&rsquo; bij de betaling
                </p>

                <Button
                  onClick={handlePaymentConfirmed}
                  className="w-full"
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? 'Even geduld...' : 'Geregeld, ik heb betaald!'}
                </Button>

                <button
                  onClick={() => setShowModal(false)}
                  className="mt-3 text-cream/50 hover:text-cream text-sm transition-colors"
                >
                  Doe ik later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
