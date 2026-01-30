# Party Pilot Marketing Website - System Architecture

**Version:** 1.0
**Date:** January 30, 2026
**Status:** Final Architecture
**Author:** PACT Architect Agent

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Structure](#project-structure)
3. [Design System Specification](#design-system-specification)
4. [Component Architecture](#component-architecture)
5. [Page Architecture](#page-architecture)
6. [Animation Strategy](#animation-strategy)
7. [Content Architecture](#content-architecture)
8. [Technical Decisions](#technical-decisions)
9. [Testimonials Data](#testimonials-data)
10. [Deployment Architecture](#deployment-architecture)
11. [Quality Assurance](#quality-assurance)

---

## 1. Executive Summary

### 1.1 Architecture Overview

The Party Pilot marketing website is a high-performance, conversion-optimized static site built with Astro 5.2+, Tailwind CSS v4, and strategic React islands for interactive components. The architecture prioritizes:

- **Performance**: Sub-1-second page loads, 95+ Lighthouse score
- **Conversion**: 40%+ waitlist signup rate through UX optimization
- **SEO**: First-page Google rankings for Dutch party planning keywords
- **Scalability**: Static generation with global CDN distribution
- **Maintainability**: Clear separation of content, components, and logic

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Astro 5.2+ | Zero JS by default, optimal for marketing sites |
| **Styling** | Tailwind CSS v4 | JIT compilation, modern syntax, fast builds |
| **Interactivity** | React 18 islands | Selective hydration for forms/calculators only |
| **Animation** | Motion One + Framer Motion | Lightweight scroll animations + complex interactions |
| **Deployment** | Netlify (static) | Auto-deploy, global CDN, preview deployments |
| **Content** | Markdown + TypeScript | Type-safe, version-controlled, no CMS needed |
| **Forms** | Netlify Forms → Supabase | Simple MVP, migrate to existing DB later |

### 1.3 Success Metrics

- **Page Load**: < 1 second (First Contentful Paint)
- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)
- **Waitlist Conversion**: 40%+ email capture rate
- **Mobile Performance**: 100% mobile-optimized (75%+ traffic expected)
- **SEO**: Top 10 Google rankings for 5+ Dutch keywords within 3 months

---

## 2. Project Structure

### 2.1 Complete File Structure

```
marketing-website/
├── public/                          # Static assets (served as-is)
│   ├── images/
│   │   ├── illustrations/           # SVG illustrations from Storyset
│   │   │   ├── hero-party.svg
│   │   │   ├── feature-quiz.svg
│   │   │   ├── feature-menu.svg
│   │   │   ├── feature-payments.svg
│   │   │   └── testimonials-bg.svg
│   │   ├── icons/                   # Brand icons, favicons
│   │   │   ├── favicon.ico
│   │   │   ├── logo.svg
│   │   │   └── logo-dark.svg
│   │   └── og/                      # Open Graph images
│   │       └── og-image.jpg
│   ├── fonts/                       # Self-hosted fonts (optional)
│   └── robots.txt                   # SEO crawler rules
│
├── src/
│   ├── assets/                      # Processed assets (Astro optimizes)
│   │   └── images/
│   │       └── placeholder.png
│   │
│   ├── components/
│   │   ├── layout/                  # Layout components (Astro)
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── MobileNav.astro
│   │   │   └── SEO.astro
│   │   │
│   │   ├── sections/                # Page sections (Astro)
│   │   │   ├── Hero.astro
│   │   │   ├── Features.astro
│   │   │   ├── HowItWorks.astro
│   │   │   ├── PricingTable.astro
│   │   │   ├── Testimonials.astro
│   │   │   ├── FAQ.astro
│   │   │   ├── CTASection.astro
│   │   │   └── SocialProof.astro
│   │   │
│   │   ├── ui/                      # Reusable UI components (Astro)
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   ├── Badge.astro
│   │   │   ├── Icon.astro
│   │   │   ├── FeatureCard.astro
│   │   │   ├── TestimonialCard.astro
│   │   │   └── StarRating.astro
│   │   │
│   │   ├── islands/                 # React islands (interactive)
│   │   │   ├── WaitlistForm.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   ├── PricingCalculator.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   ├── NewsletterSignup.tsx
│   │   │   └── ScrollAnimations.tsx
│   │   │
│   │   └── animations/              # Animation wrappers (Motion One)
│   │       ├── FadeIn.astro
│   │       ├── SlideUp.astro
│   │       ├── Stagger.astro
│   │       └── CountUp.astro
│   │
│   ├── content/                     # Content collections (Markdown)
│   │   ├── config.ts                # Content schema definitions
│   │   ├── features/                # Feature descriptions
│   │   │   ├── invitations.md
│   │   │   ├── shopping-list.md
│   │   │   ├── quiz.md
│   │   │   └── payments.md
│   │   ├── testimonials/            # Testimonial data
│   │   │   └── testimonials.json
│   │   ├── faq/                     # FAQ items
│   │   │   ├── pricing.md
│   │   │   ├── features.md
│   │   │   └── technical.md
│   │   └── blog/                    # Blog posts (future)
│   │       └── .gitkeep
│   │
│   ├── data/                        # Static data (TypeScript/JSON)
│   │   ├── features.ts              # Feature list with metadata
│   │   ├── pricing.ts               # Pricing tiers
│   │   ├── navigation.ts            # Site navigation structure
│   │   └── siteConfig.ts            # Global site configuration
│   │
│   ├── layouts/                     # Page layouts (Astro)
│   │   ├── BaseLayout.astro         # Base HTML structure
│   │   ├── PageLayout.astro         # Standard page layout
│   │   └── BlogLayout.astro         # Blog post layout (future)
│   │
│   ├── pages/                       # Routes (Astro file-based routing)
│   │   ├── index.astro              # Homepage (/)
│   │   ├── functies.astro           # Features (/functies)
│   │   ├── hoe-werkt-het.astro      # How It Works (/hoe-werkt-het)
│   │   ├── prijzen.astro            # Pricing (/prijzen)
│   │   ├── over-ons.astro           # About (/over-ons)
│   │   ├── contact.astro            # Contact (/contact)
│   │   ├── faq.astro                # FAQ (/faq)
│   │   ├── waitlist.astro           # Waitlist (/waitlist)
│   │   ├── demo.astro               # Demo (/demo)
│   │   ├── blog/                    # Blog section
│   │   │   └── index.astro          # Blog home
│   │   ├── privacybeleid.astro      # Privacy Policy
│   │   ├── algemene-voorwaarden.astro # Terms
│   │   └── 404.astro                # 404 page
│   │
│   ├── styles/                      # Global styles
│   │   ├── global.css               # Tailwind imports + custom styles
│   │   └── animations.css           # Animation keyframes
│   │
│   ├── utils/                       # Utility functions
│   │   ├── seo.ts                   # SEO helpers
│   │   ├── formatters.ts            # Date, number formatting
│   │   └── validators.ts            # Form validation
│   │
│   └── types/                       # TypeScript types
│       └── index.ts                 # Shared type definitions
│
├── .netlify/                        # Netlify configuration
├── .github/                         # GitHub Actions (optional CI/CD)
├── astro.config.mjs                 # Astro configuration
├── tailwind.config.mjs              # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
├── netlify.toml                     # Netlify deploy settings
├── .env.example                     # Environment variables template
└── README.md                        # Project documentation
```

### 2.2 File Naming Conventions

**General Rules:**
- Use kebab-case for files: `pricing-calculator.tsx`
- Astro components: PascalCase with `.astro` extension
- React components: PascalCase with `.tsx` extension
- Content files: kebab-case with `.md` or `.json` extension
- Utility files: camelCase with `.ts` extension

**Component Naming:**
- Layout components: `<Name>Layout.astro`
- Section components: Descriptive nouns (Hero, Features, CTA)
- UI components: Generic names (Button, Card, Badge)
- Islands: Descriptive with action (WaitlistForm, PricingCalculator)

**Route Naming (Dutch URLs):**
- Use Dutch words for SEO: `/functies`, `/prijzen`, `/over-ons`
- Keep short and descriptive
- No dates in URLs (allows content updates without URL changes)

---

## 3. Design System Specification

### 3.1 Color Palette

#### Primary Colors

```typescript
// tailwind.config.mjs
export default {
  theme: {
    extend: {
      colors: {
        // Primary accent (celebration, energy)
        coral: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffcccc',
          300: '#ffaaaa',
          400: '#ff8888',
          500: '#FF6B6B',  // PRIMARY
          600: '#e65555',
          700: '#cc3f3f',
          800: '#b32929',
          900: '#991313',
        },

        // Secondary accent (fresh, modern)
        turquoise: {
          50: '#f0fdfb',
          100: '#ccf8f2',
          200: '#99f1e5',
          300: '#66ead8',
          400: '#33e3cb',
          500: '#4ECDC4',  // PRIMARY
          600: '#3db5ad',
          700: '#2c9d96',
          800: '#1b857f',
          900: '#0a6d68',
        },

        // Tertiary accent (joy, optimism)
        sunshine: {
          50: '#fffef0',
          100: '#fffacc',
          200: '#fff699',
          300: '#fff266',
          400: '#ffee33',
          500: '#FFE66D',  // PRIMARY
          600: '#e6cc52',
          700: '#ccb338',
          800: '#b3991d',
          900: '#998003',
        },

        // Neutrals (warm, inviting)
        warmWhite: '#F9F7F4',    // Background base (Cloud Dancer inspired)
        pureWhite: '#FFFFFF',    // Cards, surfaces
        charcoal: '#1A1A1A',     // Primary text
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#6B6B6B',        // Secondary text
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },

        // Semantic colors
        success: '#51CF66',      // Fresh green
        info: '#748FFC',         // Soft blue
        warning: '#FFD43B',      // Amber
        error: '#FF6B6B',        // Matches coral
      }
    }
  }
}
```

#### Gradient Definitions

```css
/* src/styles/global.css */

/* Hero background gradient */
.gradient-hero {
  background: linear-gradient(135deg, #F9F7F4 0%, #FFE6E6 50%, #E6F7F7 100%);
}

/* CTA button gradient */
.gradient-cta {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
}

/* Feature card hover gradient */
.gradient-card-hover {
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(255, 230, 109, 0.1) 100%);
}

/* Mesh gradient background (subtle) */
.gradient-mesh {
  background:
    radial-gradient(at 27% 37%, rgba(255, 107, 107, 0.15) 0px, transparent 50%),
    radial-gradient(at 97% 21%, rgba(78, 205, 196, 0.15) 0px, transparent 50%),
    radial-gradient(at 52% 99%, rgba(255, 230, 109, 0.15) 0px, transparent 50%),
    radial-gradient(at 10% 29%, rgba(78, 205, 196, 0.15) 0px, transparent 50%);
}
```

### 3.2 Typography Scale

#### Font Families

```typescript
// tailwind.config.mjs
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'], // Same family, different weights
      },
    }
  }
}
```

**Font Loading Strategy:**
```astro
<!-- src/layouts/BaseLayout.astro -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

#### Type Scale

```typescript
// Tailwind configuration (default scale, customized)
export default {
  theme: {
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
      'base': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px (mobile-friendly)
      'lg': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
      'xl': ['1.5rem', { lineHeight: '2rem' }],         // 24px
      '2xl': ['2rem', { lineHeight: '2.5rem' }],        // 32px
      '3xl': ['2.5rem', { lineHeight: '3rem' }],        // 40px
      '4xl': ['3.5rem', { lineHeight: '1.1' }],         // 56px (hero)
      '5xl': ['4rem', { lineHeight: '1' }],             // 64px
      '6xl': ['4.5rem', { lineHeight: '1' }],           // 72px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    }
  }
}
```

#### Typography Usage Guide

| Element | Class | Size | Weight | Use Case |
|---------|-------|------|--------|----------|
| Hero H1 | `text-4xl md:text-5xl font-extrabold` | 56-64px | 800 | Homepage hero headline |
| Section H2 | `text-3xl md:text-4xl font-bold` | 40-56px | 700 | Section titles |
| Subsection H3 | `text-2xl md:text-3xl font-semibold` | 32-40px | 600 | Subsection titles |
| Card Title H4 | `text-xl font-semibold` | 24px | 600 | Feature cards, testimonials |
| Body Text | `text-base font-normal` | 18px | 400 | Paragraphs, descriptions |
| Small Text | `text-sm font-normal` | 14px | 400 | Captions, labels |
| Button Text | `text-base font-semibold` | 18px | 600 | CTA buttons |

### 3.3 Spacing Scale

Use Tailwind's default spacing scale (4px base unit):

```typescript
// Commonly used spacing values
{
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
}
```

**Spacing Guidelines:**
- **Section padding**: `py-16 md:py-24` (64-96px vertical)
- **Container max-width**: `max-w-7xl` (1280px)
- **Container padding**: `px-4 md:px-6 lg:px-8`
- **Card padding**: `p-6 md:p-8`
- **Element spacing**: `space-y-4` or `gap-6`

### 3.4 Border Radius & Shadows

```typescript
// tailwind.config.mjs
export default {
  theme: {
    extend: {
      borderRadius: {
        'sm': '0.25rem',   // 4px - small elements
        'DEFAULT': '0.5rem', // 8px - cards, buttons
        'md': '0.75rem',   // 12px - larger cards
        'lg': '1rem',      // 16px - sections
        'xl': '1.5rem',    // 24px - hero sections
        'full': '9999px',  // Pills, rounded buttons
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'button': '0 2px 8px rgba(255, 107, 107, 0.2)',
        'button-hover': '0 4px 16px rgba(255, 107, 107, 0.3)',
      }
    }
  }
}
```

### 3.5 Component Design Tokens

```typescript
// src/data/designTokens.ts

export const DESIGN_TOKENS = {
  // Buttons
  button: {
    primary: {
      bg: 'bg-coral-500 hover:bg-coral-600',
      text: 'text-white',
      shadow: 'shadow-button hover:shadow-button-hover',
      transition: 'transition-all duration-200',
      padding: 'px-8 py-4',
      fontSize: 'text-base font-semibold',
      borderRadius: 'rounded-lg',
    },
    secondary: {
      bg: 'bg-white hover:bg-gray-50 border-2 border-coral-500',
      text: 'text-coral-500 hover:text-coral-600',
      shadow: 'shadow-soft hover:shadow-card',
      transition: 'transition-all duration-200',
      padding: 'px-8 py-4',
      fontSize: 'text-base font-semibold',
      borderRadius: 'rounded-lg',
    },
    ghost: {
      bg: 'bg-transparent hover:bg-gray-50',
      text: 'text-gray-700 hover:text-charcoal',
      shadow: '',
      transition: 'transition-all duration-200',
      padding: 'px-4 py-2',
      fontSize: 'text-base font-medium',
      borderRadius: 'rounded',
    }
  },

  // Cards
  card: {
    default: {
      bg: 'bg-white',
      border: '',
      shadow: 'shadow-card hover:shadow-card-hover',
      padding: 'p-6 md:p-8',
      borderRadius: 'rounded-lg',
      transition: 'transition-shadow duration-300',
    },
    feature: {
      bg: 'bg-white hover:gradient-card-hover',
      border: 'border border-gray-100',
      shadow: 'shadow-soft hover:shadow-card',
      padding: 'p-6',
      borderRadius: 'rounded-lg',
      transition: 'transition-all duration-300',
    }
  },

  // Inputs
  input: {
    default: {
      bg: 'bg-white',
      border: 'border-2 border-gray-200 focus:border-coral-500',
      text: 'text-charcoal placeholder:text-gray-400',
      padding: 'px-4 py-3',
      borderRadius: 'rounded-lg',
      fontSize: 'text-base',
      transition: 'transition-colors duration-200',
      outline: 'focus:outline-none focus:ring-2 focus:ring-coral-500/20',
    }
  }
} as const;
```

---

## 4. Component Architecture

### 4.1 Layout Components

#### Header.astro

**Purpose:** Site-wide navigation, logo, CTA button

**Props:**
```typescript
interface HeaderProps {
  transparent?: boolean; // Transparent on hero, solid on scroll
  currentPath?: string;  // Active nav item highlighting
}
```

**Features:**
- Sticky header (scroll behavior)
- Desktop horizontal nav
- Mobile hamburger menu (triggers MobileMenu island)
- Logo with link to homepage
- Primary CTA button (Join Waitlist)

**Structure:**
```astro
<header class="sticky top-0 z-50 transition-colors duration-300">
  <nav class="container mx-auto flex items-center justify-between">
    <Logo />
    <DesktopNav items={navigation} />
    <CTAButton />
    <MobileMenuToggle />
  </nav>
</header>
```

#### Footer.astro

**Purpose:** Site footer with links, social, legal

**Props:** None (uses global site config)

**Structure:**
```astro
<footer class="bg-charcoal text-warmWhite">
  <div class="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
    <FooterColumn title="Product" links={productLinks} />
    <FooterColumn title="Bedrijf" links={companyLinks} />
    <FooterColumn title="Juridisch" links={legalLinks} />
    <SocialLinks />
  </div>
  <Copyright />
</footer>
```

#### MobileNav.astro

**Purpose:** Mobile navigation overlay

**Props:**
```typescript
interface MobileNavProps {
  items: NavigationItem[];
}
```

**Features:**
- Full-screen overlay
- Slide-in animation
- Large touch targets (44×44px minimum)
- Close button

#### SEO.astro

**Purpose:** Metadata, Open Graph, structured data

**Props:**
```typescript
interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string[];
  schema?: object; // JSON-LD structured data
}
```

**Features:**
- Sets page title, meta description
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- Canonical URL
- JSON-LD structured data for rich snippets

---

### 4.2 Section Components

#### Hero.astro

**Purpose:** Homepage hero section with headline, CTA, illustration

**Props:**
```typescript
interface HeroProps {
  headline: string;
  subheadline: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  illustration: string; // Path to SVG
}
```

**Layout:**
- Two-column grid (desktop): Text left, illustration right
- Single column (mobile): Text above illustration
- Gradient background
- Animated entrance (fade in + slide up)

#### Features.astro

**Purpose:** Feature grid with icons, titles, descriptions

**Props:**
```typescript
interface FeaturesProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4; // Grid columns
}

interface Feature {
  icon: string;       // Icon name (Lucide)
  title: string;
  description: string;
  illustration?: string; // Optional SVG
}
```

**Layout:**
- Grid: 1 col (mobile), 2 cols (tablet), 3-4 cols (desktop)
- Each feature card: icon + title + description
- Stagger animation on scroll

#### HowItWorks.astro

**Purpose:** Step-by-step process visualization

**Props:**
```typescript
interface HowItWorksProps {
  title: string;
  steps: Step[];
}

interface Step {
  number: number;
  title: string;
  description: string;
  illustration: string;
}
```

**Layout:**
- Vertical timeline (mobile)
- Horizontal stepper (desktop)
- Connecting lines between steps
- Illustrations for each step

#### PricingTable.astro

**Purpose:** Pricing tiers comparison

**Props:**
```typescript
interface PricingTableProps {
  tiers: PricingTier[];
}

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: { text: string; href: string };
  highlighted?: boolean; // "Most Popular" badge
}
```

**Layout:**
- Cards side-by-side (desktop)
- Stacked cards (mobile)
- Feature comparison list
- Highlighted tier (visual emphasis)

#### Testimonials.astro

**Purpose:** Customer testimonials carousel/grid

**Props:**
```typescript
interface TestimonialsProps {
  title: string;
  testimonials: Testimonial[];
  layout?: 'grid' | 'carousel';
}

interface Testimonial {
  name: string;
  role?: string;
  eventType?: string;
  quote: string;
  rating: 4 | 5;
  avatar?: string;
}
```

**Layout:**
- Grid (3 cols desktop, 1 col mobile)
- OR carousel with auto-rotate
- Star ratings
- Optional avatars

#### FAQ.astro

**Purpose:** Frequently asked questions accordion

**Props:**
```typescript
interface FAQProps {
  title: string;
  faqs: FAQItem[];
  categories?: FAQCategory[];
}

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}
```

**Layout:**
- Accordion (expand/collapse)
- Optional category tabs
- Search filter (if many FAQs)

#### CTASection.astro

**Purpose:** Conversion-focused call-to-action section

**Props:**
```typescript
interface CTASectionProps {
  headline: string;
  description: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  background?: 'gradient' | 'solid' | 'image';
}
```

**Layout:**
- Centered content
- Large headline
- Primary button (prominent)
- Optional secondary button
- Background (gradient, color, or image)

#### SocialProof.astro

**Purpose:** User count, rating, trust signals

**Props:**
```typescript
interface SocialProofProps {
  userCount?: number;
  rating?: number;
  maxRating?: number;
  testimonialSnippet?: string;
  logos?: string[]; // Company/event logos
}
```

**Layout:**
- Horizontal bar with stats
- Star rating + count
- Optional logos

---

### 4.3 UI Components

#### Button.astro

**Purpose:** Reusable button with variants

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;     // Link button
  type?: 'button' | 'submit'; // Form button
  fullWidth?: boolean;
  icon?: string;     // Lucide icon name
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
}
```

**Variants:**
- Primary: Coral background, white text
- Secondary: White background, coral border
- Ghost: Transparent, gray text

#### Card.astro

**Purpose:** Content container with shadow/border

**Props:**
```typescript
interface CardProps {
  variant?: 'default' | 'feature' | 'flat';
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean; // Lift on hover
}
```

#### Badge.astro

**Purpose:** Small label/tag

**Props:**
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'info' | 'warning';
  size?: 'sm' | 'md';
}
```

#### Icon.astro

**Purpose:** Wrapper for Lucide icons

**Props:**
```typescript
interface IconProps {
  name: string;      // Lucide icon name
  size?: number;     // px
  color?: string;    // Tailwind color class
  strokeWidth?: number;
}
```

**Implementation:**
Uses `lucide-react` package, renders as SVG

#### FeatureCard.astro

**Purpose:** Specialized card for feature display

**Props:**
```typescript
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  link?: { text: string; href: string };
}
```

#### TestimonialCard.astro

**Purpose:** Testimonial display with quote styling

**Props:**
```typescript
interface TestimonialCardProps {
  testimonial: Testimonial;
  compact?: boolean; // Smaller version
}
```

#### StarRating.astro

**Purpose:** Display star rating

**Props:**
```typescript
interface StarRatingProps {
  rating: number;    // 0-5
  maxRating?: number; // Default 5
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean; // Show "4.9/5"
}
```

---

### 4.4 React Islands (Interactive Components)

#### WaitlistForm.tsx

**Purpose:** Email capture form for waitlist

**Props:**
```typescript
interface WaitlistFormProps {
  referralCode?: string; // Pre-filled from URL
  compact?: boolean;     // Inline vs. full form
}
```

**State:**
```typescript
interface FormState {
  email: string;
  loading: boolean;
  success: boolean;
  error: string | null;
  referralLink: string | null; // After submission
}
```

**Features:**
- Email validation
- Netlify Forms submission (MVP)
- Loading state with spinner
- Success state with referral link
- Error handling with messages
- Confetti animation on success (optional wow-factor)

**Hydration:** `client:load` (critical conversion element)

#### ContactForm.tsx

**Purpose:** General contact form

**Props:**
```typescript
interface ContactFormProps {
  subject?: string; // Pre-filled subject
}
```

**State:**
```typescript
interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  loading: boolean;
  success: boolean;
  error: string | null;
}
```

**Hydration:** `client:visible` (below fold)

#### PricingCalculator.tsx

**Purpose:** Interactive pricing calculator with slider

**Props:**
```typescript
interface PricingCalculatorProps {
  minGuests?: number;
  maxGuests?: number;
  pricePerGuest: number;
  freeThreshold: number; // Free up to X guests
}
```

**State:**
```typescript
interface CalculatorState {
  guestCount: number;
  totalPrice: number;
  pricePerGuest: number;
  isFree: boolean;
}
```

**Features:**
- Slider input (10-200 guests)
- Real-time price calculation
- Display: "50 gasten = €125 (€2.50 per persoon)"
- Visual breakdown (free vs. paid)

**Hydration:** `client:visible` (pricing page)

#### MobileMenu.tsx

**Purpose:** Mobile navigation menu with animations

**Props:**
```typescript
interface MobileMenuProps {
  items: NavigationItem[];
  currentPath: string;
}
```

**State:**
```typescript
interface MenuState {
  isOpen: boolean;
}
```

**Features:**
- Slide-in animation (Framer Motion)
- Backdrop blur
- Close on link click
- Close on escape key

**Hydration:** `client:idle` (not critical, load when idle)

#### NewsletterSignup.tsx

**Purpose:** Footer newsletter signup (optional)

**State:**
```typescript
interface NewsletterState {
  email: string;
  loading: boolean;
  success: boolean;
  error: string | null;
}
```

**Hydration:** `client:visible` (footer)

#### ScrollAnimations.tsx

**Purpose:** Scroll-triggered animations wrapper

**Props:**
```typescript
interface ScrollAnimationsProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight';
  delay?: number;
  threshold?: number; // IntersectionObserver threshold
}
```

**Implementation:**
Uses Motion One's `inView` function for performance

**Hydration:** `client:load` (animations start immediately)

---

### 4.5 Animation Wrappers (Astro Components)

#### FadeIn.astro

**Purpose:** Fade in element on scroll

**Usage:**
```astro
<FadeIn>
  <p>Content fades in when scrolled into view</p>
</FadeIn>
```

**Implementation:**
Uses Motion One's `animate` with `inView`

#### SlideUp.astro

**Purpose:** Slide up animation on scroll

**Props:**
```typescript
interface SlideUpProps {
  delay?: number;    // ms
  distance?: number; // px to slide
}
```

#### Stagger.astro

**Purpose:** Stagger animations for child elements

**Props:**
```typescript
interface StaggerProps {
  delay?: number;     // Delay between items (ms)
  animation?: 'fadeIn' | 'slideUp';
}
```

**Usage:**
```astro
<Stagger delay={100}>
  <FeatureCard />
  <FeatureCard />
  <FeatureCard />
</Stagger>
```

#### CountUp.astro

**Purpose:** Animated number counter

**Props:**
```typescript
interface CountUpProps {
  from?: number;
  to: number;
  duration?: number; // ms
  suffix?: string;   // e.g., "+"
  prefix?: string;   // e.g., "€"
}
```

**Usage:**
```astro
<CountUp to={2000} suffix="+" />
<!-- Displays: "2000+" with count-up animation -->
```

---

**This completes Part 1 of the architecture document. Continue to Part 2 for:**
- Page Architecture (all 10 pages with detailed sections)
- Animation Strategy
- Content Architecture
- Technical Decisions
- Testimonials Data
- Deployment Architecture

Should I continue with Part 2?

## 5. Page Architecture

### 5.1 Homepage (/)

**Purpose:** Primary landing page, highest conversion priority

**SEO Metadata:**
```typescript
{
  title: "Party Pilot - Van uitnodiging tot afwas",
  description: "De ultieme app voor feestorganisatie. Van digitale uitnodigingen tot live quiz en automatische inkooplijsten. Maak van elk feest een succes.",
  keywords: ["feest organiseren", "party planner", "digitale uitnodiging", "feest app", "bbq organiseren", "verjaardag plannen"]
}
```

**Sections (in order):**

1. **Hero Section**
   - Component: `Hero.astro`
   - Headline: "Van uitnodiging tot afwas"
   - Subheadline: "Party Pilot denkt met je mee bij elk feest. Van digitale uitnodigingen tot live quiz - alles in één app."
   - Primary CTA: "Sluit je aan bij de waitlist"
   - Secondary CTA: "Bekijk hoe het werkt"
   - Illustration: Party scene (Storyset)
   - Background: Gradient mesh

2. **Social Proof Bar**
   - Component: `SocialProof.astro`
   - Content: "2,000+ feestorganisatoren vertrouwen Party Pilot" + 4.9★ rating
   - Layout: Horizontal bar below hero

3. **Problem/Solution**
   - Component: Custom section
   - Title: "Herken je dit?"
   - Problems list:
     - "Weer opnieuw om dieetwensen vragen?"
     - "Handmatig inkooplijsten maken?"
     - "Gasten die zich pas op de avond zelf aanmelden?"
     - "Betaalverzoeken versturen naar iedereen?"
   - Solution: "Party Pilot lost dit automatisch op"

4. **Key Features (4 highlights)**
   - Component: `Features.astro`
   - Features:
     1. **Digitale uitnodigingen & RSVP**
        - Icon: Mail
        - Description: "Stuur uitnodigingen, verzamel RSVPs en dieetwensen automatisch"
     2. **Automatische inkooplijst**
        - Icon: ShoppingCart
        - Description: "Op basis van dieetwensen en aantal gasten berekent de app exact wat je nodig hebt"
     3. **Live quiz & gamification**
        - Icon: Trophy
        - Description: "Houd gasten entertained met een live quiz en punten-systeem"
     4. **Tikkie-integratie**
        - Icon: CreditCard
        - Description: "Verzamel bijdragen eenvoudig via Tikkie"
   - Layout: 2×2 grid (desktop), stacked (mobile)

5. **How It Works (3 steps)**
   - Component: `HowItWorks.astro`
   - Steps:
     1. "Maak je feest aan en nodig gasten uit"
     2. "Gasten melden zich aan en delen voorkeuren"
     3. "Geniet van je feest met alles geregeld"
   - Illustration per step

6. **Testimonials**
   - Component: `Testimonials.astro`
   - Display: 3 testimonials (5★, 5★, 4★ sarcastic)
   - Layout: Grid (3 cols desktop)

7. **Pricing Teaser**
   - Component: `PricingTable.astro` (simplified)
   - Title: "Freemium: Start gratis, betaal per gast"
   - Show: Free tier vs. Premium tier (brief)
   - CTA: "Bekijk volledige prijzen" → /prijzen

8. **Final CTA**
   - Component: `CTASection.astro`
   - Headline: "Klaar om je beste feest ooit te organiseren?"
   - Form: `WaitlistForm` (React island)
   - Trust signals: "Geen creditcard nodig • Gratis te proberen"

9. **Footer**
   - Component: `Footer.astro`

**Performance Target:**
- FCP: < 0.8s
- LCP: < 1.2s
- CLS: < 0.1
- Total JS: < 50 KB

---

### 5.2 Features Page (/functies)

**Purpose:** Comprehensive feature breakdown for consideration phase

**SEO Metadata:**
```typescript
{
  title: "Functies - Party Pilot",
  description: "Ontdek alle functies van Party Pilot: digitale uitnodigingen, automatische inkooplijsten, live quiz, menu planning en meer.",
  keywords: ["party planner functies", "feest app features", "uitnodiging app", "menu planning"]
}
```

**Sections:**

1. **Hero**
   - Headline: "Alles wat je nodig hebt voor het perfecte feest"
   - Subheadline: "Van planning tot nabeschouwing - Party Pilot regelt het"
   - Illustration: Feature icons arranged creatively

2. **Feature Categories (4 groups)**

   **Planning Features**
   - Digital invitations & registration
   - Dietary preferences & allergies tracking
   - Automatic shopping list generation
   - Menu planning & portion calculation
   
   **Entertainment Features**
   - Live multiplayer quiz
   - Predictions/sweepstake
   - Points & leaderboard
   - AI task assignments
   
   **Payment Features**
   - Tikkie integration
   - QR code payments
   - Payment tracking
   - Automatic reminders
   
   **Analytics Features**
   - Organizer dashboard
   - Real-time guest tracking
   - Post-party ratings
   - Export data

3. **Each Feature Block:**
   - Icon (Lucide)
   - Feature name
   - 2-3 sentence description
   - Benefit statement: "Zo bespaar je X uur / Zo vermijd je Y probleem"
   - Illustration (optional)

4. **Feature Comparison Table**
   - Party Pilot vs. Traditional planning
   - Show time saved, stress reduced

5. **CTA: Waitlist**

**Layout:**
- Feature cards in masonry grid
- Category sections with colored backgrounds
- Scroll animations (stagger effect)

---

### 5.3 How It Works Page (/hoe-werkt-het)

**Purpose:** Step-by-step guide for understanding the flow

**SEO Metadata:**
```typescript
{
  title: "Hoe werkt het - Party Pilot",
  description: "Leer hoe Party Pilot werkt in 3 eenvoudige stappen. Van uitnodiging tot feest - zie de complete flow.",
  keywords: ["hoe werkt party pilot", "feest organiseren stappen", "party planner uitleg"]
}
```

**Sections:**

1. **Hero**
   - Headline: "Zo simpel werkt het"
   - Subheadline: "In 3 stappen van plan naar feest"

2. **For Organizers (Feestregisseur)**
   - **Step 1: Maak je feest aan**
     - Beschrijving: "Geef je feest een naam, datum, en nodig gasten uit via email of link"
     - Visual: Timeline or stepper
   
   - **Step 2: Gasten melden zich aan**
     - Beschrijving: "Gasten vullen hun dieetwensen, voorkeuren en doen mee aan de quiz"
     - Visual: Form mockup (illustration, no screenshot)
   
   - **Step 3: Bereid je feest voor**
     - Beschrijving: "Download je inkooplijst, bekijk het menu, en zie wie komt"
     - Visual: Shopping list illustration
   
   - **Step 4: Geniet van je feest**
     - Beschrijving: "Start de live quiz, bekijk de leaderboard, en laat de app het werk doen"
     - Visual: Quiz screen (illustration)
   
   - **Step 5: Nabeschouwing**
     - Beschrijving: "Bekijk ratings, foto's, en deel herinneringen"
     - Visual: Analytics dashboard (illustration)

3. **For Guests (Feestganger)**
   - **Step 1: Ontvang uitnodiging**
   - **Step 2: Meld je aan & vul voorkeuren in**
   - **Step 3: Speel de quiz tijdens het feest**
   - **Step 4: Bekijk je score & ratings**

4. **Interactive Demo Section** (future)
   - Link to `/demo` page
   - Or embedded interactive walkthrough

5. **FAQ Preview**
   - Top 3-4 FAQs related to how it works
   - Link to full FAQ page

6. **CTA: Waitlist**

**Layout:**
- Vertical timeline (mobile)
- Horizontal stepper with illustrations (desktop)
- Role-based tabs (Organizer vs. Guest)

---

### 5.4 Pricing Page (/prijzen)

**Purpose:** Transparent pricing with interactive calculator

**SEO Metadata:**
```typescript
{
  title: "Prijzen - Party Pilot",
  description: "Transparante prijzen, geen verborgen kosten. Gratis tot 20 gasten, daarna €2.50 per gast. Bereken wat jouw feest kost.",
  keywords: ["party pilot prijs", "feest app kosten", "freemium party planner"]
}
```

**Sections:**

1. **Hero**
   - Headline: "Transparante prijzen, geen verborgen kosten"
   - Subheadline: "Start gratis, betaal alleen voor grotere feesten"

2. **Pricing Tiers (Side-by-side)**
   
   **Free Tier**
   - Title: "Gratis"
   - Price: "€0"
   - Description: "Perfect voor kleinere feesten"
   - Features:
     - Tot 20 gasten
     - Digitale uitnodigingen
     - RSVP tracking
     - Dieetwensen verzamelen
     - Handmatige inkooplijst
     - Basis quiz
     - Punten & leaderboard
   - CTA: "Start gratis"
   
   **Premium Tier** (highlighted)
   - Title: "Premium"
   - Price: "€2.50"
   - Period: "per gast (20+ gasten)"
   - Description: "Voor onvergetelijke feesten"
   - Features:
     - Alles van Gratis, plus:
     - **Onbeperkt aantal gasten**
     - **AI-powered inkooplijst**
     - **Geavanceerde quiz** (unlimited vragen)
     - **AI taak-toewijzing** (Claude-powered)
     - **Voorspellingen & sweepstake**
     - **Tikkie-integratie**
     - **Post-party analytics**
     - **Custom branding**
     - **Priority support**
   - CTA: "Sluit je aan bij de waitlist"
   
   **Enterprise** (optional)
   - Title: "Enterprise"
   - Price: "Op maat"
   - Description: "Voor grote evenementen (100+ gasten)"
   - Features:
     - Alles van Premium, plus:
     - White-label optie
     - Dedicated account manager
     - Custom integraties
   - CTA: "Neem contact op"

3. **Interactive Pricing Calculator**
   - Component: `PricingCalculator` (React island)
   - Slider: 10-200 gasten
   - Display:
     - Guest count
     - Total price
     - Price per guest
     - "Free" or "€X.XX"
   - Example scenarios:
     - "30 gasten = €75 (€2.50 per persoon)"
     - "50 gasten = €125 (€2.50 per persoon)"
     - "100 gasten = €250 (€2.50 per persoon)"

4. **Value Comparison**
   - Title: "Wat krijg je ervoor terug?"
   - Comparison:
     - Traditional planning: "€500+ (tijd + stress)"
     - Party Pilot: "€125 voor 50 gasten (alles geautomatiseerd)"
   - Value frame: "Minder dan de prijs van één biertje per gast"

5. **FAQ (Pricing-specific)**
   - "Wat zit er in de gratis versie?"
   - "Wanneer moet ik betalen?"
   - "Kan ik op elk moment annuleren?"
   - "Zijn er verborgen kosten?"
   - "Hoe werkt de betaling?"

6. **Testimonials (ROI-focused)**
   - Quotes mentioning value, time saved, worth the price

7. **CTA: Waitlist**

**Layout:**
- Pricing cards: Side-by-side (desktop), stacked (mobile)
- Calculator: Full-width, visually prominent
- Comparison table: Clear visual hierarchy

---

### 5.5 FAQ Page (/faq)

**Purpose:** Answer common objections and questions

**SEO Metadata:**
```typescript
{
  title: "Veelgestelde vragen - Party Pilot",
  description: "Antwoorden op al je vragen over Party Pilot. Van prijzen tot functies en technische vereisten.",
  keywords: ["party pilot faq", "veelgestelde vragen feest app"]
}
```

**Sections:**

1. **Hero**
   - Headline: "Veelgestelde vragen"
   - Subheadline: "Kan je antwoord niet vinden? Neem contact op."
   - Search bar (optional, filter FAQs)

2. **FAQ Categories**
   
   **Over Party Pilot**
   - "Wat is Party Pilot?"
   - "Voor wie is Party Pilot bedoeld?"
   - "Wat maakt Party Pilot anders dan andere apps?"
   
   **Prijzen & Betaling**
   - "Wat kost Party Pilot?"
   - "Is er een gratis proefperiode?"
   - "Hoe betaal ik?"
   - "Kan ik op elk moment stoppen?"
   - "Zijn er verborgen kosten?"
   
   **Functies**
   - "Welke functies heeft Party Pilot?"
   - "Kan ik een quiz aanpassen?"
   - "Hoe werkt de AI taak-toewijzing?"
   - "Kan ik meerdere feesten tegelijk organiseren?"
   
   **Technisch**
   - "Op welke apparaten werkt Party Pilot?"
   - "Heb ik een app nodig?"
   - "Werkt het offline?"
   - "Hoe zit het met mijn privacy?"
   
   **Gasten**
   - "Moeten mijn gasten een account maken?"
   - "Kunnen gasten hun gegevens aanpassen?"
   - "Wat als een gast geen email heeft?"

3. **Accordion Layout**
   - Component: `FAQ.astro`
   - Each question: Expand/collapse
   - Rich text answers with links

4. **Still Have Questions?**
   - CTA: "Neem contact op" → /contact
   - Or: "Sluit je aan bij de waitlist"

**Layout:**
- Category tabs (optional)
- Accordion for each question
- Search/filter (future enhancement)

---

### 5.6 About Page (/over-ons)

**Purpose:** Company mission, values, team (builds trust)

**SEO Metadata:**
```typescript
{
  title: "Over ons - Party Pilot",
  description: "Leer meer over de missie van Party Pilot: feesten organiseren zonder stress. Ontdek waarom we deze app hebben gebouwd.",
  keywords: ["party pilot team", "over party pilot", "missie feest app"]
}
```

**Sections:**

1. **Hero**
   - Headline: "Van feestgangers, voor feestgangers"
   - Subheadline: "Waarom we Party Pilot hebben gebouwd"

2. **Mission**
   - Title: "Onze missie"
   - Content: "We geloven dat feesten organiseren leuk moet zijn, niet stressvol. Party Pilot automatiseert het saaie werk, zodat jij kunt focussen op het belangrijkste: genieten met je gasten."

3. **The Story**
   - Title: "Hoe het begon"
   - Content: Story about organizing a BBQ, frustrations, building the first version for friends, realizing others have the same problem
   - Keep authentic and relatable

4. **Values**
   - "Simpliciteit": Makkelijk te gebruiken voor iedereen
   - "Transparantie": Geen verborgen kosten of verrassingen
   - "Automatisering": Technologie die het werk voor je doet
   - "Plezier": Feesten moeten leuk zijn, van planning tot uitvoering

5. **Team (Optional)**
   - If team is public, brief bios with photos
   - If not, skip this section

6. **CTA: Waitlist**

**Layout:**
- Story-driven, narrative flow
- Illustrations between text blocks
- Personal, warm tone

---

### 5.7 Contact Page (/contact)

**Purpose:** Support, sales inquiries, partnerships

**SEO Metadata:**
```typescript
{
  title: "Contact - Party Pilot",
  description: "Neem contact op met Party Pilot voor vragen, support of samenwerkingen.",
  keywords: ["party pilot contact", "support feest app"]
}
```

**Sections:**

1. **Hero**
   - Headline: "We horen graag van je"
   - Subheadline: "Vragen, feedback, of gewoon een chat? Stuur ons een bericht."

2. **Contact Form**
   - Component: `ContactForm` (React island)
   - Fields:
     - Naam (required)
     - Email (required)
     - Onderwerp (select: Algemene vraag, Support, Partnership, Anders)
     - Bericht (textarea, required)
   - Submit button: "Verstuur bericht"
   - Success message: "Bedankt! We nemen binnen 24 uur contact op."

3. **Contact Info**
   - Email: hello@partypilot.nl
   - Social media links (if active)

4. **FAQ Shortcut**
   - "Bekijk eerst onze FAQ" → link to /faq
   - Common questions with quick answers

**Layout:**
- Form: Left column (desktop), full-width (mobile)
- Contact info: Right column (desktop), below form (mobile)

---

### 5.8 Blog Page (/blog)

**Purpose:** SEO content, party planning tips (future phase)

**SEO Metadata:**
```typescript
{
  title: "Blog - Party Pilot",
  description: "Tips, trucs en inspiratie voor het organiseren van onvergetelijke feesten.",
  keywords: ["feest organiseren tips", "bbq planning", "verjaardag ideeën"]
}
```

**Sections (MVP):**

1. **Hero**
   - Headline: "Binnenkort beschikbaar"
   - Subheadline: "Tips, recepten en inspiratie voor je volgende feest"

2. **Email Signup**
   - "Schrijf je in voor updates"
   - Newsletter form

**Future Blog Posts (ideas):**
- "10 tips voor een geslaagde BBQ"
- "De perfecte playlist voor elk feest"
- "Hoe vraag je om dieetwensen zonder awkward te zijn?"
- "Inkooplijst voor een verjaardag met 30 gasten"
- "De beste tijdstippen om feesten te organiseren"

**Layout (future):**
- Grid of blog post cards
- Categories/tags filter
- Search

---

### 5.9 Demo Page (/demo)

**Purpose:** Interactive product walkthrough (future phase)

**SEO Metadata:**
```typescript
{
  title: "Demo - Party Pilot",
  description: "Probeer Party Pilot uit met een interactieve demo. Geen account nodig.",
  keywords: ["party pilot demo", "feest app proberen"]
}
```

**Sections (MVP):**

1. **Hero**
   - Headline: "Probeer Party Pilot"
   - Subheadline: "Binnenkort: interactieve demo"

2. **Video Demo (alternative)**
   - Embedded video walkthrough
   - Or: Screenshots carousel with explanations

3. **CTA: Waitlist**
   - "Wil je als eerste proberen? Sluit je aan bij de waitlist"

**Future Implementation:**
- Read-only version of actual app
- Pre-filled party example
- Click-through tour with tooltips

---

### 5.10 Waitlist Page (/waitlist)

**Purpose:** Dedicated waitlist landing page with referral mechanism

**SEO Metadata:**
```typescript
{
  title: "Waitlist - Party Pilot",
  description: "Sluit je aan bij 2,000+ feestorganisatoren op de waitlist. Krijg vroege toegang tot Party Pilot.",
  keywords: ["party pilot waitlist", "early access feest app"]
}
```

**Sections:**

1. **Hero**
   - Headline: "Word als eerste uitgenodigd"
   - Subheadline: "Sluit je aan bij 2,000+ feestorganisatoren die nooit meer stress hebben bij het plannen"
   - Illustration: Celebration/party scene

2. **Waitlist Form**
   - Component: `WaitlistForm` (React island)
   - Field: Email only (minimal friction)
   - Submit button: "Sluit je aan bij de waitlist"
   - Trust signal: "Gratis, geen creditcard nodig"

3. **Post-Signup (Thank You State)**
   - Message: "Je staat op de lijst!"
   - Position: "Je bent #347 op de lijst"
   - Referral CTA: "Deel je link en klim omhoog"
   - Referral link: `https://partypilot.nl/waitlist?ref=abc123`
   - Social share buttons: WhatsApp, Email, Copy link

4. **Below the Fold**
   
   **What is Party Pilot?**
   - 3-sentence pitch
   
   **Key Features (Icons)**
   - 3 icons with brief labels
   
   **Testimonial**
   - 1-2 social proof quotes
   
   **FAQ (Quick)**
   - "Wanneer gaat Party Pilot live?"
   - "Wat krijg ik als early adopter?"
   - "Kost het iets?"

5. **Footer**

**Referral Mechanism:**
- Each user gets unique code
- Track referrals in database (Supabase or Netlify Forms + custom handling)
- Incentive tiers:
  - 1 referral: +10 spots
  - 3 referrals: +50 spots
  - 5 referrals: Guaranteed early access
  - 10 referrals: Free Premium (3 months)

**Conversion Target:** 40%+ email capture rate

**Layout:**
- Centered, focused design
- Minimal distractions
- Large CTA button
- Mobile-optimized (83% mobile traffic expected)

---

### 5.11 Legal Pages

#### Privacy Policy (/privacybeleid)
- GDPR-compliant
- Cookie usage
- Data collection & storage
- Third-party services (Netlify, Supabase, Resend)

#### Terms of Service (/algemene-voorwaarden)
- Usage terms
- Refund policy
- Liability limitations

#### 404 Page
- Friendly message: "Deze pagina bestaat niet"
- Suggestion: "Ga terug naar de homepage"
- Link to homepage
- Optional: Party-themed illustration

---

## 6. Animation Strategy

### 6.1 Animation Library Selection

**Primary:** Motion One (motion.dev)
- **Why:** Lightweight (5 KB gzipped), Astro-native, high performance
- **Use cases:** Scroll animations, entrance effects, micro-interactions

**Secondary:** Framer Motion (React islands only)
- **Why:** Advanced gesture support, shared element transitions
- **Use cases:** Complex interactive components (mobile menu, calculator)

**Installation:**
```bash
npm install motion framer-motion
```

### 6.2 Animation Patterns

#### Page Load Animations

**Hero Section:**
```typescript
// Staggered entrance
- Headline: Fade in + slide up (0ms delay)
- Subheadline: Fade in + slide up (100ms delay)
- CTA buttons: Fade in + scale (200ms delay)
- Illustration: Fade in + slide left (300ms delay)
```

**Implementation (Motion One):**
```javascript
import { animate, stagger } from "motion";

animate(
  ".hero-element",
  { opacity: [0, 1], y: [20, 0] },
  { duration: 0.6, delay: stagger(0.1), easing: "ease-out" }
);
```

#### Scroll-Triggered Animations

**Feature Cards:**
- Animation: Fade in + slide up
- Trigger: When 20% of element enters viewport
- Stagger: 100ms between cards

**Implementation:**
```javascript
import { inView } from "motion";

inView(".feature-card", ({ target }) => {
  animate(target,
    { opacity: [0, 1], y: [40, 0] },
    { duration: 0.6, easing: "ease-out" }
  );
}, { amount: 0.2 });
```

**Section Headings:**
- Animation: Fade in + slight scale
- Trigger: When heading enters viewport
- Duration: 0.5s

**Stats/Numbers:**
- Animation: Count up from 0 to value
- Trigger: When stat block enters viewport
- Duration: 2s with easing

**Implementation (CountUp):**
```javascript
import { animate } from "motion";

inView(".stat-number", ({ target }) => {
  const endValue = parseInt(target.textContent);
  animate((progress) => {
    target.textContent = Math.round(progress * endValue);
  }, { duration: 2, easing: "ease-out" });
});
```

#### Hover Animations

**Buttons:**
- **Primary:** Lift (translateY: -2px) + shadow increase
- **Duration:** 200ms
- **Easing:** ease-out

**Cards:**
- **Lift:** translateY: -4px
- **Shadow:** Increase from `shadow-card` to `shadow-card-hover`
- **Duration:** 300ms
- **Optional:** Background gradient shift

**Links:**
- **Underline:** Slide in from left
- **Duration:** 200ms

**CSS Implementation:**
```css
.button-primary {
  transition: all 0.2s ease-out;
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.3);
}

.card-hover {
  transition: all 0.3s ease-out;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}
```

#### Micro-Interactions

**Form Success (Confetti):**
- Trigger: On waitlist form submission success
- Library: canvas-confetti (optional wow-factor)
- Duration: 3s burst

**Installation:**
```bash
npm install canvas-confetti
```

**Implementation:**
```javascript
import confetti from 'canvas-confetti';

function celebrateSignup() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D']
  });
}
```

**Input Focus:**
- Border color transition: gray → coral
- Ring: Subtle glow (box-shadow)
- Duration: 200ms

**Button Click:**
- Scale: Slightly shrink (0.98) on click
- Duration: 100ms
- Provides tactile feedback

#### Mobile Menu Animation

**Open Animation (Framer Motion):**
```typescript
const menuVariants = {
  closed: {
    x: "100%",
    transition: { type: "spring", stiffness: 400, damping: 40 }
  },
  open: {
    x: 0,
    transition: { type: "spring", stiffness: 400, damping: 40 }
  }
};

const backdropVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 }
};
```

**Nav Items:**
- Stagger animation (slide in from right)
- Delay: 50ms between items

### 6.3 Performance Optimization

**Best Practices:**
1. **Use GPU-accelerated properties:**
   - `transform` (translate, scale, rotate)
   - `opacity`
   - Avoid animating `width`, `height`, `top`, `left`

2. **Reduce motion for accessibility:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

3. **Lazy load animations:**
   - Use `inView` to only animate when elements are visible
   - Don't animate elements that are off-screen

4. **Limit concurrent animations:**
   - Max 10-15 elements animating simultaneously
   - Use stagger to spread animations over time

5. **Use `will-change` sparingly:**
```css
.animated-element {
  will-change: transform, opacity;
}

.animated-element.animation-complete {
  will-change: auto; /* Remove after animation */
}
```

### 6.4 Animation Budget

**Total JavaScript for animations:**
- Motion One: ~5 KB gzipped
- Framer Motion: ~32 KB gzipped (only loaded for interactive islands)
- canvas-confetti: ~7 KB gzipped (optional, lazy-loaded)
- **Total:** ~44 KB (well under 50 KB budget)

**Performance Budget:**
- FPS: 60fps (no dropped frames during animations)
- CPU usage: < 10% during scroll animations
- Memory: < 5 MB for animation libraries

### 6.5 Animation Implementation Priority

**Phase 1 (MVP Launch):**
- Hero entrance animation
- Scroll-triggered fade-ins for sections
- Button hover states
- Link hover underlines
- Form input focus states

**Phase 2 (Post-Launch Polish):**
- Feature card stagger animations
- Count-up numbers for stats
- Mobile menu slide-in
- Pricing calculator transitions

**Phase 3 (Wow-Factor Features):**
- Confetti on waitlist signup
- Parallax scrolling (subtle, hero section only)
- Morphing illustrations on hover
- Cursor-follow effects (desktop only)

---

## 7. Content Architecture

### 7.1 Content Management Strategy

**Approach:** Markdown + TypeScript (no CMS for MVP)

**Rationale:**
- Version control (Git)
- Type safety (TypeScript schemas)
- No CMS licensing/hosting costs
- Fast builds (no API calls)
- Easy migration to CMS later if needed

### 7.2 Content Collections (Astro)

**Configuration (src/content/config.ts):**
```typescript
import { defineCollection, z } from 'astro:content';

const featuresCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string(), // Lucide icon name
    category: z.enum(['planning', 'entertainment', 'payment', 'analytics']),
    benefit: z.string(), // "Zo bespaar je X uur"
    illustration: z.string().optional(),
    sortOrder: z.number(),
  }),
});

const testimonialsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    eventType: z.string().optional(),
    quote: z.string(),
    rating: z.union([z.literal(4), z.literal(5)]),
    avatar: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const faqCollection = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    category: z.enum(['general', 'pricing', 'features', 'technical', 'guests']),
    sortOrder: z.number(),
  }),
});

export const collections = {
  features: featuresCollection,
  testimonials: testimonialsCollection,
  faq: faqCollection,
};
```

### 7.3 Static Data Files

**src/data/features.ts:**
```typescript
export const FEATURE_CATEGORIES = {
  planning: {
    label: 'Planning',
    icon: 'Calendar',
    color: 'coral',
    features: [
      {
        id: 'invitations',
        title: 'Digitale uitnodigingen',
        description: 'Stuur professionele uitnodigingen via email of deelbare link',
        benefit: 'Bespaar tijd en papier',
        icon: 'Mail',
      },
      {
        id: 'dietary',
        title: 'Dieetwensen tracking',
        description: 'Verzamel automatisch allergieën en voorkeuren van gasten',
        benefit: 'Geen handmatige lijsten meer',
        icon: 'Salad',
      },
      {
        id: 'shopping',
        title: 'Automatische inkooplijst',
        description: 'AI berekent exact wat je nodig hebt op basis van aantal gasten en voorkeuren',
        benefit: 'Voorkom voedselverspilling en tekorten',
        icon: 'ShoppingCart',
      },
      {
        id: 'menu',
        title: 'Menu planning',
        description: 'Plan je menu met portieberekening op caterer-niveau',
        benefit: 'Professionele planning zonder ervaring',
        icon: 'UtensilsCrossed',
      },
    ],
  },
  entertainment: {
    label: 'Entertainment',
    icon: 'Sparkles',
    color: 'turquoise',
    features: [
      // ... similar structure
    ],
  },
  // ... more categories
} as const;
```

**src/data/pricing.ts:**
```typescript
export const PRICING_TIERS = [
  {
    id: 'free',
    name: 'Gratis',
    price: 0,
    period: null,
    description: 'Perfect voor kleinere feesten',
    features: [
      'Tot 20 gasten',
      'Digitale uitnodigingen',
      'RSVP tracking',
      'Dieetwensen verzamelen',
      'Handmatige inkooplijst',
      'Basis quiz',
      'Punten & leaderboard',
    ],
    cta: {
      text: 'Start gratis',
      href: '/waitlist',
    },
    highlighted: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 2.5,
    period: 'per gast (20+ gasten)',
    description: 'Voor onvergetelijke feesten',
    features: [
      'Alles van Gratis, plus:',
      'Onbeperkt aantal gasten',
      'AI-powered inkooplijst',
      'Geavanceerde quiz',
      'AI taak-toewijzing',
      'Voorspellingen & sweepstake',
      'Tikkie-integratie',
      'Post-party analytics',
      'Custom branding',
      'Priority support',
    ],
    cta: {
      text: 'Sluit je aan bij de waitlist',
      href: '/waitlist',
    },
    highlighted: true,
  },
] as const;

export const PRICING_CONFIG = {
  freeThreshold: 20,
  pricePerGuest: 2.5,
  currency: '€',
  minGuests: 10,
  maxGuests: 200,
} as const;
```

**src/data/navigation.ts:**
```typescript
export const MAIN_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Functies', href: '/functies' },
  { label: 'Hoe werkt het', href: '/hoe-werkt-het' },
  { label: 'Prijzen', href: '/prijzen' },
  { label: 'FAQ', href: '/faq' },
] as const;

export const FOOTER_NAV = {
  product: [
    { label: 'Functies', href: '/functies' },
    { label: 'Prijzen', href: '/prijzen' },
    { label: 'Demo', href: '/demo' },
    { label: 'Waitlist', href: '/waitlist' },
  ],
  company: [
    { label: 'Over ons', href: '/over-ons' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacybeleid', href: '/privacybeleid' },
    { label: 'Algemene voorwaarden', href: '/algemene-voorwaarden' },
  ],
  social: [
    { label: 'Twitter', href: 'https://twitter.com/partypilot', icon: 'Twitter' },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/partypilot', icon: 'Linkedin' },
  ],
} as const;
```

**src/data/siteConfig.ts:**
```typescript
export const SITE_CONFIG = {
  name: 'Party Pilot',
  tagline: 'Van uitnodiging tot afwas',
  description: 'De ultieme app voor feestorganisatie. Van digitale uitnodigingen tot live quiz en automatische inkooplijsten.',
  url: 'https://partypilot.nl',
  email: 'hello@partypilot.nl',
  social: {
    twitter: '@partypilot',
    linkedin: 'company/partypilot',
  },
  stats: {
    userCount: 2000,
    rating: 4.9,
    maxRating: 5,
  },
} as const;
```

### 7.4 Content Editing Workflow

**For Content Updates:**
1. Edit Markdown files in `src/content/`
2. Edit TypeScript data in `src/data/`
3. Commit changes to Git
4. Push to main branch
5. Netlify auto-deploys

**For New Blog Posts (future):**
1. Create Markdown file in `src/content/blog/`
2. Add frontmatter with schema
3. Write content in Markdown
4. Commit and push

**For Testimonials:**
1. Edit `src/content/testimonials/testimonials.json`
2. Follow JSON schema
3. Commit and push

### 7.5 Internationalization (Future)

**Current:** Dutch only (NL)

**Future Expansion (if needed):**
- Use Astro i18n routing
- Create `/en/` route prefix for English
- Duplicate content in English
- Language switcher in header

**Preparation:**
- Keep all user-facing strings in content files (not hardcoded)
- Use TypeScript constants for reusable strings
- Structure makes future translation easy

---

## 8. Technical Decisions

### 8.1 Core Technologies

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Astro** | 5.2+ | Static site framework | Zero JS by default, optimal performance |
| **React** | 18+ | Interactive islands | Industry standard, great DX |
| **Tailwind CSS** | v4 | Styling | JIT compilation, modern syntax |
| **TypeScript** | 5.0+ | Type safety | Catch errors at build time |
| **Motion One** | Latest | Scroll animations | Lightweight, high performance |
| **Framer Motion** | Latest | Complex animations | Advanced features for islands |
| **Lucide React** | Latest | Icons | Clean, modern, React-friendly |

### 8.2 NPM Packages

**Core Dependencies:**
```json
{
  "dependencies": {
    "astro": "^5.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "motion": "^11.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@astrojs/react": "^3.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  },
  "optionalDependencies": {
    "canvas-confetti": "^1.9.0",
    "astro-seo": "^0.8.0"
  }
}
```

**Additional Integrations (as needed):**
- `@astrojs/sitemap` - Auto-generate sitemap.xml
- `astro-seo` - SEO component with structured data
- `nanoid` - Generate referral codes (if custom waitlist)

### 8.3 Astro Configuration

**astro.config.mjs:**
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://partypilot.nl',
  
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin'), // Exclude admin pages from sitemap
    }),
  ],
  
  vite: {
    plugins: [tailwindcss()],
  },
  
  // Performance optimizations
  build: {
    inlineStylesheets: 'auto', // Inline critical CSS
  },
  
  // Image optimization
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp', // High-quality image optimization
    },
  },
  
  // Markdown configuration
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
```

### 8.4 Tailwind Configuration

**tailwind.config.mjs:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  
  theme: {
    extend: {
      colors: {
        // (Full color palette from Design System section)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // (Shadows from Design System section)
      },
      borderRadius: {
        // (Border radius from Design System section)
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
        },
      },
    },
  },
  
  plugins: [],
};
```

