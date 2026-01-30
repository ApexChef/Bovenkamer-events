/**
 * Party Pilot - Testimonials Data
 * Real user testimonials with ratings
 */

export interface Testimonial {
  name: string;
  role?: string; // Optional job title or description
  eventType: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
  avatar?: string; // Optional avatar image URL
  featured?: boolean; // Show on homepage
  location?: string; // Optional location
}

export const testimonials: Testimonial[] = [
  {
    name: 'Mark van der Linden',
    eventType: '50e verjaardag',
    quote: 'Party Pilot heeft mijn verjaardagsfeest van stress naar succes getransformeerd. De automatische inkooplijst was spot-on, en de quiz was de hit van de avond!',
    rating: 5,
    featured: true,
    location: 'Amsterdam',
  },
  {
    name: 'Sanne Jacobs',
    eventType: 'Zomerbbq',
    quote: 'Eindelijk een app die snapt dat iedereen andere dieetwensen heeft. Geen handmatige lijstjes meer, alles automatisch geregeld. Top!',
    rating: 5,
    featured: true,
    location: 'Utrecht',
  },
  {
    name: 'Bas Willems',
    eventType: 'Bedrijfsborrel',
    quote: 'Als bedrijf hebben we Party Pilot gebruikt voor ons teamuitje. De Tikkie-integratie maakte het super makkelijk om bijdragen te verzamelen. Aanrader!',
    rating: 5,
    featured: false,
    location: 'Rotterdam',
  },
  {
    name: 'Linda de Groot',
    eventType: 'Housewarming',
    quote: 'De AI taakverdeling is hilarisch én nuttig. Iedereen kreeg een taak die perfect paste, en het zorgde voor veel gelach. Love it!',
    rating: 5,
    featured: true,
    location: 'Den Haag',
  },
  {
    name: 'Tom Peeters',
    eventType: 'Tuinfeest',
    quote: 'De quiz functie is geweldig! Gasten waren al competitief voordat het feest begon. De spanning was voelbaar!',
    rating: 5,
    featured: false,
    location: 'Eindhoven',
  },
  {
    name: 'Nienke Hermans',
    eventType: 'Bruiloft',
    quote: 'Voor onze bruiloft was Party Pilot een lifesaver. 120 gasten, allemaal hun voorkeuren, en de app regelde alles. Onze wedding planner was jaloers!',
    rating: 5,
    featured: true,
    location: 'Nijmegen',
  },
  {
    name: 'Joep Smeets',
    eventType: 'Nieuwjaarsborrel',
    quote: 'De voorspellingen feature maakte onze borrel interactief. Iedereen deed mee, en we hebben er nog weken over nagepraat! Echt een gamechanger.',
    rating: 5,
    featured: false,
    location: 'Maastricht',
  },
  {
    name: 'Ruud Janssen',
    eventType: 'Verjaardag',
    quote: 'Party Pilot is zo goed dat ik eigenlijk blij was toen ik een feest moest organiseren. En dat zeg ik niet vaak. Nu organiseer ik zelfs vaker feestjes. Gevaarlijk eigenlijk.',
    rating: 4,
    featured: true,
    location: 'Groningen',
  },
];

// Featured testimonials for homepage
export const featuredTestimonials = testimonials.filter(t => t.featured);

// Get testimonials by rating
export const getTestimonialsByRating = (rating: number) => {
  return testimonials.filter(t => t.rating === rating);
};

// Average rating calculation
export const averageRating = (() => {
  const sum = testimonials.reduce((acc, t) => acc + t.rating, 0);
  return Number((sum / testimonials.length).toFixed(1));
})();

// Total count
export const testimonialCount = testimonials.length;
