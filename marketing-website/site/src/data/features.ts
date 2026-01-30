/**
 * Party Pilot - Features Data
 * Complete feature list with categories for different user perspectives
 */

export type FeatureCategory = 'organisator' | 'feestganger' | 'tijdens-feest';

export interface Feature {
  icon: string; // Lucide icon name
  title: string;
  description: string;
  category: FeatureCategory;
  featured?: boolean; // Show on homepage
  link?: {
    text: string;
    href: string;
  };
}

export const features: Feature[] = [
  // ORGANISATOR FEATURES (voor de host)
  {
    icon: 'Mail',
    title: 'Digitale uitnodigingen & registratie',
    description: 'Stuur professionele uitnodigingen via email of link. Gasten melden zich aan met één klik en jij hebt direct overzicht van wie komt.',
    category: 'organisator',
    featured: true,
  },
  {
    icon: 'UtensilsCrossed',
    title: 'Dieetwensen & allergieën',
    description: 'Verzamel automatisch alle dieetwensen en allergieën van je gasten. Geen ellenlange WhatsApp-gesprekken meer nodig.',
    category: 'organisator',
    featured: true,
  },
  {
    icon: 'ShoppingCart',
    title: 'Automatische boodschappenlijst',
    description: 'Op basis van het aantal gasten en hun dieetwensen genereert Party Pilot een exacte inkooplijst. Inclusief portieberekening en supermarkt-indeling.',
    category: 'organisator',
    featured: true,
  },
  {
    icon: 'ChefHat',
    title: 'Menuplanning met portieberekening',
    description: 'Plan je menu en bereken automatisch hoeveel je van elk gerecht nodig hebt. Geen voedselverspilling, iedereen heeft genoeg.',
    category: 'organisator',
    featured: true,
  },
  {
    icon: 'CreditCard',
    title: 'Betaling via Tikkie',
    description: 'Verzamel bijdragen eenvoudig via Tikkie-integratie. Stuur herinneringen en houd bij wie al betaald heeft.',
    category: 'organisator',
    featured: true,
  },
  {
    icon: 'Bot',
    title: 'AI taakverdeling',
    description: 'Laat de AI taken toewijzen aan je gasten op basis van hun skills en voorkeuren. Met een vleugje humor voor extra entertainment.',
    category: 'organisator',
  },
  {
    icon: 'Bell',
    title: 'E-mail notificaties',
    description: 'Automatische herinneringen naar gasten voor RSVP, betaling en belangrijke updates. Jij hoeft niets te onthouden.',
    category: 'organisator',
  },
  {
    icon: 'Star',
    title: 'Beoordelingen na het feest',
    description: 'Verzamel feedback van je gasten over de locatie, het eten en de sfeer. Leer van elk feest en maak de volgende nog beter.',
    category: 'organisator',
  },
  {
    icon: 'FileEdit',
    title: 'Formulieren zelf aanpassen',
    description: 'Pas registratieformulieren aan met je eigen vragen en velden. Maak het persoonlijk voor jouw feest.',
    category: 'organisator',
  },
  {
    icon: 'Users',
    title: 'Gastenlijst beheer',
    description: 'Overzichtelijke gastenlijst met status, dieetwensen, betaalinformatie en meer. Exporteer naar Excel of CSV.',
    category: 'organisator',
  },
  {
    icon: 'Calendar',
    title: 'Planning & timeline',
    description: 'Houd een tijdlijn bij met belangrijke momenten zoals RSVP-deadline, betalingstermijn en feestdatum.',
    category: 'organisator',
  },
  {
    icon: 'MessageSquare',
    title: 'Gastencommunicatie',
    description: 'Verstuur groepsberichten of persoonlijke updates naar specifieke gasten. Alles centraal georganiseerd.',
    category: 'organisator',
  },

  // FEESTGANGER FEATURES (voor de gast)
  {
    icon: 'Smartphone',
    title: 'Eenvoudige aanmelding',
    description: 'Aanmelden voor een feest gaat in enkele klikken. Geen account nodig, gewoon invullen en klaar.',
    category: 'feestganger',
  },
  {
    icon: 'Utensils',
    title: 'Dieetwensen delen',
    description: 'Deel je dieetwensen en allergieën eenvoudig met de organisator. Veilig en overzichtelijk.',
    category: 'feestganger',
  },
  {
    icon: 'Wallet',
    title: 'Makkelijk betalen',
    description: 'Betaal je bijdrage direct via Tikkie zonder gedoe. Krijg een bevestiging en herinnering indien nodig.',
    category: 'feestganger',
  },
  {
    icon: 'ClipboardList',
    title: 'Persoonlijke taak',
    description: 'Krijg een leuke taak toegewezen door de AI. Perfect afgestemd op jouw skills met een humoristische twist.',
    category: 'feestganger',
  },

  // TIJDENS HET FEEST FEATURES
  {
    icon: 'Trophy',
    title: 'Live quiz',
    description: 'Speel mee met een interactieve live quiz tijdens het feest. Vragen verschijnen op je telefoon, antwoorden in real-time.',
    category: 'tijdens-feest',
    featured: true,
  },
  {
    icon: 'Target',
    title: 'Voorspellingen & sweepstake',
    description: 'Laat gasten voorspellingen doen over het feest. Wie heeft aan het einde de meeste punten? Spanning gegarandeerd!',
    category: 'tijdens-feest',
  },
  {
    icon: 'Award',
    title: 'Punten & leaderboard',
    description: 'Verdien punten met quiz-vragen, voorspellingen en andere activiteiten. Wie staat bovenaan het leaderboard?',
    category: 'tijdens-feest',
  },
  {
    icon: 'Zap',
    title: 'Live updates',
    description: 'Deel live updates, foto\'s en momenten met alle gasten via de app. Creëer een gedeelde ervaring.',
    category: 'tijdens-feest',
  },
  {
    icon: 'Heart',
    title: 'Interactieve polls',
    description: 'Laat gasten stemmen op beslissingen tijdens het feest. Welk liedje volgende? Welk spel spelen we?',
    category: 'tijdens-feest',
  },
];

// Featured features for homepage (top 6)
export const featuredFeatures = features.filter(f => f.featured);

// Features grouped by category
export const featuresByCategory = {
  organisator: features.filter(f => f.category === 'organisator'),
  feestganger: features.filter(f => f.category === 'feestganger'),
  tijdensFeest: features.filter(f => f.category === 'tijdens-feest'),
};

// Category labels (Dutch)
export const categoryLabels: Record<FeatureCategory, string> = {
  organisator: 'Voor de organisator',
  feestganger: 'Voor de gast',
  'tijdens-feest': 'Tijdens het feest',
};
