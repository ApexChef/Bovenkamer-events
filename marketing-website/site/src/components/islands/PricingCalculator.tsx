/**
 * Pricing Calculator Island
 * Interactive pricing calculator with guest count slider
 */

import { useState } from 'react';
import { pricingCalculator } from '../../data/pricing';

export default function PricingCalculator() {
  const [guestCount, setGuestCount] = useState(pricingCalculator.defaultGuests);

  // Calculate price based on guest count
  const calculatePrice = (guests: number): { tier: string; price: number | null; label: string } => {
    if (guests < pricingCalculator.freeThreshold) {
      return {
        tier: 'free',
        price: 0,
        label: 'Gratis! 🎉',
      };
    } else if (guests >= pricingCalculator.vipThreshold) {
      return {
        tier: 'vip',
        price: null,
        label: 'VIP - Neem contact op',
      };
    } else {
      const total = guests * pricingCalculator.pricePerGuest;
      return {
        tier: 'feest',
        price: total,
        label: `€${total.toFixed(2).replace('.', ',')}`,
      };
    }
  };

  const result = calculatePrice(guestCount);

  // Get background gradient based on tier
  const getTierGradient = () => {
    switch (result.tier) {
      case 'free':
        return 'bg-gradient-to-br from-turquoise-50 to-turquoise-100 border-turquoise-300';
      case 'vip':
        return 'bg-gradient-to-br from-coral-50 to-coral-100 border-coral-300';
      default:
        return 'bg-gradient-to-br from-sunshine-50 to-sunshine-100 border-sunshine-300';
    }
  };

  // Get CTA button style and text based on tier
  const getCtaButton = () => {
    switch (result.tier) {
      case 'free':
        return {
          text: 'Start gratis',
          href: '/waitlist',
          className: 'bg-turquoise-500 hover:bg-turquoise-600 text-white',
        };
      case 'vip':
        return {
          text: 'Neem contact op',
          href: '/contact',
          className: 'bg-coral-500 hover:bg-coral-600 text-white',
        };
      default:
        return {
          text: 'Kies Feest',
          href: '/waitlist',
          className: 'bg-coral-500 hover:bg-coral-600 text-white',
        };
    }
  };

  const ctaButton = getCtaButton();

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-card">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-charcoal mb-2">
          Bereken je prijs
        </h3>
        <p className="text-base text-gray-600">
          Hoeveel gasten verwacht je?
        </p>
      </div>

      {/* Guest Count Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <label htmlFor="guest-slider" className="text-lg font-semibold text-charcoal">
            Aantal gasten
          </label>
          <div className="text-3xl font-bold text-coral-600">
            {guestCount}
          </div>
        </div>

        <input
          id="guest-slider"
          type="range"
          min={pricingCalculator.minGuests}
          max={pricingCalculator.maxGuests}
          value={guestCount}
          onChange={(e) => setGuestCount(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #FF6B6B 0%, #FF6B6B ${((guestCount - pricingCalculator.minGuests) / (pricingCalculator.maxGuests - pricingCalculator.minGuests)) * 100}%, #E5E5E5 ${((guestCount - pricingCalculator.minGuests) / (pricingCalculator.maxGuests - pricingCalculator.minGuests)) * 100}%, #E5E5E5 100%)`
          }}
        />

        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>{pricingCalculator.minGuests}</span>
          <span>{pricingCalculator.freeThreshold} (gratis limiet)</span>
          <span>{pricingCalculator.vipThreshold} (VIP)</span>
          <span>{pricingCalculator.maxGuests}</span>
        </div>
      </div>

      {/* Price Result */}
      <div className={`p-6 rounded-xl border-2 mb-6 transition-all duration-300 ${getTierGradient()}`}>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            {result.tier === 'free' && 'Gratis Plan'}
            {result.tier === 'feest' && 'Feest Plan'}
            {result.tier === 'vip' && 'VIP Plan'}
          </div>

          {/* Price Display with Animation */}
          <div className="text-4xl md:text-5xl font-bold text-charcoal mb-2 transition-all duration-300">
            {result.label}
          </div>

          {/* Calculation Details */}
          {result.tier === 'feest' && result.price !== null && (
            <div className="text-sm text-gray-600">
              {guestCount} gasten × €{pricingCalculator.pricePerGuest.toFixed(2).replace('.', ',')} per gast
            </div>
          )}

          {result.tier === 'free' && (
            <div className="text-sm text-gray-600">
              Tot {pricingCalculator.freeThreshold} gasten is gratis
            </div>
          )}

          {result.tier === 'vip' && (
            <div className="text-sm text-gray-600">
              Voor grote evenementen bieden we maatwerk
            </div>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <a
        href={ctaButton.href}
        className={`block w-full text-center px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-button hover:shadow-button-hover ${ctaButton.className}`}
      >
        {ctaButton.text}
      </a>

      {/* Additional Info */}
      <p className="text-sm text-gray-500 text-center mt-4">
        {result.tier === 'free' && 'Alle basisfeatures inbegrepen'}
        {result.tier === 'feest' && 'Eenmalige betaling per feest • Alle premium features'}
        {result.tier === 'vip' && 'Dedicated support en custom oplossingen'}
      </p>
    </div>
  );
}
