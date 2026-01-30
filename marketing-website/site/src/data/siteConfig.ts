/**
 * Party Pilot - Site Configuration
 * Global site settings, metadata, and navigation
 */

export const siteConfig = {
  name: 'Party Pilot',
  tagline: 'Van uitnodiging tot afwas — alles voor je feest op één plek',
  description: 'Party Pilot is jouw persoonlijke feestplanner. Van uitnodigingen en dieetwensen tot boodschappenlijsten en live quizzen. Organiseer moeiteloos het perfecte feest.',
  url: 'https://partypilot.nl',

  // SEO & Social
  keywords: [
    'feest organiseren',
    'party planner',
    'digitale uitnodiging',
    'feest app',
    'bbq organiseren',
    'verjaardag plannen',
    'evenement organisatie',
    'feestplanner app',
    'gasten beheer',
    'dieetwensen',
    'inkooplijst',
    'live quiz feest',
  ],

  author: 'Party Pilot',
  language: 'nl-NL',

  // Open Graph / Social Media
  ogImage: '/images/og/og-image.jpg',
  twitterHandle: '@partypilot',

  // Contact
  email: 'info@partypilot.nl',
  supportEmail: 'support@partypilot.nl',

  // Social Media Links
  social: {
    twitter: 'https://twitter.com/partypilot',
    facebook: 'https://facebook.com/partypilot',
    instagram: 'https://instagram.com/partypilot',
    linkedin: 'https://linkedin.com/company/partypilot',
  },

  // Business Info
  company: {
    name: 'Party Pilot B.V.',
    address: 'Amsterdam, Nederland',
    kvk: '12345678',
    btw: 'NL123456789B01',
  },

  // App Links (future)
  appStore: {
    ios: '#',
    android: '#',
  },

  // Features
  features: {
    maxFreeGuests: 15,
    paidPricePerGuest: 2.50,
    currency: '€',
  },

  // Analytics (add actual IDs in production)
  analytics: {
    googleAnalyticsId: '', // GA4 measurement ID
    googleTagManagerId: '', // GTM container ID
  },

  // Legal
  legal: {
    privacyPolicyUrl: '/privacybeleid',
    termsUrl: '/algemene-voorwaarden',
  },
} as const;

export type SiteConfig = typeof siteConfig;
