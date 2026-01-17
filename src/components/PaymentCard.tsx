'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

interface PaymentStatus {
  id: string;
  amount_cents: number;
  status: 'pending' | 'processing' | 'paid' | 'expired' | 'cancelled';
  tikkie_url: string | null;
  deadline: string | null;
  paid_at: string | null;
  registrations?: {
    has_partner: boolean;
    partner_name: string | null;
  };
}

const PRICE_PER_PERSON = 50; // €50 per person

function formatCentsToEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: { label: 'Openstaand', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', icon: '○' },
  processing: { label: 'In behandeling', color: 'text-blue-400', bgColor: 'bg-blue-400/20', icon: '◐' },
  paid: { label: 'Betaald', color: 'text-success-green', bgColor: 'bg-success-green/20', icon: '✓' },
  expired: { label: 'Verlopen', color: 'text-warm-red', bgColor: 'bg-warm-red/20', icon: '✗' },
  cancelled: { label: 'Geannuleerd', color: 'text-cream/50', bgColor: 'bg-cream/10', icon: '—' },
};

interface PaymentCardProps {
  userId?: string;
  hasPartner?: boolean;
  partnerName?: string;
}

export function PaymentCard({ userId, hasPartner = false, partnerName }: PaymentCardProps) {
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Calculate number of persons and total amount
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
          // Get the user's payment from the list
          const userPayment = data.payments?.[0] || null;
          setPayment(userPayment);
        }
      } catch (err) {
        console.error('Error fetching payment:', err);
        setError('Kon betaalstatus niet ophalen');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [userId]);

  // Handle payment confirmed - set status to processing
  const handlePaymentConfirmed = async () => {
    // Only update if current status is pending and we have a payment ID
    if (payment?.id && payment.status === 'pending') {
      setIsUpdatingStatus(true);
      try {
        const response = await fetch(`/api/payments/${payment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'processing' }),
        });

        if (response.ok) {
          setPayment({ ...payment, status: 'processing' });
        }
      } catch (err) {
        console.error('Error updating payment status:', err);
      } finally {
        setIsUpdatingStatus(false);
        setShowModal(false);
      }
    } else {
      setShowModal(false);
    }
  };

  // Handle cancel - just close modal without updating status
  const handleCancel = () => {
    setShowModal(false);
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="py-8 text-center">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // Determine status - use payment status if available, otherwise pending
  const status = payment?.status || 'pending';
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const displayAmount = payment?.amount_cents || totalAmountCents;

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Betaling</CardTitle>
              <CardDescription>Deelnamekosten Winterproef</CardDescription>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.icon} {statusConfig.label}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Amount breakdown */}
            <div className="bg-dark-wood/50 rounded-lg p-4 border border-gold/20">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cream/70">Deelnemer</span>
                  <span className="text-cream">€{PRICE_PER_PERSON}</span>
                </div>
                {hasPartner && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cream/70">Partner{partnerName ? ` (${partnerName})` : ''}</span>
                    <span className="text-cream">€{PRICE_PER_PERSON}</span>
                  </div>
                )}
                <div className="border-t border-gold/20 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-cream/50 text-xs uppercase tracking-wider">Totaal ({numberOfPersons} {numberOfPersons === 1 ? 'persoon' : 'personen'})</span>
                    <span className="font-display text-2xl text-gold">
                      {formatCentsToEuros(displayAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Paid date */}
            {payment?.paid_at && status === 'paid' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-cream/60">Betaald op</span>
                <span className="text-success-green">
                  {new Date(payment.paid_at).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              </div>
            )}

            {/* CTA Button for pending payments */}
            {status === 'pending' && (
              <Button
                onClick={() => setShowModal(true)}
                className="w-full"
                size="lg"
              >
                Betalen via Tikkie
              </Button>
            )}

            {/* Processing message */}
            {status === 'processing' && (
              <div className="text-center py-3 bg-blue-400/10 rounded-lg border border-blue-400/20">
                <p className="text-blue-400 font-medium mb-1">Betaling in behandeling</p>
                <p className="text-cream/50 text-sm">
                  Je betaling wordt verwerkt. Dit kan even duren.
                </p>
              </div>
            )}

            {/* Success message */}
            {status === 'paid' && (
              <div className="text-center py-3 bg-success-green/10 rounded-lg border border-success-green/20">
                <div className="w-10 h-10 bg-success-green/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-success-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-success-green font-semibold">Bedankt voor je betaling!</p>
              </div>
            )}

            {/* Expired message */}
            {status === 'expired' && (
              <div className="text-center py-3 bg-warm-red/10 rounded-lg border border-warm-red/20">
                <p className="text-warm-red text-sm">
                  Betaling is verlopen. Neem contact op met de organisatie.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-wood border border-gold/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="font-display text-2xl text-gold mb-2">Betalen via Tikkie</h3>
                <p className="text-cream/70 text-sm mb-4">
                  Scan de QR-code met je camera of Tikkie app
                </p>

                {/* Amount display */}
                <div className="bg-gold/10 rounded-lg p-3 mb-4 border border-gold/20">
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">Te betalen</p>
                  <p className="font-display text-3xl text-gold">
                    {formatCentsToEuros(displayAmount)}
                  </p>
                </div>

                {/* QR Code */}
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
                  Vermeld je naam bij de betaling
                </p>

                {/* Confirm payment button */}
                <Button
                  onClick={handlePaymentConfirmed}
                  className="w-full"
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? 'Even geduld...' : 'Ik heb betaald'}
                </Button>

                <button
                  onClick={handleCancel}
                  className="mt-3 text-cream/50 hover:text-cream text-sm transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