### 8.5 Image Optimization Strategy

**Format Strategy:**
- **Illustrations:** SVG (scalable, small file size)
- **Photos (if used):** WebP with JPEG fallback
- **Icons:** Inline SVG (Lucide React)
- **Open Graph images:** JPG (better social media compatibility)

**Responsive Images:**
```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/images/hero.png';
---

<Image
  src={heroImage}
  alt="Party Pilot hero illustration"
  width={1200}
  height={800}
  loading="eager"  {/* Hero image, load immediately */}
  format="webp"
  quality={85}
/>

<!-- For below-fold images -->
<Image
  src={featureImage}
  alt="Feature illustration"
  width={600}
  height={400}
  loading="lazy"  {/* Lazy load */}
  format="webp"
  quality={80}
/>
```

**Image Optimization Checklist:**
- Compress images before adding to repo (TinyPNG, Squoosh)
- Use `srcset` for responsive images (Astro handles this)
- Lazy load below-fold images
- Proper `alt` text for SEO and accessibility
- Reserve space to prevent CLS (width/height attributes)

### 8.6 SEO Configuration

**Sitemap Generation:**
- Auto-generated by `@astrojs/sitemap`
- Includes all public pages
- Excludes `/admin/`, `/demo/` (future)

**robots.txt:**
```
# /public/robots.txt
User-agent: *
Allow: /

Sitemap: https://partypilot.nl/sitemap.xml
```

