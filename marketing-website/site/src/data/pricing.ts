/**
 * Party Pilot - Pricing Data
 * Freemium pricing model with tiers
 */

export interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: {
    amount: number | null; // null for custom pricing
    unit: string;
    period?: string;
  };
  features: PricingFeature[];
  cta: {
    text: string;
    href: string;
    variant: 'primary' | 'secondary' | 'ghost';
  };
  popular?: boolean;
  maxGuests?: number;
  highlight?: string;
}

export const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Gratis',
    description: 'Perfect voor kleinere feestjes en om Party Pilot te proberen',
    price: {
      amount: 0,
      unit: '€',
      period: 'per feest',
    },
    maxGuests: 15,
    features: [
      { text: 'Tot 15 gasten', included: true },
      { text: 'Digitale uitnodigingen', included: true },
      { text: 'Dieetwensen verzamelen', included: true },
      { text: 'Basis inkooplijst', included: true },
      { text: 'RSVP beheer', included: true },
      { text: 'E-mail notificaties', included: true },
      { text: 'Live quiz', included: false },
      { text: 'Voorspellingen & punten', included: false },
      { text: 'Tikkie-integratie', included: false },
      { text: 'AI taakverdeling', included: false },
      { text: 'Geavanceerde menuplanning', included: false },
      { text: 'Formulieren aanpassen', included: false },
    ],
    cta: {
      text: 'Start gratis',
      href: '/waitlist',
      variant: 'secondary',
    },
  },
  {
    id: 'feest',
    name: 'Feest',
    description: 'Voor serieuze feestorganisatoren met grotere groepen',
    price: {
      amount: 2.50,
      unit: '€',
      period: 'per gast',
    },
    popular: true,
    highlight: 'Meest gekozen',
    features: [
      { text: 'Vanaf 15 gasten', included: true },
      { text: 'Alle gratis functies', included: true },
      { text: 'Live quiz met scoreboard', included: true },
      { text: 'Voorspellingen & sweepstake', included: true },
      { text: 'Punten & leaderboard', included: true },
      { text: 'Tikkie-integratie', included: true },
      { text: 'AI taakverdeling met humor', included: true },
      { text: 'Geavanceerde menuplanning', included: true },
      { text: 'Portieberekening', included: true },
      { text: 'Formulieren aanpassen', included: true },
      { text: 'Prioriteit support', included: true },
      { text: 'Export gastenlijst', included: true },
    ],
    cta: {
      text: 'Kies Feest',
      href: '/waitlist',
      variant: 'primary',
    },
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Voor grote evenementen en bedrijven met speciale wensen',
    price: {
      amount: null,
      unit: 'Op aanvraag',
    },
    maxGuests: 100,
    highlight: 'Voor events 100+ gasten',
    features: [
      { text: '100+ gasten', included: true },
      { text: 'Alle Feest functies', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Persoonlijke onboarding', included: true },
      { text: 'Custom branding', included: true },
      { text: 'API toegang', included: true },
      { text: 'Prioriteit feature requests', included: true },
      { text: 'SLA garantie', included: true },
      { text: 'Facturering op maat', included: true },
      { text: 'Training sessies', included: true },
      { text: 'Account manager', included: true },
      { text: 'White-label optie', included: true, tooltip: 'Jouw branding op de app' },
    ],
    cta: {
      text: 'Neem contact op',
      href: '/contact',
      variant: 'secondary',
    },
  },
];

// Pricing FAQ
export const pricingFAQ = [
  {
    question: 'Hoe werkt de prijsberekening voor het Feest plan?',
    answer: 'Je betaalt €2,50 per gast die zich aanmeldt voor je feest. Bij 20 gasten betaal je bijvoorbeeld €50. Simpel en transparant, geen verborgen kosten.',
  },
  {
    question: 'Kan ik switchen tussen plannen?',
    answer: 'Ja! Je kunt altijd upgraden naar een groter plan als je feest groeit. Downgraden kan ook, maar let op dat sommige functies dan niet meer beschikbaar zijn.',
  },
  {
    question: 'Moet ik meteen betalen?',
    answer: 'Nee, je kunt eerst gratis starten met tot 15 gasten. Pas als je meer gasten uitnodigt of premium functies wilt gebruiken, upgrade je naar Feest.',
  },
  {
    question: 'Wat gebeurt er na het feest?',
    answer: 'Je gegevens blijven 30 dagen beschikbaar voor inzage. Daarna worden ze gearchiveerd. Je kunt altijd een nieuwe feest aanmaken.',
  },
  {
    question: 'Is er een abonnement?',
    answer: 'Nee! Je betaalt per feest, niet per maand. Organiseer je geen feest, dan betaal je ook niets.',
  },
  {
    question: 'Krijg ik korting bij meerdere feesten?',
    answer: 'Voor het VIP plan kunnen we maatwerk leveren. Neem contact op voor zakelijke afspraken of reguliere grote events.',
  },
];

// Pricing calculator config
export const pricingCalculator = {
  minGuests: 1,
  maxGuests: 200,
  defaultGuests: 30,
  pricePerGuest: 2.50,
  freeThreshold: 15,
  vipThreshold: 100,
} as const;
