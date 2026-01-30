# US-014 v2: Menu & Inkoopberekening - PREPARE Phase

## Executive Summary

This document contains the research findings for implementing a **dynamic menu & inkoopberekening (shopping list calculation)** system. This is v2 of US-014, building on top of the fully implemented F&B preference report (v1).

**What v1 delivered (complete):**
- F&B rapport page (`/admin/fb-rapport`) showing aggregated food/drink preferences
- Calculation library (`src/lib/fb-calculations.ts`) for meat, drink, and dietary statistics
- Report components (`src/components/fb-report/`) for visual display
- API endpoint (`/api/admin/fb-report`) for fetching preference data
- Excel/CSV/PDF export functionality

**What v2 adds (to be built):**
- Event/Course/Menu-item management (admin CRUD)
- Dynamic shopping list calculation based on menu + participant preferences
- Yield percentage handling (bruto vs netto weights)
- Three calculation types: protein (preference-driven), side (evenly split), fixed (per-person)
- LLM-assisted menu item suggestions (yield %, waste description)
- Shopping list display per course with totals

**Key Findings:**
1. Three new database tables needed: `events`, `event_courses`, `menu_items`
2. Existing `food_drink_preferences.meat_distribution` provides category averages for protein calculations
3. Calculation engine is pure math - no new external dependencies required
4. Admin CRUD UI follows existing patterns (DashboardLayout, Card-based, Framer Motion)
5. Existing `fb-calculations.ts` can be extended or a separate `menu-calculations.ts` created

**Recommendations:**
1. Create separate calculation module (`src/lib/menu-calculations.ts`) to keep concerns clean
2. Use Supabase cascading deletes for event/course/item hierarchy
3. Admin UI at `/admin/menu` with nested course/item management
4. Shopping list view at `/admin/inkooplijst` or as section within menu page
5. Optional LLM integration via existing Anthropic API key for yield suggestions

---

## v1 Implementation Status (What Already Exists)

### Fully Implemented Components

| Component | File | Status |
|-----------|------|--------|
| F&B Report Page | `src/app/admin/fb-rapport/page.tsx` | Complete |
| F&B Report API | `src/app/api/admin/fb-report/route.ts` | Complete |
| Calculation Library | `src/lib/fb-calculations.ts` | Complete |
| ReportHeader | `src/components/fb-report/ReportHeader.tsx` | Complete |
| DietaryWarnings | `src/components/fb-report/DietaryWarnings.tsx` | Complete |
| MeatBreakdown | `src/components/fb-report/MeatBreakdown.tsx` | Complete |
| DrinkBreakdown | `src/components/fb-report/DrinkBreakdown.tsx` | Complete |
| SidesBreakdown | `src/components/fb-report/SidesBreakdown.tsx` | Complete |
| PersonDetailList | `src/components/fb-report/PersonDetailList.tsx` | Complete |
| F&B Types | `src/types/index.ts` (lines 586-769) | Complete |
| Database | `food_drink_preferences` table | Complete |
| Food-Drinks API | `src/app/api/food-drinks/route.ts` | Complete |

### Existing Calculation Functions (fb-calculations.ts)

```typescript
// Constants already defined:
PORTION_SIZES = { meat: 200g, wine: 2 glasses, beer: 2 bottles, bubbles: 1 glass }
CONTAINER_SIZES = { wineBottle: 750ml, beerCrate: 24, ... }
MEAT_CATEGORIES = ['pork', 'beef', 'chicken', 'game', 'fish', 'vegetarian']

// Functions already implemented:
calculateMeatStats(persons) → MeatStats  // weighted distribution per category
calculateDrinkStats(persons) → DrinkStats  // wine, beer, soft drinks, water, bubbles
groupDietaryRequirements(persons) → DietaryGroups
formatWinePreference(preference) → string
calculateAverageVeggies(persons) → number
calculateAverageSauces(persons) → number
```

### Existing Database: food_drink_preferences

```sql
-- Key columns providing input for v2 calculations:
user_id UUID REFERENCES users(id)
person_type TEXT ('self' | 'partner')
meat_distribution JSONB DEFAULT '{"pork":20,"beef":20,"chicken":20,"game":10,"fish":15,"vegetarian":15}'
-- ^ This is the primary input for protein-item calculations
```

The **average meat_distribution** across all persons (self + partner) drives how protein items are distributed across categories in the menu system.

---

## New System: Menu & Inkoopberekening

### Concept

The system generates a **complete shopping list** based on a menu with courses (gangen). It is not tied to a specific event type - it works for BBQ, dinner, lunch, or any meal.

```
Event (e.g., "Nieuwjaars BBQ 2026", type: BBQ)
  +-- Course 1: Aperitief (80g p.p.)
  |     +-- Borrelhapjes (fixed, 50g p.p.)
  |     +-- Nootjes (fixed, 30g p.p.)
  +-- Course 2: Hoofdgerecht (450g p.p.)
  |     +-- Picanha (protein, beef, 50% of beef)
  |     +-- Kipsate (protein, chicken, 100%)
  |     +-- Hele zalm (protein, fish, 100%)
  |     +-- Courgette (side, vegetables)
  |     +-- Stokbrood (fixed, 80g p.p.)
  +-- Course 3: Dessert (150g p.p.)
        +-- Ananas (fixed, fruit, 150g p.p.)
```

