/**
 * Party Pilot - Navigation Structure
 * Main navigation and footer links
 */

export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
  description?: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

// Main navigation (header)
export const mainNavigation: NavigationItem[] = [
  {
    label: 'Functies',
    href: '/functies',
    description: 'Ontdek alle functies van Party Pilot',
  },
  {
    label: 'Hoe werkt het?',
    href: '/hoe-werkt-het',
    description: 'Leer hoe Party Pilot werkt in 3 stappen',
  },
  {
    label: 'Prijzen',
    href: '/prijzen',
    description: 'Bekijk onze prijzen en kies een plan',
  },
  {
    label: 'FAQ',
    href: '/faq',
    description: 'Veelgestelde vragen',
  },
  {
    label: 'Contact',
    href: '/contact',
    description: 'Neem contact met ons op',
  },
];

// Footer navigation sections
export const footerNavigation: NavigationSection[] = [
  {
    title: 'Product',
    items: [
      { label: 'Functies', href: '/functies' },
      { label: 'Hoe werkt het?', href: '/hoe-werkt-het' },
      { label: 'Prijzen', href: '/prijzen' },
      { label: 'Demo', href: '/demo' },
      { label: 'Waitlist', href: '/waitlist' },
    ],
  },
  {
    title: 'Bedrijf',
    items: [
      { label: 'Over ons', href: '/over-ons' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
      { label: 'Werken bij', href: '/werken-bij' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Help Center', href: '/help' },
      { label: 'Status', href: 'https://status.partypilot.nl', external: true },
      { label: 'Privacybeleid', href: '/privacybeleid' },
      { label: 'Algemene voorwaarden', href: '/algemene-voorwaarden' },
    ],
  },
  {
    title: 'Volg ons',
    items: [
      { label: 'Twitter', href: 'https://twitter.com/partypilot', external: true },
      { label: 'Facebook', href: 'https://facebook.com/partypilot', external: true },
      { label: 'Instagram', href: 'https://instagram.com/partypilot', external: true },
      { label: 'LinkedIn', href: 'https://linkedin.com/company/partypilot', external: true },
    ],
  },
];

// CTA Buttons
export const ctaButtons = {
  primary: {
    label: 'Start gratis',
    href: '/waitlist',
  },
  secondary: {
    label: 'Bekijk demo',
    href: '/demo',
  },
} as const;