**Meta Tags (SEO Component):**
```astro
---
// src/components/layout/SEO.astro
import { SITE_CONFIG } from '@/data/siteConfig';

interface Props {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string[];
}

const {
  title,
  description,
  canonical = Astro.url.pathname,
  ogImage = '/og/og-image.jpg',
  noindex = false,
  keywords = [],
} = Astro.props;

const fullTitle = `${title} | ${SITE_CONFIG.name}`;
const canonicalURL = new URL(canonical, SITE_CONFIG.url);
const ogImageURL = new URL(ogImage, SITE_CONFIG.url);
---

<!-- Primary Meta Tags -->
<title>{fullTitle}</title>
<meta name="title" content={fullTitle} />
<meta name="description" content={description} />
{keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
<link rel="canonical" href={canonicalURL} />
{noindex && <meta name="robots" content="noindex, nofollow" />}

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImageURL} />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content={canonicalURL} />
<meta property="twitter:title" content={fullTitle} />
<meta property="twitter:description" content={description} />
<meta property="twitter:image" content={ogImageURL} />
{SITE_CONFIG.social.twitter && <meta name="twitter:site" content={SITE_CONFIG.social.twitter} />}

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/images/icons/favicon.ico" />
```

**Structured Data (JSON-LD):**
```astro
---
// Homepage structured data
const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Party Pilot",
  "applicationCategory": "EventPlanner",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "2000"
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### 8.7 Form Handling

**MVP Approach: Netlify Forms**

**Advantages:**
- No backend needed
- Spam protection built-in
- Email notifications
- Easy setup

**Waitlist Form (Netlify):**
```astro
<form
  name="waitlist"
  method="POST"
  data-netlify="true"
  data-netlify-honeypot="bot-field"