### Three Item Types

| Type | When Used | Calculation Basis | Example |
|------|-----------|------------------|---------|
| `protein` | Meat/fish/vega | Course budget x category% x item distribution% / yield% | Picanha, Zalm, Kipsate |
| `side` | Accompaniments | Course budget / number_of_sides / yield% | Courgette, Salade |
| `fixed` | Items with own portion | Persons x grams_per_person / yield% | Stokbrood, Saus, Ananas |

### Calculation Formulas

**Per course:**
```
T_course = Number_of_Persons x course.grams_per_person
```

**Protein items:**
```
C_i = T_course x AVG(meat_distribution[category_i])     // category budget
P_j = C_i x distribution_percentage_j                    // item's share of category
B_j = P_j / yield_percentage_j                           // bruto (accounting for waste)
I_j = CEIL(B_j / unit) x unit                            // rounded to purchase unit
```

**Side items:**
```
Per_Item = T_course / Number_of_Side_Items
B_j = Per_Item / yield_percentage_j
I_j = CEIL(B_j / unit) x unit
```

**Fixed items:**
```
Edible_j = Number_of_Persons x item.grams_per_person
B_j = Edible_j / yield_percentage_j
I_j = CEIL(B_j / unit) x unit
```

---

## Database Schema (New Tables)

### 1. Events (`events`)

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                        -- e.g., "Nieuwjaars BBQ 2026"
  event_type TEXT NOT NULL,                  -- e.g., "bbq", "diner", "lunch", "borrel"
  event_date DATE,
  total_persons INT,                         -- can also be dynamically calculated
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Event Courses (`event_courses`)

```sql
CREATE TABLE event_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                        -- e.g., "Aperitief", "Hoofdgerecht"
  sort_order INT NOT NULL DEFAULT 0,
  grams_per_person INT NOT NULL,             -- edible grams per person for this course
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Typical values per course type:**

| Course | grams_per_person | Notes |
|--------|-----------------|-------|
| Aperitief | 80 | Snacks, nuts |
| Voorgerecht | 120 | Light portion |
| Hoofdgerecht | 450 | Proteins + sides |
| Dessert | 150 | Dessert |

### 3. Menu Items (`menu_items`)

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES event_courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                          -- e.g., "Picanha", "Ananas van de grill"

  -- Calculation type
  item_type TEXT NOT NULL CHECK (item_type IN (
    'protein',    -- distributed via meat_distribution preferences
    'side',       -- evenly split across side items in course
    'fixed'       -- own grams_per_person
  )),

  -- Category (for protein items: maps to meat_distribution keys)
  category TEXT CHECK (category IN (
    'pork', 'beef', 'chicken', 'game', 'fish', 'vegetarian',
    'fruit', 'vegetables', 'salad', 'bread', 'sauce', 'dairy', 'other'
  )),

  -- Purchase calculation
  yield_percentage NUMERIC(5,2) NOT NULL,      -- e.g., 85.00 (= 85% edible)
  waste_description TEXT,                       -- e.g., "Remove skin and core"
  unit_weight_grams INT,                       -- e.g., 150 (per burger), NULL if N/A
  unit_label TEXT,                              -- e.g., "stuk", "stokje", "fles"
  rounding_grams INT DEFAULT 100,              -- rounding value if no fixed unit

  -- Distribution
  distribution_percentage NUMERIC(5,2),        -- % within category (protein only)
  grams_per_person INT,                        -- override grams (fixed items only)

  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table Relationships

```
events
  +-- event_courses (1:N, CASCADE DELETE)
        +-- menu_items (1:N, CASCADE DELETE)

food_drink_preferences (existing)
  -> provides AVG meat_distribution per category
  -> input for protein item calculations
```

---

## Existing Code Patterns to Reuse

### Admin Authentication Pattern

```typescript
// From src/app/api/admin/predictions/route.ts
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

const adminUser = await getUserFromRequest(request);
if (!adminUser || !isAdmin(adminUser)) {
  return NextResponse.json(
    { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
    { status: 403 }
  );
}
```

### Admin Page Pattern

```tsx
// From existing admin pages
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { motion } from 'framer-motion';

export default function AdminPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <DashboardLayout>
        {/* Card-based layout with Framer Motion animations */}
      </DashboardLayout>
    </AuthGuard>
  );
}
```

### Supabase Client

```typescript
import { createServerClient } from '@/lib/supabase';
const supabase = createServerClient();
```

### Color System

```
deep-green: #1B4332 (background)
gold: #D4AF37 (accent, CTAs)
cream: #F5F5DC (text)
dark-wood: #2C1810 (cards)
warm-red: #8B0000 (errors)
success-green: #2D5A27 (success)
```

---

## Data Flow for Inkoopberekening

```
food_drink_preferences (existing)     events (new)
(participants + partners)             (event config)
     |                                     |
     v                                     v
