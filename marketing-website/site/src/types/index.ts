/**
 * Party Pilot - Shared TypeScript Types
 * Global type definitions used across the application
 */

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

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

// ============================================================================
// FEATURE TYPES
// ============================================================================

export type FeatureCategory = 'organisator' | 'feestganger' | 'tijdens-feest';

export interface Feature {
  icon: string;
  title: string;
  description: string;
  category: FeatureCategory;
  featured?: boolean;
  link?: {
    text: string;
    href: string;
  };
}

// ============================================================================
// PRICING TYPES
// ============================================================================

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
    amount: number | null;
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

// ============================================================================
// TESTIMONIAL TYPES
// ============================================================================

export interface Testimonial {
  name: string;
  role?: string;
  eventType: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
  avatar?: string;
  featured?: boolean;
  location?: string;
}

// ============================================================================
// FAQ TYPES
// ============================================================================

export type FAQCategory = 'algemeen' | 'prijzen' | 'functies' | 'technisch';

export interface FAQItem {
  question: string;
  answer: string;
  category: FAQCategory;
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  class?: string;
}

export type CardVariant = 'default' | 'feature' | 'pricing';

export interface CardProps {
  variant?: CardVariant;
  hover?: boolean;
  class?: string;
}

export type BadgeVariant = 'coral' | 'turquoise' | 'sunshine' | 'gray';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  class?: string;
}

export type StarRatingSize = 'sm' | 'md' | 'lg';

export interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: StarRatingSize;
  showNumber?: boolean;
  class?: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface WaitlistFormData {
  email: string;
  name?: string;
  referralCode?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  loading: boolean;
  success: boolean;
  error: string | null;
}

// ============================================================================
// SEO TYPES
// ============================================================================

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

export type AnimationType = 'fadeIn' | 'slideUp' | 'slideInLeft' | 'slideInRight' | 'float';

export interface AnimationProps {
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface LinkItem {
  text: string;
  href: string;
  external?: boolean;
}

export interface SocialLinks {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface ImageData {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WaitlistResponse {
  email: string;
  referralLink: string;
  position: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncData<T> = Promise<T>;