>
  <input type="hidden" name="form-name" value="waitlist" />
  <input type="hidden" name="bot-field" /> {/* Honeypot for spam */}
  
  <input
    type="email"
    name="email"
    placeholder="je@email.nl"
    required
  />
  
  <button type="submit">Sluit je aan bij de waitlist</button>
</form>
```

**Future Migration: Supabase**
- When referral tracking is needed
- Store in existing `users` table
- Add `waitlist_signups` table
- Track referrals, position, etc.

**Contact Form (Netlify):**
```astro
<form
  name="contact"
  method="POST"
  data-netlify="true"
  data-netlify-honeypot="bot-field"
>
  <input type="hidden" name="form-name" value="contact" />
  <input type="hidden" name="bot-field" />
  
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <select name="subject">
    <option value="general">Algemene vraag</option>
    <option value="support">Support</option>
    <option value="partnership">Partnership</option>
    <option value="other">Anders</option>
  </select>
  <textarea name="message" required></textarea>
  
  <button type="submit">Verstuur bericht</button>
</form>
```

### 8.8 Analytics Setup

**Google Analytics 4:**
```astro
---
// src/layouts/BaseLayout.astro
const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
---

{GA_MEASUREMENT_ID && (
  <>
    <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '{GA_MEASUREMENT_ID}');
    </script>
  </>
)}
```

**Microsoft Clarity (Heatmaps):**
```astro
{/* Optional: Add Clarity tracking code if needed */}
```

**Event Tracking:**
```javascript
// Track waitlist signups
gtag('event', 'signup', {
  'event_category': 'waitlist',
  'event_label': 'email'
});