AVG meat_distribution                event_courses
per category                         (courses + g/p.p.)
(self + partner combined)                  |
     |                                     v
     |                                menu_items
     |                                (dishes per course)
     |                                     |
     +----------------+-------------------+
                      |
                      v
             CALCULATION ENGINE
             (per course, per item)
                      |
                      v
             SHOPPING LIST (boodschappenlijst)
             grouped per course:
             - product, quantity, weight
             - subtotal per course
             - grand total
```

---

## LLM Integration (Optional)

### Use Case A: Menu Item Suggestions

When admin enters a new menu item name, the LLM suggests:

1. Yield percentage
2. Waste/loss description
3. Unit weight (if applicable)
4. Unit label
5. Recommended grams per person (for fixed items)

### Use Case B: Distribution Suggestions

When multiple protein items exist in the same category:

> "The main course contains 3 beef dishes: Picanha, Entrecote, Hamburger.
> Suggest a distribution."

### Existing Infrastructure

- Anthropic API key already configured (`ANTHROPIC_API_KEY`)
- Assignment endpoint exists at `/api/assignment` using Claude
- Can create similar endpoint for menu suggestions

---

## Worked Example: Nieuwjaars BBQ 2026

**Event:** Nieuwjaars BBQ 2026 (type: bbq)
**Persons:** 18 (15 participants + 3 partners)
**Average preferences:** Beef 45%, Chicken 28%, Fish 20%, Pork 5%, Wild 3%

### Main Course (450g p.p.)

```
Protein budget: 18 x 450g = 8,100g

BEEF (45% = 3,645g):
  Picanha   (50%): 1,823g / 0.85 yield = 2,144g -> 2,200g
  Hamburger (50%): 1,823g / 0.95 yield = 1,919g -> 13 stuks x 150g = 1,950g

CHICKEN (28% = 2,268g):
  Kipsate  (100%): 2,268g / 0.95 yield = 2,387g -> 80 stokjes x 30g = 2,400g

FISH (20% = 1,620g):
  Hele zalm(100%): 1,620g / 0.55 yield = 2,945g -> 3,000g

PORK (5% = 405g):
  Spareribs(100%): 405g / 0.60 yield = 675g -> 700g

Side:
  Courgette: 18 x 100g = 1,800g / 0.90 yield = 2,000g

Fixed:
  Stokbrood:  18 x 80g = 1,440g -> 6 stuks x 250g = 1,500g
  BBQ saus:   18 x 30g = 540g -> 2 flessen x 500ml
  Pindasaus:  18 x 40g = 720g -> 2 flessen x 500ml
```

---

## Technology & Compatibility

| Component | Version | Notes |
|-----------|---------|-------|
| Next.js | 14.2.0 | App Router required |
| React | 18.2.0 | Client components for CRUD |
| TypeScript | 5.3.3 | Strict mode |
| Supabase Client | 2.90.1 | PostgreSQL |
| Framer Motion | 12.26.2 | Animations |
| Tailwind CSS | 3.4.1 | Custom theme |
| Anthropic SDK | (existing) | Optional LLM integration |

No new external dependencies required for core functionality.

---

## Security Considerations

- All new endpoints admin-only (JWT + role check)
- CRUD operations on events/courses/items require admin role
- No participant-facing data exposure
- Calculation results are admin-only
- Shopping list export follows same patterns as existing Excel/PDF export

---

## Key Decisions for Architecture Phase

### Already Decided (from bbq_inkoop_berekening.md)

1. **Three item types:** protein, side, fixed
2. **Yield percentage:** per item, accounts for waste
3. **Category system:** maps to existing meat_distribution keys
4. **Partner inclusion:** partners count in averages and totals
5. **Event hierarchy:** event -> courses -> menu items (CASCADE DELETE)

### To Decide in Architecture

1. **Admin UI structure:** Single page vs multi-page (events list, event detail, course detail)
2. **Shopping list placement:** Separate page or section within event detail
3. **LLM integration:** MVP without LLM or include from start
4. **Persons count source:** Manual input on event vs auto-calculate from registrations
5. **CRUD API design:** RESTful routes vs single endpoint with actions
6. **State management:** Local state vs Zustand store for menu builder

---

## Self-Verification Checklist

- [x] v1 implementation fully documented
- [x] New database schema defined with all columns and constraints
- [x] Calculation formulas specified with worked examples
- [x] Existing code patterns identified for reuse
- [x] Data flow between existing and new systems documented
- [x] Security considerations addressed
- [x] Technology compatibility verified
- [x] LLM integration scope defined
- [x] Key architectural decisions identified
- [x] No new external dependencies for core functionality

---

**Document Version:** 2.0
**Prepared By:** PACT Preparer
**Date:** 2026-01-29
**Status:** Complete - Ready for Architecture Phase
