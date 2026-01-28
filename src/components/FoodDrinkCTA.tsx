'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, AlertCircle, Check, ChevronRight, Star } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

// Points for completing food/drink preferences (must match food-drinks API)
const FOOD_DRINK_POINTS = 40;

interface CTAProps {
  variant?: 'card' | 'banner';
}

export function FoodDrinkCTA({ variant = 'card' }: CTAProps) {
  const { currentUser } = useAuthStore();
  const [status, setStatus] = useState<{
    selfComplete: boolean;
    partnerComplete: boolean;
    hasPartner: boolean;
    loading: boolean;
  }>({
    selfComplete: false,
    partnerComplete: false,
    hasPartner: false,
    loading: true,
  });

  useEffect(() => {
    if (!currentUser?.email) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/food-drinks?email=${encodeURIComponent(currentUser.email)}`);
        if (!response.ok) return;

        const data = await response.json();
        setStatus({
          selfComplete: !!data.selfPreference,
          partnerComplete: !!data.partnerPreference,
          hasPartner: data.hasPartner,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking food/drink status:', error);
        setStatus(s => ({ ...s, loading: false }));
      }
    };

    checkStatus();
  }, [currentUser?.email]);

  if (status.loading) {
    return null;
  }

  const isComplete = status.selfComplete && (!status.hasPartner || status.partnerComplete);
  const totalRequired = status.hasPartner ? 2 : 1;
  const totalComplete = (status.selfComplete ? 1 : 0) + (status.partnerComplete ? 1 : 0);
  const percentage = Math.round((totalComplete / totalRequired) * 100);

  if (variant === 'banner') {
    return (
      <Link
        href="/eten-drinken"
        className={`block p-4 rounded-lg border transition-colors ${
          isComplete
            ? 'bg-success-green/10 border-success-green/30 hover:bg-success-green/20'
            : 'bg-gold/10 border-gold/30 hover:bg-gold/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isComplete ? 'bg-success-green/20' : 'bg-gold/20'}`}>
              {isComplete ? (
                <Check className="text-success-green" size={20} />
              ) : (
                <UtensilsCrossed className="text-gold" size={20} />
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${isComplete ? 'text-success-green' : 'text-gold'}`}>
                Eten & Drinken
              </h3>
              <p className="text-sm text-cream/60">
                {isComplete
                  ? `+${FOOD_DRINK_POINTS} punten verdiend!`
                  : `Verdien ${FOOD_DRINK_POINTS} punten`}
              </p>
            </div>
          </div>
          <ChevronRight className="text-cream/40" size={20} />
        </div>
      </Link>
    );
  }

  // Card variant
  return (
    <div
      className={`p-5 rounded-xl border-2 ${
        isComplete
          ? 'bg-dark-wood border-success-green/40'
          : 'bg-dark-wood border-gold/40'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${isComplete ? 'bg-success-green/20' : 'bg-gold/20'}`}>
          {isComplete ? (
            <Check className="text-success-green" size={28} />
          ) : (
            <Star className="text-gold" size={28} />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${isComplete ? 'text-success-green' : 'text-gold'}`}>
            {isComplete ? 'Voorkeuren compleet!' : `Verdien ${FOOD_DRINK_POINTS} punten!`}
          </h3>
          <p className="text-sm text-cream/70 mt-1">
            {isComplete
              ? `+${FOOD_DRINK_POINTS} punten verdiend voor je BBQ voorkeuren.`
              : 'Vul je eet- en drinkvoorkeuren in voor de BBQ.'}
          </p>

          {!isComplete && status.hasPartner && (
            <>
              {/* Progress bar */}
              <div className="mt-3 h-2 bg-deep-green/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-cream/50 mt-1">
                {totalComplete}/{totalRequired} personen ingevuld
              </p>
            </>
          )}

          <Link
            href="/eten-drinken"
            className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
              isComplete
                ? 'bg-success-green/20 text-success-green hover:bg-success-green/30'
                : 'bg-gold text-deep-green hover:bg-gold/90'
            }`}
          >
            {isComplete ? 'Bekijken' : 'Invullen'}
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