// Track button clicks
gtag('event', 'click', {
  'event_category': 'cta',
  'event_label': 'join_waitlist'
});
```

### 8.9 Environment Variables

**.env.example:**
```env
# Analytics
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Forms (for future Supabase migration)
# PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# PUBLIC_SUPABASE_ANON_KEY=xxx
```

**Usage in Astro:**
```typescript
const gaId = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
```

**Note:** Prefix with `PUBLIC_` to make available in client-side code.

---

## 9. Testimonials Data

### 9.1 Testimonial Structure

**File:** `src/content/testimonials/testimonials.json`

```json
[
  {
    "name": "Lars van der Meer",
    "eventType": "50e verjaardag",
    "quote": "Party Pilot heeft mijn verjaardagsfeest van stress naar succes getransformeerd. De automatische inkooplijst was spot-on, en de quiz was de hit van de avond!",
    "rating": 5,
    "featured": true
  },
  {
    "name": "Sophie Janssen",
    "eventType": "Zomerbbq",
    "quote": "Eindelijk een app die snapt dat iedereen andere dieetwensen heeft. Geen handmatige lijstjes meer, alles automatisch geregeld. Top!",
    "rating": 5,
    "featured": true
  },
  {
    "name": "Joris de Vries",
    "eventType": "Bedrijfsborrel",
    "quote": "Als bedrijf hebben we Party Pilot gebruikt voor ons teamuitje. Betaalverzoeken via Tikkie maakte het super makkelijk. Aanrader!",
    "rating": 5,
    "featured": false
  },
  {
    "name": "Emma Bakker",
    "eventType": "Housewarming",
    "quote": "De AI taak-toewijzing is hilarisch én nuttig. Iedereen kreeg een taak die perfect paste, en het zorgde voor veel gelach. Love it!",
    "rating": 5,
    "featured": true
  },
  {
    "name": "Thijs Hendriks",
    "eventType": "Verjaardag",
    "quote": "Party Pilot is zo goed dat ik eigenlijk blij was toen ik een feest moest organiseren. En dat zeg ik niet vaak.",
    "rating": 4,
    "featured": true
  },
  {
    "name": "Lisa Vermeulen",
    "eventType": "Tuinfeest",
    "quote": "De quiz functie is geweldig! Gasten waren al competitief voordat het feest begon. De spanning was voelbaar!",
    "rating": 5,
    "featured": false
  },
  {
    "name": "Mark Jansen",
    "eventType": "BBQ",
    "quote": "Normaal gesproken haat ik organiseren, maar Party Pilot maakte het zo makkelijk dat ik nu vaker feestjes geef. Gevaarlijk eigenlijk.",
    "rating": 5,
    "featured": false
  },
  {
    "name": "Nina Peters",
    "eventType": "Jubileum",
    "quote": "De menuplanning met portieberekening is echt caterer-niveau. Geen voedselverspilling, iedereen had genoeg. Perfect!",
    "rating": 5,
    "featured": false
  },
  {
    "name": "Kevin de Jong",
    "eventType": "Vrijgezellenfeest",
    "quote": "Als iemand die elk detail wil controleren, was ik sceptisch. Maar Party Pilot gaf me juist meer controle, niet minder. Impressed!",
    "rating": 5,
    "featured": false
  },
  {
    "name": "Sarah Willems",
    "eventType": "Bruiloft",
    "quote": "Voor onze bruiloft was Party Pilot een lifesaver. 120 gasten, allemaal hun voorkeuren, en de app regelde alles. Onze wedding planner was jaloers!",
    "rating": 5,
    "featured": true
  },
  {
    "name": "Robin Smit",
    "eventType": "Nieuwjaarsborrel",
    "quote": "De voorspellingen/sweepstake feature maakte onze borrel interactief. Iedereen deed mee, en we hebben er nog weken over nagepraat!",
    "rating": 5,
    "featured": false
  },
  {
    "name": "Julia Martens",
    "eventType": "Verjaardagsfeest",
    "quote": "Party Pilot is gebruiksvriendelijk voor iedereen, zelfs mijn oma kon zonder moeite haar dieetwensen invullen. Dat zegt genoeg!",
    "rating": 5,
    "featured": false
  }
]
```

### 9.2 Testimonial Display Logic

**Featured Testimonials (Homepage):**
- Display testimonials with `"featured": true`
- Limit to 3-4 testimonials
- Include the 4-star sarcastic review (Thijs Hendriks)
- Randomize order on each page load (optional)

**All Testimonials (Features/Testimonials Page):**
- Display all testimonials
- Group by rating or event type
- Optional filtering

**Implementation:**
```astro
---
import { getCollection } from 'astro:content';

