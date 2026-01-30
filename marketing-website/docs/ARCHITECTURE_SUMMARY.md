# Party Pilot Marketing Website - Architecture Summary

**Status:** Complete
**Date:** January 30, 2026
**Full Documentation:** See `ARCHITECTURE.md` for complete details

---

## Quick Reference

### Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Astro | 5.2+ |
| Styling | Tailwind CSS | v4 |
| Interactive | React | 18+ |
| Animations | Motion One + Framer Motion | Latest |
| Icons | Lucide React | Latest |
| Hosting | Netlify | - |
| Forms | Netlify Forms → Supabase | MVP → Future |

### Project Structure

```
marketing-website/
├── src/
│   ├── components/       # Layout, sections, UI, islands, animations
│   ├── content/          # Markdown content (features, testimonials, FAQ)
│   ├── data/             # Static data (pricing, navigation, config)
│   ├── layouts/          # Page layouts
│   ├── pages/            # 10 routes (homepage, features, pricing, etc.)
│   ├── styles/           # Global CSS, Tailwind imports
│   └── utils/            # Helper functions
├── public/               # Static assets (images, fonts, icons)
└── docs/                 # This documentation
```

### Design System Colors

```
Primary:   #FF6B6B (Coral - celebration)
Secondary: #4ECDC4 (Turquoise - fresh)
Tertiary:  #FFE66D (Sunshine - joy)
Background: #F9F7F4 (Warm white)
Text:      #1A1A1A (Charcoal)
```

### 10 Pages

1. **/** - Homepage (highest conversion priority)
2. **/functies** - Features overview
3. **/hoe-werkt-het** - How it works (step-by-step)
4. **/prijzen** - Pricing with interactive calculator
5. **/faq** - Frequently asked questions
6. **/over-ons** - About us (mission, story)
7. **/contact** - Contact form
8. **/blog** - Blog (future phase)
9. **/demo** - Interactive demo (future phase)
10. **/waitlist** - Dedicated waitlist page with referral

### Performance Targets

- **Lighthouse:** 95+ score
- **FCP:** < 0.8s
- **LCP:** < 1.2s
- **CLS:** < 0.1
- **Total JS:** < 50 KB
- **Waitlist Conversion:** 40%+

### Key Components

**Layout:**
- Header.astro (sticky nav)
- Footer.astro (links, social, legal)
- SEO.astro (meta tags, OG, structured data)

**Sections:**
- Hero.astro (headline, CTA, illustration)
- Features.astro (feature grid)
- HowItWorks.astro (step-by-step)
- PricingTable.astro (tiers comparison)
- Testimonials.astro (social proof)
- FAQ.astro (accordion)
- CTASection.astro (conversion-focused)

**React Islands:**
- WaitlistForm.tsx (email capture + referral)
- PricingCalculator.tsx (interactive slider)
- ContactForm.tsx (contact submission)
- MobileMenu.tsx (hamburger menu)

### Pricing Model

- **Free:** Up to 20 guests
- **Premium:** €2.50 per guest (20+ guests)
- **Enterprise:** Custom pricing (100+ guests)

### Deployment

**Platform:** Netlify
**Domain:** partypilot.nl (custom)
**Build:** `npm run build`
**Deploy:** Auto on push to main

**Environment Variables:**
```
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Content Management

**MVP:** Markdown + TypeScript (no CMS)
- Features: `src/content/features/*.md`
- Testimonials: `src/content/testimonials/testimonials.json`
- FAQ: `src/content/faq/*.md`
- Static data: `src/data/*.ts`

**Future:** Migrate to headless CMS if needed (Contentful, Sanity)

### Forms

**MVP:** Netlify Forms (waitlist, contact)
**Future:** Supabase (referral tracking, position calculation)

### SEO Strategy

**Keywords (Dutch):**
- feest organiseren
- party planner Nederland
- digitale uitnodiging
- automatische inkooplijst
- feest app
- bbq organiseren

**Optimizations:**
- Auto-generated sitemap
- Open Graph tags
- JSON-LD structured data
- Mobile-first responsive
- Fast page loads (< 1s FCP)

### Animation Strategy

**Scroll Animations (Motion One):**
- Fade in + slide up for sections
- Stagger effects for feature cards
- Count-up for stats

**Interactive Animations (Framer Motion):**
- Mobile menu slide-in
- Button hover states
- Form transitions

**Optional Wow-Factor:**
- Confetti on waitlist signup success
- Parallax scrolling (subtle, hero only)

### Development Workflow

1. Clone repo
2. `npm install`
3. `npm run dev` (http://localhost:4321)
4. Edit files in `src/`
5. Commit to feature branch
6. Open PR (auto preview deployment)
7. Merge to main (auto production deployment)

### Quality Checklist

- [ ] Lighthouse 95+ on all pages
- [ ] Mobile responsive (375px - 1920px)
- [ ] WCAG 2.1 AA accessibility
- [ ] All forms functional
- [ ] SEO meta tags complete
- [ ] Analytics tracking active
- [ ] Cross-browser tested
- [ ] Real device tested

### Implementation Phases

**Phase 1 (Week 1):** Foundation + Homepage
**Phase 2 (Week 1-2):** Core pages (Features, Pricing, FAQ, Waitlist)
**Phase 3 (Week 2):** Supporting pages (About, Contact, Legal)
**Phase 4 (Week 2-3):** Polish, animations, testing, launch
**Phase 5 (Ongoing):** Monitor, iterate, add blog content

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run check
```

---

## Architecture Decisions (ADRs)

**ADR-001:** Astro over Next.js (performance, zero JS by default)
**ADR-002:** Tailwind CSS v4 (JIT compilation, design tokens)
**ADR-003:** Netlify Forms for MVP (simple, migrate to Supabase later)
**ADR-004:** Motion One + Framer Motion (lightweight + advanced features)
**ADR-005:** No CMS for MVP (version control, type safety, zero cost)

---

## Next Steps

Pass control to **PACT Coder** to begin implementation:

1. Initialize Astro project
2. Set up Tailwind v4 + design tokens
3. Build layout components (Header, Footer)
4. Create homepage
5. Add remaining pages
6. Configure Netlify deployment

**Target:** Site live on partypilot.nl within 2-3 weeks

---

**Full Details:** See `/marketing-website/docs/ARCHITECTURE.md` (14 sections, 2000+ lines)
