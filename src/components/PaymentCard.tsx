'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

interface PaymentStatus {
  id: string;
  amount_cents: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  tikkie_url: string | null;
  deadline: string | null;
  paid_at: string | null;
}

function formatCentsToEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Openstaand', color: 'text-yellow-500', icon: '○' },
  paid: { label: 'Betaald', color: 'text-success-green', icon: '✓' },
  expired: { label: 'Verlopen', color: 'text-warm-red', icon: '✗' },
  cancelled: { label: 'Geannuleerd', color: 'text-cream/50', icon: '—' },
};

interface PaymentCardProps {
  userId?: string;
}

export function PaymentCard({ userId }: PaymentCardProps) {
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          const userPayment = data.payments?.find((p: PaymentStatus) => true) || null;
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (error || !payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Betaling</CardTitle>
          <CardDescription>Deelnamekosten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gold text-xl">&euro;</span>
            </div>
            <p className="text-cream/70 mb-2">&euro;50 per persoon</p>
            <p className="text-cream/50 text-sm">Betaalverzoek volgt</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Betaling</CardTitle>
            <CardDescription>Deelnamekosten</CardDescription>
          </div>
          <span className={`text-2xl ${statusConfig.color}`}>
            {statusConfig.icon}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Amount */}
          <div className="text-center py-2 bg-dark-wood/50 rounded-lg">
            <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">Bedrag</p>
            <p className="font-display text-2xl text-gold">
              {formatCentsToEuros(payment.amount_cents)}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-cream/60">Status</span>
            <span className={statusConfig.color}>{statusConfig.label}</span>
          </div>

          {/* Deadline */}
          {payment.deadline && payment.status === 'pending' && (
            <div className="flex items-center justify-between">
              <span className="text-cream/60">Deadline</span>
              <span className="text-cream">
                {new Date(payment.deadline).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Paid date */}
          {payment.paid_at && (
            <div className="flex items-center justify-between">
              <span className="text-cream/60">Betaald op</span>
              <span className="text-success-green">
                {new Date(payment.paid_at).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
          )}

          {/* Pay button */}
          {payment.status === 'pending' && payment.tikkie_url && (
            <a
              href={payment.tikkie_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full">
                Betaal met Tikkie
              </Button>
            </a>
          )}

          {/* QR placeholder for pending */}
          {payment.status === 'pending' && !payment.tikkie_url && (
            <div className="text-center pt-2">
              <p className="text-cream/50 text-sm">Tikkie link volgt per email</p>
            </div>
          )}

          {/* Success message */}
          {payment.status === 'paid' && (
            <div className="text-center pt-2 text-success-green text-sm">
              Bedankt voor je betaling!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