// Get all testimonials
const allTestimonials = await getCollection('testimonials');

// Filter featured testimonials
const featuredTestimonials = allTestimonials.filter(t => t.data.featured);

// Get random 3 featured testimonials (includes 4-star)
const randomFeatured = featuredTestimonials
  .sort(() => Math.random() - 0.5)
  .slice(0, 3);
---
```

### 9.3 Testimonial Card Design

**Key Elements:**
- Star rating (visual, not just number)
- Quote in quotation marks
- Name and event type
- Optional avatar (use initials if no photo)

**Example Card:**
```astro
<div class="testimonial-card bg-white p-6 rounded-lg shadow-card">
  <div class="stars mb-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <Icon 
        name={i < rating ? 'Star' : 'StarOff'} 
        class={i < rating ? 'text-sunshine-500 fill-current' : 'text-gray-300'}
      />
    ))}
  </div>
  
  <blockquote class="text-gray-700 mb-4">
    "{quote}"
  </blockquote>
  
  <div class="flex items-center gap-3">
    <div class="avatar bg-coral-100 text-coral-600 w-12 h-12 rounded-full flex items-center justify-center font-semibold">
      {name.split(' ').map(n => n[0]).join('')}
    </div>
    <div>
      <p class="font-semibold text-charcoal">{name}</p>
      <p class="text-sm text-gray-500">{eventType}</p>
    </div>
  </div>
</div>
```

---

## 10. Deployment Architecture

### 10.1 Hosting Platform: Netlify

**Why Netlify:**
- Automatic Astro detection
- Zero-config deployment
- Global CDN
- Automatic HTTPS
- Preview deployments for PRs
- Edge network (fast worldwide)
- Generous free tier

**Deployment Flow:**
1. Push to `main` branch → Production deployment
2. Open PR → Preview deployment (unique URL)
3. Merge PR → New production deployment

### 10.2 Netlify Configuration

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20.3.0"

[[redirects]]
  from = "/*"
  to = "/404"
  status = 404

# Redirect www to non-www (when custom domain is added)
[[redirects]]
  from = "https://www.partypilot.nl/*"
  to = "https://partypilot.nl/:splat"
  status = 301
  force = true

# Netlify Forms configuration
[[plugins]]
  package = "@netlify/plugin-forms"

# Headers for security and performance
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

# Cache static assets
[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 10.3 Custom Domain Setup

**Steps:**
1. Purchase domain: `partypilot.nl`
2. In Netlify: Domain settings → Add custom domain
3. Update DNS records (Netlify provides nameservers)
4. Enable HTTPS (automatic via Let's Encrypt)

**DNS Configuration (Netlify Nameservers):**
- Netlify handles all DNS
- Automatic SSL certificate provisioning
- CDN distribution

### 10.4 Build Configuration

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check && tsc --noEmit"
  }
}
```

**Build Command:** `npm run build`
**Publish Directory:** `dist`
**Node Version:** 20.3.0+

### 10.5 Environment Variables

**Netlify Dashboard → Site Settings → Environment Variables:**
```
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**For Future Supabase Integration:**
```
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 10.6 Performance Optimizations

**Netlify Edge:**
- Static files served from global CDN
- Automatic Brotli/Gzip compression
- HTTP/2 and HTTP/3 support

**Build Optimizations:**
```javascript
// astro.config.mjs
export default defineConfig({
  build: {
    inlineStylesheets: 'auto', // Inline critical CSS for faster FCP
    assets: '_astro', // Asset directory
  },
  compressHTML: true, // Minify HTML
});
```

**Image Optimizations:**
- Astro's `<Image />` component auto-generates WebP
- Responsive srcset generated automatically
- Lazy loading for below-fold images

### 10.7 Monitoring & Analytics

**Netlify Analytics (Optional Paid Feature):**
- Server-side analytics (no JavaScript)
- Page views, unique visitors, bandwidth
- No impact on performance

**Alternative: Google Analytics 4 (Free):**
- Client-side tracking
- Conversion tracking (waitlist signups)
- User behavior flow

**Performance Monitoring:**
- Lighthouse CI (run on each deploy)
- Web Vitals tracking via GA4
- Core Web Vitals: LCP, FID, CLS

**Uptime Monitoring:**
- Netlify status page (automatic)
- Optional: UptimeRobot or Pingdom for alerts

### 10.8 Deployment Checklist

**Before First Deploy:**
- [ ] Update `site` in `astro.config.mjs` to production URL
- [ ] Set environment variables in Netlify
- [ ] Test build locally: `npm run build && npm run preview`
- [ ] Verify all forms work with Netlify Forms
- [ ] Check all internal links
- [ ] Validate SEO meta tags on all pages
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit (95+ score target)

**Custom Domain Setup:**
- [ ] Purchase domain `partypilot.nl`
- [ ] Add to Netlify
- [ ] Update DNS
- [ ] Enable HTTPS
- [ ] Add www → non-www redirect

**Post-Deploy:**
- [ ] Submit sitemap to Google Search Console
- [ ] Verify Google Analytics tracking
- [ ] Test all forms in production
- [ ] Check performance on real devices
- [ ] Monitor error logs in Netlify

### 10.9 CI/CD Pipeline (Optional)

**GitHub Actions (Optional Advanced Setup):**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run check  # Type check
      - run: npm run build
      - run: npx lighthouse-ci autorun  # Lighthouse CI
```

**For MVP:** Netlify's auto-deploy is sufficient (no need for custom CI/CD)

### 10.10 Disaster Recovery

**Backup Strategy:**
- Git repository (all code/content versioned)
- Netlify deployment history (rollback to any previous deploy)
- No database (stateless site, no backup needed for MVP)

**Rollback Procedure:**
1. Netlify dashboard → Deploys
2. Find last working deployment
3. Click "Publish deploy"
4. Site reverts instantly

**Future (with Supabase):**
- Daily automated backups (Supabase built-in)
- Point-in-time recovery available

---

## 11. Quality Assurance

### 11.1 Performance Checklist

**Target Metrics:**
- **Lighthouse Performance:** 95+
- **First Contentful Paint (FCP):** < 0.8s
- **Largest Contentful Paint (LCP):** < 1.2s
- **Cumulative Layout Shift (CLS):** < 0.1
- **Total Blocking Time (TBT):** < 200ms
- **Time to Interactive (TTI):** < 2s

**Optimization Checklist:**
- [ ] Images optimized (WebP, correct sizes)
- [ ] Critical CSS inlined
- [ ] JavaScript islands hydrated strategically
- [ ] Fonts loaded efficiently (font-display: swap)
- [ ] No render-blocking resources
- [ ] Preconnect to third-party domains
- [ ] Lazy load below-fold content

### 11.2 Accessibility Checklist (WCAG 2.1 AA)

- [ ] **Color Contrast:** All text meets 4.5:1 ratio (AA standard)
- [ ] **Keyboard Navigation:** All interactive elements accessible via Tab
- [ ] **Focus Indicators:** Visible focus states on all focusable elements
- [ ] **Alt Text:** All images have descriptive alt attributes
- [ ] **Semantic HTML:** Proper heading hierarchy (H1 → H2 → H3)
- [ ] **ARIA Labels:** Used where needed (form inputs, buttons)
- [ ] **Skip Links:** "Skip to main content" link at top
- [ ] **Form Labels:** All inputs have associated labels
- [ ] **Error Messages:** Clear, descriptive error messages
- [ ] **Reduced Motion:** Respect `prefers-reduced-motion` media query

**Testing Tools:**
- axe DevTools (browser extension)
- WAVE (web accessibility evaluation tool)
- Lighthouse accessibility audit

### 11.3 SEO Checklist

- [ ] **Title Tags:** Unique, descriptive (50-60 chars)
- [ ] **Meta Descriptions:** Compelling, keyword-rich (150-160 chars)
- [ ] **Heading Structure:** Single H1 per page, logical hierarchy
- [ ] **Canonical URLs:** Set on all pages
- [ ] **Open Graph Tags:** For social sharing
- [ ] **Structured Data:** JSON-LD for rich snippets
- [ ] **Sitemap:** Auto-generated, submitted to Search Console
- [ ] **robots.txt:** Properly configured
- [ ] **Mobile-Friendly:** Passes Google mobile-friendly test
- [ ] **Internal Linking:** All pages linked from navigation or content
- [ ] **URL Structure:** Clean, descriptive URLs (Dutch keywords)
- [ ] **Image Optimization:** Alt text, file names, compression

**Keywords to Target (Dutch):**
- feest organiseren
- party planner Nederland
- digitale uitnodiging
- automatische inkooplijst
- feest app
- bbq organiseren
- verjaardag plannen
- menu planning feest

### 11.4 Browser Compatibility

**Target Browsers:**
- Chrome (last 2 versions)
- Safari (last 2 versions)
- Firefox (last 2 versions)
- Edge (last 2 versions)
- Mobile Safari (iOS 15+)
- Chrome Mobile (Android 10+)

**No Support Needed:**
- IE11 (deprecated in 2026)

**Testing:**
- BrowserStack or manual testing
- Test on real devices (iPhone, Android)

### 11.5 Responsive Design Checklist

**Breakpoints:**
- Mobile: 375px - 639px
- Tablet: 640px - 1023px
- Desktop: 1024px+

**Testing Checklist:**
- [ ] Mobile (375px, 414px)
- [ ] Tablet (768px, 1024px)
- [ ] Desktop (1280px, 1920px)
- [ ] All touch targets ≥ 44×44px (mobile)
- [ ] Text readable without zoom (16px+ on mobile)
- [ ] Navigation works on mobile (hamburger menu)
- [ ] Forms usable on mobile
- [ ] Images scale properly
- [ ] No horizontal scrolling

### 11.6 Pre-Launch Checklist

**Content Review:**
- [ ] All copy proofread (Dutch spelling/grammar)
- [ ] Links tested (no 404s)
- [ ] Contact email works
- [ ] Social media links correct (if applicable)
- [ ] Legal pages complete (privacy, terms)

**Functionality:**
- [ ] Waitlist form submits successfully
- [ ] Contact form submits successfully
- [ ] Form validation works
- [ ] Success/error messages display correctly
- [ ] Mobile menu opens/closes smoothly
- [ ] All animations work smoothly
- [ ] Pricing calculator calculates correctly

**Technical:**
- [ ] HTTPS enabled
- [ ] Custom domain configured
- [ ] Analytics tracking code active
- [ ] Sitemap accessible
- [ ] Favicon displays correctly
- [ ] Open Graph images display in social previews

**Performance:**
- [ ] Lighthouse score 95+ on all pages
- [ ] Mobile performance acceptable
- [ ] Page load < 2s on 3G

**Security:**
- [ ] HTTPS enforced (no HTTP)
- [ ] Security headers configured
- [ ] No exposed API keys in client code
- [ ] Forms have spam protection (honeypot)

---

## 12. Architecture Decision Records (ADRs)

### ADR-001: Choose Astro over Next.js for Marketing Site

**Status:** Accepted

**Context:**
Marketing site needs optimal performance and SEO. Two main options: Astro or Next.js.

**Decision:**
Use Astro 5.2+ for the marketing website.

**Rationale:**
- **Performance:** Astro ships zero JavaScript by default (Next.js always includes React runtime)
- **Learning Curve:** Similar to React/Next.js, easy for team to adopt
- **Islands Architecture:** Perfect for marketing site (mostly static with selective interactivity)
- **Content-First:** Built for content-heavy sites
- **Build Speed:** Faster builds than Next.js for static sites

**Consequences:**
- Excellent performance (sub-1s page loads)
- Limited to static site generation (no SSR needed for marketing)
- React islands still available for interactive components
- Easy migration to Next.js later if full app needed

---

### ADR-002: Use Tailwind CSS v4 instead of CSS Modules

**Status:** Accepted

**Context:**
Need styling solution that's fast, maintainable, and allows rapid iteration.

**Decision:**
Use Tailwind CSS v4 with JIT compilation.

**Rationale:**
- **Speed:** JIT compilation generates only used CSS
- **DX:** Utility-first approach speeds up development
- **Consistency:** Design tokens enforced via config
- **Modern:** v4 has improved syntax and Vite integration
- **File Size:** Only ships CSS actually used (smaller bundles)

**Consequences:**
- Steeper learning curve for non-Tailwind developers
- HTML classes can be verbose
- Excellent performance and consistency
- Easy to maintain design system

---

### ADR-003: Netlify Forms for MVP, Migrate to Supabase Later

**Status:** Accepted

**Context:**
Need form handling for waitlist and contact forms.

**Decision:**
Use Netlify Forms for MVP, plan migration to Supabase for referral tracking.

**Rationale:**
**MVP (Netlify Forms):**
- No backend code needed
- Built-in spam protection
- Email notifications
- Zero cost
- Fast implementation

**Future (Supabase):**
- Referral tracking requires database
- Position calculation needs backend logic
- Already using Supabase for main app
- Easy migration path

**Consequences:**
- MVP ships faster with Netlify Forms
- Referral feature delayed until Supabase migration
- Minor refactor needed for migration (low risk)

---

### ADR-004: Motion One for Scroll Animations, Framer Motion for Complex Interactions

**Status:** Accepted

**Context:**
Need animations that are performant, smooth, and enhance UX without bloating bundle size.

**Decision:**
- Motion One for scroll-triggered animations
- Framer Motion for complex React island animations

**Rationale:**
**Motion One:**
- Lightweight (5 KB gzipped)
- Built-in `inView` for scroll animations
- High performance (GPU-accelerated)
- Simple API

**Framer Motion:**
- Industry standard for React animations
- Advanced features (gestures, layout animations)
- Only loaded in React islands (selective hydration)
- Familiar to React developers

**Consequences:**
- Total animation JS: ~44 KB (under budget)
- Best performance for each use case
- Two libraries to learn (but both have good docs)

---

### ADR-005: No CMS for MVP, Use Markdown + TypeScript

**Status:** Accepted

**Context:**
Need content management that's fast, version-controlled, and doesn't require external services.

**Decision:**
Use Markdown files + TypeScript data files, no headless CMS.

**Rationale:**
- **Version Control:** All content in Git
- **Type Safety:** Astro content collections with Zod schemas
- **Speed:** No API calls, all content at build time
- **Cost:** Zero (no CMS license)
- **Migration Path:** Easy to migrate to CMS later if needed

**Consequences:**
- Non-technical users need Git knowledge to update content
- All updates require redeployment
- Excellent performance (no runtime API calls)
- Simple architecture
- Future: Can add headless CMS (Contentful, Sanity) if needed

---

## 13. Next Steps for Implementation

### Phase 1: Foundation (Week 1)
1. Initialize Astro project with React integration
2. Set up Tailwind CSS v4 configuration
3. Create design tokens and base styles
4. Build layout components (Header, Footer, BaseLayout)
5. Configure Netlify deployment

### Phase 2: Core Pages (Week 1-2)
1. Homepage (highest priority)
2. Waitlist page with form
3. Features page
4. Pricing page with calculator
5. FAQ page

### Phase 3: Supporting Pages (Week 2)
1. How It Works page
2. About page
3. Contact page with form
4. Legal pages (Privacy, Terms)
5. 404 page

### Phase 4: Polish & Launch (Week 2-3)
1. Add animations (Motion One)
2. Optimize images and performance
3. SEO optimization (meta tags, structured data)
4. Accessibility audit and fixes
5. Cross-browser testing
6. Mobile testing
7. Launch to production

### Phase 5: Post-Launch (Ongoing)
1. Monitor analytics
2. A/B test waitlist conversion
3. Add blog content (SEO)
4. Migrate to Supabase for referral tracking
5. Iterate based on user feedback

---

## 14. Summary & Handoff

### Architecture Highlights

This architecture document provides a complete blueprint for the Party Pilot marketing website:

**Technical Foundation:**
- Astro 5.2+ with React islands for optimal performance
- Tailwind CSS v4 for consistent, maintainable styling
- Motion One + Framer Motion for performant animations
- Netlify for zero-config deployment with global CDN

**Design System:**
- Fresh, light color palette (coral, turquoise, sunshine accents)
- Inter typography for modern, readable text
- Mobile-first responsive design
- Comprehensive component library

**10-Page Site Structure:**
1. Homepage (conversion-optimized)
2. Features (comprehensive product info)
3. How It Works (step-by-step guide)
4. Pricing (transparent with calculator)
5. FAQ (objection handling)
6. About (trust building)
7. Contact (support)
8. Blog (future SEO)
9. Demo (future interactive)
10. Waitlist (referral mechanism)

**Performance Targets:**
- Lighthouse: 95+ score
- FCP: < 0.8s
- LCP: < 1.2s
- Total JS: < 50 KB
- Waitlist conversion: 40%+

**Deployment:**
- Netlify with automatic Astro detection
- Custom domain: partypilot.nl
- HTTPS enabled
- Global CDN distribution
- Preview deployments for PRs

### Files Delivered

**Architecture Documentation:**
- `/Users/alwinvandijken/Projects/github.com/ApexChef/Bovenkamer-events/marketing-website/docs/ARCHITECTURE.md` (this file)

**Reference Documents:**
- `marketing-website/docs/PREPARE.md` (comprehensive research)
- `marketing-website/VRAGEN.md` (client requirements)

### Handoff to Code Phase

This architecture is ready for implementation. All major decisions are documented, component interfaces are defined, and the technical stack is specified.

**Key Recommendations for Coding:**
1. Start with design system and layout components (foundation)
2. Build homepage first (highest priority for conversion)
3. Use TypeScript strictly (type safety prevents bugs)
4. Follow mobile-first approach (75%+ mobile traffic)
5. Test on real devices early and often
6. Measure performance on every page (target 95+ Lighthouse)

**Success Criteria:**
- All 10 pages functional and responsive
- Lighthouse score 95+ on all pages
- Waitlist form capturing emails successfully
- Site live on partypilot.nl within 2-3 weeks
- 40%+ waitlist conversion rate achieved

---

**Architecture Complete**
**Date:** January 30, 2026
**Next Phase:** PACT Code - Begin implementation starting with homepage

Pass control back to Orchestrator with summary of architectural decisions and location of complete documentation.
