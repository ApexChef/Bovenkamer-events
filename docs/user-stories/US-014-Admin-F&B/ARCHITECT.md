# US-014: Admin Food & Beverage Rapport - ARCHITECTURE

**Status:** Architecture Complete
**Date:** 2026-01-28
**Architect:** PACT Architect
**Related Documents:**
- User Story: `docs/user-stories/US-014-Admin-F&B/README.md`
- Preparation Research: `docs/user-stories/US-014-Admin-F&B/PREPARE.md`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Component Specifications](#component-specifications)
4. [Data Architecture](#data-architecture)
5. [API Design](#api-design)
6. [Export Functionality](#export-functionality)
7. [Calculation Logic](#calculation-logic)
8. [Security Architecture](#security-architecture)
9. [Performance Considerations](#performance-considerations)
10. [File Structure](#file-structure)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Risk Analysis](#risk-analysis)

---

## Executive Summary

### Architecture Goals

This architecture defines a comprehensive F&B (Food & Beverage) reporting system for administrators to generate shopping lists based on participant preferences. The system aggregates data from the `food_drink_preferences` table and provides multiple export formats (web view, PDF, Excel/CSV).

**Key Architectural Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Data Aggregation** | Client-side | Suitable for current scale (<200 persons), simpler implementation |
| **PDF Export** | Browser native print | Zero dependencies, excellent CSS support, no bundle impact |
| **Excel/CSV Export** | SheetJS/XLSX library | Industry standard, supports both formats, good TypeScript support |
| **Refresh Strategy** | Manual with timestamp | Simpler than real-time, meets acceptance criteria |
| **Calculation Location** | React component with useMemo | Optimizes re-renders, keeps logic maintainable |

### Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS with custom theme
- **Animations:** Framer Motion
- **Database:** Supabase (PostgreSQL)
- **Export Library:** xlsx (SheetJS) - ~100KB gzipped
- **Authentication:** Existing JWT-based admin auth

### Constraints

**Technical:**
- Must work with existing `food_drink_preferences` schema
- Admin-only access required
- Print CSS cannot style browser print dialog
- Must handle partners counted separately from participants

**Business:**
- Standard portion sizes are fixed (defined in user story)
- Dietary requirements must be prominently displayed
- Partners count as separate persons in totals

**Quality Attributes:**
- Performance: Report generation < 2 seconds for 200 persons
- Usability: Print-friendly layout with proper page breaks
- Maintainability: Calculation constants easily configurable
- Security: Admin-only access, no data exposure to participants

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin F&B Report Page                   │
│                  /admin/fb-rapport (Client)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1. GET /api/admin/fb-report
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route (Server)                       │
│              /api/admin/fb-report/route.ts                  │
│                                                              │
│  • Authenticate admin                                       │
│  • Query Supabase                                           │
│  • Return raw preference data                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 2. Query database
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│                                                              │
│  • food_drink_preferences (self + partner)                 │
│  • users (names, email, role)                              │
│  • registrations (partner names, has_partner)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Return data
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Client-Side Aggregation                       │
│                                                              │
│  • Calculate meat/drink statistics                          │
│  • Group dietary requirements                               │
│  • Compute bottle/crate counts                              │
│  • Build person detail list                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 4. Render UI
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Report Display                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Header: Stats + Export Buttons                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Dietary Requirements (Prominent)                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Meat & Fish Breakdown                                │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Drinks Breakdown (Wine, Beer, Soft, Bubbles)        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Sides (Veggies, Sauces)                              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Detail per Person (Collapsible)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    │                    │
        5a. Print   │                    │ 5b. Export
                    ▼                    ▼
          ┌──────────────┐      ┌──────────────┐
          │ Browser Print│      │ XLSX Export  │
          │   (to PDF)   │      │  (download)  │
          └──────────────┘      └──────────────┘
```

### Component Architecture

```
src/app/admin/fb-rapport/
├── page.tsx                          [Client Component - Main Page]
│   ├── AuthGuard (requireAdmin)
│   └── FBReportContent
│       ├── ReportHeader              [Summary stats, refresh, export buttons]
│       ├── DietarySection            [Allergies, vegetarian, other]
│       ├── MeatSection               [Meat/fish breakdown]
│       ├── DrinksSection             [Wine, beer, soft drinks, bubbles]
│       ├── SidesSection              [Veggies, sauces]
│       └── PersonDetailSection       [Collapsible detail list]
│
src/app/api/admin/fb-report/
└── route.ts                          [Server API - GET handler]
    ├── Admin authentication
    ├── Database queries
    └── Return aggregated data
│
src/lib/fb-calculations.ts            [Calculation utilities]
├── calculateMeatStats()
├── calculateDrinkStats()
├── groupDietaryRequirements()
├── formatBottleCount()
└── Constants (portion sizes, container sizes)
│
src/components/fb-report/             [Reusable report components]
├── DietaryWarnings.tsx               [Dietary requirements display]
├── MeatBreakdown.tsx                 [Meat distribution chart]
├── DrinkBreakdown.tsx                [Drinks distribution]
├── PersonDetail.tsx                  [Individual person card]
└── ProgressBar.tsx                   [Visual percentage bar]
```

---

## Component Specifications

### 1. Page Component: `/admin/fb-rapport/page.tsx`

**Responsibility:** Main page orchestration, data fetching, state management

**Type:** Client Component (`'use client'`)

**State Management:**
```typescript
interface PageState {
  reportData: FBReportData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  generatedAt: Date;
  error: string | null;
}
```

**Key Functions:**
- `fetchReportData()` - Calls API, processes response
- `handleRefresh()` - Refetches data, updates timestamp
- `handlePrint()` - Triggers browser print dialog
- `handleExportExcel()` - Generates XLSX file
- `handleExportCSV()` - Generates CSV file

**Lifecycle:**
1. Mount: Fetch initial data
2. Display: Render report sections
3. User actions: Refresh, export
4. Unmount: Cleanup

**Props:** None (route component)

**Dependencies:**
- `@/components/ui` - Card, Button, etc.
- `@/components/fb-report/*` - Report sections
- `@/lib/fb-calculations` - Calculation utilities
- `framer-motion` - Animations
- `xlsx` - Export functionality

---

### 2. API Route: `/api/admin/fb-report/route.ts`

**Responsibility:** Fetch and aggregate raw preference data from database

**HTTP Method:** GET

**Authentication:** Admin role required (via `getUserFromRequest()` and `isAdmin()`)

**Query Strategy:**
```typescript
// Query 1: All user preferences (self)
const userPrefs = await supabase
  .from('food_drink_preferences')
  .select(`
    *,
    users!inner (id, first_name, last_name, name, email)
  `)
  .eq('person_type', 'self')
  .order('users.name');

// Query 2: All partner preferences
const partnerPrefs = await supabase
  .from('food_drink_preferences')
  .select('*')
  .eq('person_type', 'partner');

// Query 3: Registration data for partner names
const registrations = await supabase
  .from('registrations')
  .select('user_id, has_partner, partner_first_name, partner_last_name')
  .eq('has_partner', true);

// Merge partner preferences with partner names
const enrichedPartnerPrefs = partnerPrefs.map(pref => {
  const reg = registrations.find(r => r.user_id === pref.user_id);
  return {
    ...pref,
    name: reg ? `${reg.partner_first_name} ${reg.partner_last_name}`.trim() : 'Partner'
  };
});
```

**Response Format:**
```typescript
{
  timestamp: string; // ISO 8601
  completionStatus: {
    completed: number;      // Users with preferences
    totalParticipants: number;
    totalPersons: number;   // Includes partners
  };
  persons: PersonPreference[];  // Combined self + partner
}
```

**Error Handling:**
- 403: Unauthorized (not admin)
- 500: Database error
- 500: Server error

---

### 3. Calculation Library: `/lib/fb-calculations.ts`

**Responsibility:** Pure calculation functions for aggregating preferences

#### Constants

```typescript
export const PORTION_SIZES = {
  meat: 200,        // grams per person
  wine: 2,          // glasses per person
  beer: 2,          // bottles per person
  softDrink: 2,     // glasses per person
  bubbles: 1,       // glass per person
} as const;

export const CONTAINER_SIZES = {
  wineBottle: 750,         // ml
  wineGlassesPerBottle: 6, // glasses per 750ml bottle
  beerCrate: 24,           // bottles per crate
  champagneBottle: 750,    // ml
  champagneGlassesPerBottle: 6,
  proseccoBottle: 750,     // ml
  proseccoGlassesPerBottle: 6,
} as const;

export const MEAT_CATEGORIES = [
  'pork',
  'beef',
  'chicken',
  'game',
  'fish',
  'vegetarian',
] as const;

export const DRINK_CATEGORIES = [
  'wine',
  'beer',
  'softDrinks',
] as const;
```

#### Core Functions

**1. calculateMeatStats(persons: PersonPreference[]): MeatStats**

```typescript
interface MeatStats {
  totalPersons: number;
  totalKg: number;
  categories: {
    [key in MeatCategory]: {
      weightedCount: number;  // Persons weighted by percentage
      percentage: number;     // Overall percentage
      kg: number;             // Estimated kilograms
    };
  };
}

/**
 * Algorithm:
 * 1. For each person, multiply their meat_distribution percentages
 * 2. Sum weighted counts across all persons
 * 3. Calculate overall percentages
 * 4. Convert to kg using PORTION_SIZES.meat
 */
export function calculateMeatStats(persons: PersonPreference[]): MeatStats {
  const totalPersons = persons.length;
  const stats = initializeMeatStats();

  // Calculate weighted counts
  persons.forEach(person => {
    Object.entries(person.meatDistribution).forEach(([category, pct]) => {
      stats.categories[category].weightedCount += pct / 100;
    });
  });

  // Calculate percentages and kg
  Object.keys(stats.categories).forEach(category => {
    const weighted = stats.categories[category].weightedCount;
    stats.categories[category].percentage = (weighted / totalPersons) * 100;
    stats.categories[category].kg = (weighted * PORTION_SIZES.meat) / 1000;
  });

  stats.totalKg = Object.values(stats.categories)
    .reduce((sum, cat) => sum + cat.kg, 0);

  return stats;
}
```

**2. calculateDrinkStats(persons: PersonPreference[]): DrinkStats**

```typescript
interface DrinkStats {
  wine: {
    totalDrinkers: number;
    bottles: number;
    red: { bottles: number; percentage: number };
    white: { bottles: number; percentage: number };
  };
  beer: {
    totalDrinkers: number;
    bottles: number;
    crates: number;
    pils: { count: number; percentage: number };
    speciaal: { count: number; percentage: number };
  };
  softDrinks: {
    totalDrinkers: number;
    breakdown: { [type: string]: number };
  };
  water: {
    sparkling: number;
    flat: number;
  };
  bubbles: {
    total: number;
    champagne: { count: number; bottles: number };
    prosecco: { count: number; bottles: number };
  };
}

/**
 * Wine Calculation Algorithm:
 * 1. Filter persons where drinkDistribution.wine > 10
 * 2. Sum weighted wine drinkers (percentage / 100)
 * 3. Calculate bottles: (totalDrinkers * 2 glasses) / 6 glasses per bottle
 * 4. Split red/white based on wine_preference slider
 *    - wine_preference 0 = 100% red
 *    - wine_preference 50 = 50% red, 50% white
 *    - wine_preference 100 = 100% white
 */
export function calculateDrinkStats(persons: PersonPreference[]): DrinkStats {
  // ... implementation details
}
```

**3. groupDietaryRequirements(persons: PersonPreference[]): DietaryGroups**

```typescript
interface DietaryGroups {
  allergies: Array<{ name: string; details: string; isPartner: boolean }>;
  vegetarian: Array<{ name: string; isPartner: boolean }>;
  vegan: Array<{ name: string; isPartner: boolean }>;
  other: Array<{ name: string; details: string; isPartner: boolean }>;
}

/**
 * Categorization Logic:
 * 1. Check dietary_requirements field
 * 2. Classify based on keywords (case-insensitive):
 *    - allergies: "allergi", "intolerant", "allergie"
 *    - vegan: "vegan"
 *    - vegetarian: "vegetar"
 *    - other: everything else
 */
export function groupDietaryRequirements(persons: PersonPreference[]): DietaryGroups {
  // ... implementation details
}
```

**4. formatPersonForExport(person: PersonPreference): ExportRow**

Converts person data to flat structure for Excel/CSV export.

---

### 4. Report Section Components

#### DietaryWarnings.tsx

**Purpose:** Display dietary requirements prominently

**Props:**
```typescript
interface DietaryWarningsProps {
  groups: DietaryGroups;
}
```

**Styling:**
- Prominent red/orange border for allergies
- Yellow/orange for vegetarian/vegan
- Cream/gold for other requirements
- Clear typography with emojis

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  ⚠️ DIEETWENSEN & ALLERGIEËN                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🚫 ALLERGIEËN (border-warm-red)                    │
│  • Name: Details                                    │
│  • Name (partner): Details                          │
│                                                      │
│  🥗 VEGETARISCH/VEGANISTISCH (border-yellow)        │
│  • Name: Vegetariër                                 │
│  • Name: Veganist                                   │
│                                                      │
│  📝 OVERIGE OPMERKINGEN                             │
│  • Name: Details                                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Print Considerations:**
- `page-break-inside: avoid` to keep section together
- High contrast colors for print
- Clear visual hierarchy

---

#### MeatBreakdown.tsx

**Purpose:** Display meat/fish distribution with visual bars

**Props:**
```typescript
interface MeatBreakdownProps {
  stats: MeatStats;
}
```

**Visual Elements:**
- Horizontal progress bars for each category
- Percentage, person count, kg estimate
- Color-coded bars (gold accent)
- Responsive grid layout

---

#### DrinkBreakdown.tsx

**Purpose:** Display comprehensive drink statistics

**Props:**
```typescript
interface DrinkBreakdownProps {
  stats: DrinkStats;
}
```

**Sections:**
1. Wine (red/white split, bottle count)
2. Beer (pils/speciaal, crate count)
3. Soft Drinks (type breakdown)
4. Water (sparkling/flat)
5. Bubbles/Aperitif (champagne/prosecco)

---

#### PersonDetail.tsx

**Purpose:** Show individual person's preferences

**Props:**
```typescript
interface PersonDetailProps {
  person: PersonPreference;
  isPartner?: boolean;
}
```

**Display Format:**
```
Name [+ partner badge if applicable]
├─ Dieet: Details (if any)
├─ Vlees: 30% rund, 25% kip, 20% varken, 15% vis, 10% vega
├─ Drank: 50% wijn (70% rood), 30% bier (pils), 20% fris
├─ Bubbel: Ja, champagne
└─ Groenten: 4/5, Sauzen: 3/5
```

**Grouping:**
When participant has partner, group them together with indentation.

---

## Data Architecture

### Database Schema

**Tables Used:**

```sql
-- Primary table for F&B preferences
food_drink_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  person_type TEXT CHECK (person_type IN ('self', 'partner')),

  -- Food
  dietary_requirements TEXT,
  meat_distribution JSONB,  -- {pork, beef, chicken, game, fish, vegetarian}
  veggies_preference INT CHECK (0-5),
  sauces_preference INT CHECK (0-5),

  -- Drinks
  starts_with_bubbles BOOLEAN,
  bubble_type TEXT CHECK (bubble_type IN ('champagne', 'prosecco', NULL)),
  drink_distribution JSONB,  -- {softDrinks, wine, beer}
  soft_drink_preference TEXT,
  soft_drink_other TEXT,
  water_preference TEXT CHECK (water_preference IN ('sparkling', 'flat', NULL)),
  wine_preference INT CHECK (0-100),  -- 0=red, 100=white
  beer_type TEXT CHECK (beer_type IN ('pils', 'speciaal', NULL)),

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  UNIQUE(user_id, person_type)
)

-- User data
users (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  name TEXT,  -- Computed: first_name + last_name
  email TEXT,
  role TEXT,
  is_active BOOLEAN
)

-- Registration data for partner info
registrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  has_partner BOOLEAN,
  partner_first_name TEXT,
  partner_last_name TEXT
)
```

### TypeScript Interfaces

**Location:** Add to `src/types/index.ts`

```typescript
// Person preference (normalized from DB)
export interface PersonPreference {
  name: string;
  personType: 'self' | 'partner';
  userId: string;  // For grouping with partner

  // Food
  dietaryRequirements: string | null;
  meatDistribution: MeatDistribution;
  veggiesPreference: number;  // 0-5
  saucesPreference: number;   // 0-5

  // Drinks
  startsWithBubbles: boolean | null;
  bubbleType: 'champagne' | 'prosecco' | null;
  drinkDistribution: DrinkDistribution;
  softDrinkPreference: string | null;
  softDrinkOther: string;
  waterPreference: 'sparkling' | 'flat' | null;
  winePreference: number | null;  // 0-100
  beerType: 'pils' | 'speciaal' | null;
}

// Report data structure
export interface FBReportData {
  timestamp: string;
  completionStatus: {
    completed: number;
    totalParticipants: number;
    totalPersons: number;
  };
  persons: PersonPreference[];
}

// Meat statistics
export type MeatCategory = 'pork' | 'beef' | 'chicken' | 'game' | 'fish' | 'vegetarian';

export interface MeatCategoryStat {
  weightedCount: number;
  percentage: number;
  kg: number;
}

export interface MeatStats {
  totalPersons: number;
  totalKg: number;
  categories: Record<MeatCategory, MeatCategoryStat>;
}

// Drink statistics
export interface WineStats {
  totalDrinkers: number;
  bottles: number;
  red: { bottles: number; percentage: number };
  white: { bottles: number; percentage: number };
}

export interface BeerStats {
  totalDrinkers: number;
  bottles: number;
  crates: number;
  pils: { count: number; percentage: number };
  speciaal: { count: number; percentage: number };
}

export interface SoftDrinkStats {
  totalDrinkers: number;
  breakdown: Record<string, number>;  // {cola: 5, sinas: 3, ...}
}

export interface WaterStats {
  sparkling: number;
  flat: number;
}

export interface BubblesStats {
  total: number;
  champagne: { count: number; bottles: number };
  prosecco: { count: number; bottles: number };
}

export interface DrinkStats {
  wine: WineStats;
  beer: BeerStats;
  softDrinks: SoftDrinkStats;
  water: WaterStats;
  bubbles: BubblesStats;
}

// Dietary grouping
export interface DietaryPerson {
  name: string;
  details?: string;
  isPartner: boolean;
}

export interface DietaryGroups {
  allergies: Array<DietaryPerson & { details: string }>;
  vegetarian: DietaryPerson[];
  vegan: DietaryPerson[];
  other: Array<DietaryPerson & { details: string }>;
}

// Excel export row
export interface FBExportRow {
  Naam: string;
  Type: 'Deelnemer' | 'Partner';
  Dieet: string;
  'Varkensvlees %': number;
  'Rundvlees %': number;
  'Kip %': number;
  'Wild %': number;
  'Vis %': number;
  'Vegetarisch %': number;
  'Groenten (1-5)': number;
  'Sauzen (1-5)': number;
  'Start met bubbels': string;
  'Bubbel type': string;
  'Frisdrank %': number;
  'Wijn %': number;
  'Bier %': number;
  'Wijn voorkeur': string;
  'Bier type': string;
  'Frisdrank keuze': string;
  'Water voorkeur': string;
}
```

### Data Flow Diagram

```
[Supabase DB]
     │
     │ GET /api/admin/fb-report
     ▼
[API Route]
     │ Raw preference data
     │ + user names
     │ + partner names
     ▼
[Page Component State]
     │
     ├─────────────────┬─────────────────┬──────────────────┐
     │                 │                 │                  │
     ▼                 ▼                 ▼                  ▼
[useMemo]        [useMemo]         [useMemo]          [useMemo]
meatStats        drinkStats        dietaryGroups      avgSides
     │                 │                 │                  │
     └─────────────────┴─────────────────┴──────────────────┘
                              │
                              ▼
                     [Report Sections]
                              │
                ┌─────────────┴──────────────┐
                │                            │
                ▼                            ▼
          [Print CSS]                  [XLSX Export]
                │                            │
                ▼                            ▼
          [PDF via browser]           [Download .xlsx]
```

---

## API Design

### Endpoint: `GET /api/admin/fb-report`

**Route File:** `src/app/api/admin/fb-report/route.ts`

**Authentication:** Admin role required

**Request:**
```
GET /api/admin/fb-report HTTP/1.1
Host: bovenkamer-events.com
Cookie: auth-token=<jwt-token>
```

**Success Response (200):**
```typescript
{
  timestamp: "2026-01-28T14:30:00.000Z",
  completionStatus: {
    completed: 24,          // Users who filled preferences
    totalParticipants: 28,  // Total active participants
    totalPersons: 32        // Participants + partners
  },
  persons: [
    {
      name: "Jan Jansen",
      personType: "self",
      userId: "uuid-123",
      dietaryRequirements: "Notenallergie",
      meatDistribution: {
        pork: 20,
        beef: 30,
        chicken: 25,
        game: 5,
        fish: 15,
        vegetarian: 5
      },
      veggiesPreference: 4,
      saucesPreference: 3,
      startsWithBubbles: true,
      bubbleType: "champagne",
      drinkDistribution: {
        softDrinks: 20,
        wine: 50,
        beer: 30
      },
      softDrinkPreference: "cola",
      softDrinkOther: "",
      waterPreference: "sparkling",
      winePreference: 30,  // 70% red, 30% white
      beerType: "pils"
    },
    // ... more persons
  ]
}
```

**Error Responses:**

```typescript
// 403 Forbidden
{
  error: "UNAUTHORIZED",
  message: "Admin toegang vereist"
}

// 500 Database Error
{
  error: "DATABASE_ERROR",
  message: "Kon data niet ophalen"
}

// 500 Server Error
{
  error: "SERVER_ERROR",
  message: "Er ging iets mis"
}
```

**Implementation Pattern:**

```typescript
// src/app/api/admin/fb-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || !isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // 2. Query user preferences
    const { data: userPrefs, error: userError } = await supabase
      .from('food_drink_preferences')
      .select(`
        *,
        users!inner (
          id,
          first_name,
          last_name,
          name,
          email
        )
      `)
      .eq('person_type', 'self')
      .order('users.name');

    if (userError) throw userError;

    // 3. Query partner preferences
    const { data: partnerPrefs, error: partnerError } = await supabase
      .from('food_drink_preferences')
      .select('*')
      .eq('person_type', 'partner');

    if (partnerError) throw partnerError;

    // 4. Query registrations for partner names
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('user_id, has_partner, partner_first_name, partner_last_name')
      .eq('has_partner', true);

    if (regError) throw regError;

    // 5. Enrich partner data with names
    const enrichedPartnerPrefs = partnerPrefs.map(pref => ({
      ...pref,
      name: (() => {
        const reg = registrations.find(r => r.user_id === pref.user_id);
        return reg
          ? `${reg.partner_first_name} ${reg.partner_last_name}`.trim()
          : 'Partner';
      })(),
      personType: 'partner' as const,
    }));

    // 6. Combine and normalize
    const persons = [
      ...userPrefs.map(pref => ({
        name: pref.users.name,
        personType: 'self' as const,
        userId: pref.user_id,
        dietaryRequirements: pref.dietary_requirements,
        meatDistribution: pref.meat_distribution,
        veggiesPreference: pref.veggies_preference,
        saucesPreference: pref.sauces_preference,
        startsWithBubbles: pref.starts_with_bubbles,
        bubbleType: pref.bubble_type,
        drinkDistribution: pref.drink_distribution,
        softDrinkPreference: pref.soft_drink_preference,
        softDrinkOther: pref.soft_drink_other || '',
        waterPreference: pref.water_preference,
        winePreference: pref.wine_preference,
        beerType: pref.beer_type,
      })),
      ...enrichedPartnerPrefs.map(pref => ({
        name: pref.name,
        personType: 'partner' as const,
        userId: pref.user_id,
        dietaryRequirements: pref.dietary_requirements,
        meatDistribution: pref.meat_distribution,
        veggiesPreference: pref.veggies_preference,
        saucesPreference: pref.sauces_preference,
        startsWithBubbles: pref.starts_with_bubbles,
        bubbleType: pref.bubble_type,
        drinkDistribution: pref.drink_distribution,
        softDrinkPreference: pref.soft_drink_preference,
        softDrinkOther: pref.soft_drink_other || '',
        waterPreference: pref.water_preference,
        winePreference: pref.wine_preference,
        beerType: pref.beer_type,
      })),
    ];

    // 7. Calculate completion status
    const { count: totalParticipants } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'participant')
      .eq('is_active', true);

    // 8. Return response
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      completionStatus: {
        completed: userPrefs.length,
        totalParticipants: totalParticipants || 0,
        totalPersons: persons.length,
      },
      persons,
    });

  } catch (error) {
    console.error('FB Report API error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
```

---

## Export Functionality

### 1. PDF Export (Browser Print)

**Approach:** Use browser's native print dialog with CSS media queries

**Implementation:**

```typescript
// In page component
const handlePrint = () => {
  window.print();
};
```

**CSS Media Queries:**

```css
/* Add to global CSS or component styles */
@media print {
  /* Hide non-printable elements */
  .no-print {
    display: none !important;
  }

  /* Page setup */
  @page {
    size: A4;
    margin: 2cm;
  }

  /* Preserve colors */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Avoid page breaks inside sections */
  .avoid-break {
    page-break-inside: avoid;
  }

  /* Force page break before element */
  .page-break-before {
    page-break-before: always;
  }

  /* Typography adjustments */
  body {
    font-size: 10pt;
  }

  h1 {
    font-size: 18pt;
  }

  h2 {
    font-size: 14pt;
  }

  /* Hide interactive elements */
  button, .export-buttons {
    display: none !important;
  }

  /* Expand collapsed sections */
  .collapsible-content {
    display: block !important;
    max-height: none !important;
  }

  /* Ensure tables don't overflow */
  table {
    width: 100%;
    font-size: 9pt;
  }

  /* Progress bars - show as solid */
  .progress-bar {
    border: 1px solid #000;
  }
}
```

**Tailwind Print Utilities:**

```tsx
<Button
  onClick={handlePrint}
  className="print:hidden"
>
  Print PDF
</Button>

<div className="print:block hidden">
  Only visible when printing
</div>

<section className="print:page-break-inside-avoid">
  Keep this section together
</section>
```

**Pros:**
- Zero dependencies
- Excellent CSS support
- Users control PDF settings (orientation, margins)
- No bundle size impact

**Cons:**
- Cannot programmatically set filename
- Print dialog appearance not customizable
- Requires user to select "Save as PDF"

---

### 2. Excel Export (XLSX)

**Library:** xlsx (SheetJS) v0.20.2+

**Installation:**
```bash
npm install xlsx
```

**Implementation:**

```typescript
// src/app/admin/fb-rapport/page.tsx
import * as XLSX from 'xlsx';

const handleExportExcel = () => {
  // 1. Transform data to flat rows
  const exportData: FBExportRow[] = reportData.persons.map(person => ({
    'Naam': person.name,
    'Type': person.personType === 'self' ? 'Deelnemer' : 'Partner',
    'Dieet': person.dietaryRequirements || '-',
    'Varkensvlees %': person.meatDistribution.pork,
    'Rundvlees %': person.meatDistribution.beef,
    'Kip %': person.meatDistribution.chicken,
    'Wild %': person.meatDistribution.game,
    'Vis %': person.meatDistribution.fish,
    'Vegetarisch %': person.meatDistribution.vegetarian,
    'Groenten (1-5)': person.veggiesPreference,
    'Sauzen (1-5)': person.saucesPreference,
    'Start met bubbels': person.startsWithBubbles ? 'Ja' : 'Nee',
    'Bubbel type': person.bubbleType || '-',
    'Frisdrank %': person.drinkDistribution.softDrinks,
    'Wijn %': person.drinkDistribution.wine,
    'Bier %': person.drinkDistribution.beer,
    'Wijn voorkeur': formatWinePreference(person.winePreference),
    'Bier type': person.beerType || '-',
    'Frisdrank keuze': person.softDrinkPreference || '-',
    'Water voorkeur': person.waterPreference === 'sparkling' ? 'Bruisend' :
                      person.waterPreference === 'flat' ? 'Plat' : '-',
  }));

  // 2. Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // 3. Set column widths (optional)
  const columnWidths = [
    { wch: 20 },  // Naam
    { wch: 12 },  // Type
    { wch: 30 },  // Dieet
    { wch: 12 },  // Varkensvlees %
    // ... etc
  ];
  ws['!cols'] = columnWidths;

  // 4. Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'F&B Voorkeuren');

  // 5. Add summary sheet (optional)
  const summaryData = [
    { Categorie: 'Totaal Personen', Waarde: reportData.completionStatus.totalPersons },
    { Categorie: 'Deelnemers', Waarde: reportData.completionStatus.totalParticipants },
    { Categorie: 'Partners', Waarde: reportData.completionStatus.totalPersons - reportData.completionStatus.totalParticipants },
    { Categorie: 'Voorkeuren Ingevuld', Waarde: reportData.completionStatus.completed },
    { Categorie: '', Waarde: '' },
    { Categorie: 'Totaal Vlees (kg)', Waarde: meatStats.totalKg.toFixed(2) },
    { Categorie: 'Wijn Flessen', Waarde: drinkStats.wine.bottles },
    { Categorie: 'Bier Kratten', Waarde: drinkStats.beer.crates },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Samenvatting');

  // 6. Generate filename with date
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `fb-rapport-${dateStr}.xlsx`;

  // 7. Trigger download
  XLSX.writeFile(wb, filename);
};

// Helper function
function formatWinePreference(pref: number | null): string {
  if (pref === null) return '-';
  const redPct = 100 - pref;
  const whitePct = pref;
  return `${redPct}% rood / ${whitePct}% wit`;
}
```

**Features:**
- Multiple sheets (Details + Summary)
- Auto-sized columns
- Date-stamped filename
- Dutch column headers
- Human-readable values

---

### 3. CSV Export

**Implementation:**

```typescript
const handleExportCSV = () => {
  // 1. Transform to flat rows (same as Excel)
  const exportData: FBExportRow[] = reportData.persons.map(/* ... */);

  // 2. Create worksheet from JSON
  const ws = XLSX.utils.json_to_sheet(exportData);

  // 3. Convert to CSV string
  const csv = XLSX.utils.sheet_to_csv(ws);

  // 4. Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `fb-rapport-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
```

**CSV Features:**
- UTF-8 encoding (Dutch characters supported)
- Same data structure as Excel
- Smaller file size
- Opens in Excel, Google Sheets, Numbers

---

## Calculation Logic

### Meat Distribution Calculation

**Input:** Array of PersonPreference objects

**Algorithm:**

```typescript
function calculateMeatStats(persons: PersonPreference[]): MeatStats {
  const totalPersons = persons.length;

  // Initialize stats object
  const stats: MeatStats = {
    totalPersons,
    totalKg: 0,
    categories: {
      pork: { weightedCount: 0, percentage: 0, kg: 0 },
      beef: { weightedCount: 0, percentage: 0, kg: 0 },
      chicken: { weightedCount: 0, percentage: 0, kg: 0 },
      game: { weightedCount: 0, percentage: 0, kg: 0 },
      fish: { weightedCount: 0, percentage: 0, kg: 0 },
      vegetarian: { weightedCount: 0, percentage: 0, kg: 0 },
    },
  };

  // Step 1: Calculate weighted counts
  // Each person contributes fractionally based on their percentages
  persons.forEach(person => {
    const dist = person.meatDistribution;
    stats.categories.pork.weightedCount += dist.pork / 100;
    stats.categories.beef.weightedCount += dist.beef / 100;
    stats.categories.chicken.weightedCount += dist.chicken / 100;
    stats.categories.game.weightedCount += dist.game / 100;
    stats.categories.fish.weightedCount += dist.fish / 100;
    stats.categories.vegetarian.weightedCount += dist.vegetarian / 100;
  });

  // Step 2: Calculate overall percentages and kg
  Object.keys(stats.categories).forEach(category => {
    const cat = stats.categories[category as MeatCategory];

    // Percentage of total
    cat.percentage = (cat.weightedCount / totalPersons) * 100;

    // Kilograms: weighted count * portion size (200g) / 1000
    cat.kg = (cat.weightedCount * PORTION_SIZES.meat) / 1000;
  });

  // Step 3: Calculate total kg
  stats.totalKg = Object.values(stats.categories)
    .reduce((sum, cat) => sum + cat.kg, 0);

  return stats;
}
```

**Example:**

Given 3 persons:
- Person A: 50% beef, 50% chicken
- Person B: 100% vegetarian
- Person C: 40% pork, 30% beef, 30% fish

Calculation:
```
Beef weighted count = 0.5 + 0 + 0.3 = 0.8 persons
Beef percentage = (0.8 / 3) * 100 = 26.67%
Beef kg = (0.8 * 200g) / 1000 = 0.16 kg
```

---

### Wine Calculation

**Algorithm:**

```typescript
function calculateWineStats(persons: PersonPreference[]): WineStats {
  // Step 1: Filter wine drinkers (>10% preference)
  const wineDrinkers = persons.filter(p => p.drinkDistribution.wine > 10);

  // Step 2: Calculate weighted total wine drinkers
  const totalWineDrinkers = wineDrinkers.reduce((sum, p) => {
    return sum + (p.drinkDistribution.wine / 100);
  }, 0);

  // Step 3: Calculate total glasses needed
  const totalGlasses = totalWineDrinkers * PORTION_SIZES.wine; // 2 glasses per person

  // Step 4: Calculate bottles
  const totalBottles = Math.ceil(totalGlasses / CONTAINER_SIZES.wineGlassesPerBottle);

  // Step 5: Calculate red/white split
  let redWeight = 0;
  let whiteWeight = 0;

  wineDrinkers.forEach(p => {
    const wineWeight = p.drinkDistribution.wine / 100;

    if (p.winePreference === null) {
      // Default to 50/50 if no preference
      redWeight += wineWeight * 0.5;
      whiteWeight += wineWeight * 0.5;
    } else {
      // wine_preference: 0 = 100% red, 100 = 100% white
      const whitePct = p.winePreference / 100;
      const redPct = 1 - whitePct;

      redWeight += wineWeight * redPct;
      whiteWeight += wineWeight * whitePct;
    }
  });

  // Step 6: Calculate bottle split
  const totalWeight = redWeight + whiteWeight;
  const redPercentage = totalWeight > 0 ? (redWeight / totalWeight) * 100 : 50;
  const whitePercentage = 100 - redPercentage;

  const redBottles = Math.ceil(totalBottles * (redPercentage / 100));
  const whiteBottles = totalBottles - redBottles;

  return {
    totalDrinkers: totalWineDrinkers,
    bottles: totalBottles,
    red: {
      bottles: redBottles,
      percentage: redPercentage,
    },
    white: {
      bottles: whiteBottles,
      percentage: whitePercentage,
    },
  };
}
```

**Example:**

Given 4 persons:
- Person A: 60% wine, wine_preference = 0 (100% red)
- Person B: 40% wine, wine_preference = 100 (100% white)
- Person C: 80% wine, wine_preference = 50 (50/50)
- Person D: 5% wine (excluded, below 10% threshold)

Calculation:
```
Total wine drinkers = 0.6 + 0.4 + 0.8 = 1.8
Total glasses = 1.8 * 2 = 3.6 glasses
Total bottles = ceil(3.6 / 6) = 1 bottle

Red weight = (0.6 * 1.0) + (0.4 * 0.0) + (0.8 * 0.5) = 1.0
White weight = (0.6 * 0.0) + (0.4 * 1.0) + (0.8 * 0.5) = 0.8
Red percentage = (1.0 / 1.8) * 100 = 55.56%
White percentage = 44.44%

Red bottles = ceil(1 * 0.5556) = 1
White bottles = 0
```

---

### Beer Calculation

**Algorithm:**

```typescript
function calculateBeerStats(persons: PersonPreference[]): BeerStats {
  // Step 1: Filter beer drinkers
  const beerDrinkers = persons.filter(p => p.drinkDistribution.beer > 0);

  // Step 2: Calculate weighted total
  const totalBeerDrinkers = beerDrinkers.reduce((sum, p) => {
    return sum + (p.drinkDistribution.beer / 100);
  }, 0);

  // Step 3: Calculate bottles and crates
  const totalBottles = Math.ceil(totalBeerDrinkers * PORTION_SIZES.beer);
  const crates = Math.ceil(totalBottles / CONTAINER_SIZES.beerCrate);

  // Step 4: Calculate pils/speciaal split
  const pilsCount = beerDrinkers.filter(p => p.beerType === 'pils').length;
  const speciaalCount = beerDrinkers.filter(p => p.beerType === 'speciaal').length;
  const total = pilsCount + speciaalCount;

  const pilsPercentage = total > 0 ? (pilsCount / total) * 100 : 50;
  const speciaalPercentage = 100 - pilsPercentage;

  return {
    totalDrinkers: totalBeerDrinkers,
    bottles: totalBottles,
    crates,
    pils: {
      count: pilsCount,
      percentage: pilsPercentage,
    },
    speciaal: {
      count: speciaalCount,
      percentage: speciaalPercentage,
    },
  };
}
```

---

### Dietary Requirements Grouping

**Algorithm:**

```typescript
function groupDietaryRequirements(persons: PersonPreference[]): DietaryGroups {
  const groups: DietaryGroups = {
    allergies: [],
    vegetarian: [],
    vegan: [],
    other: [],
  };

  persons.forEach(person => {
    // Skip if no dietary requirements
    if (!person.dietaryRequirements || person.dietaryRequirements.trim() === '') {
      return;
    }

    const lower = person.dietaryRequirements.toLowerCase();
    const dietaryPerson: DietaryPerson = {
      name: person.name,
      isPartner: person.personType === 'partner',
    };

    // Classify based on keywords
    if (lower.includes('allergi') || lower.includes('intolerant')) {
      groups.allergies.push({
        ...dietaryPerson,
        details: person.dietaryRequirements,
      });
    } else if (lower.includes('vegan')) {
      groups.vegan.push(dietaryPerson);
    } else if (lower.includes('vegetar')) {
      groups.vegetarian.push(dietaryPerson);
    } else {
      groups.other.push({
        ...dietaryPerson,
        details: person.dietaryRequirements,
      });
    }
  });

  return groups;
}
```

---

## Security Architecture

### Authentication Flow

```
[Client: /admin/fb-rapport]
         │
         │ 1. Page load
         ▼
[AuthGuard Component]
         │
         │ 2. Check localStorage for auth token
         │
         ├─ No token ────> Redirect to /login
         │
         │ 3. Has token
         ▼
[Check admin role]
         │
         ├─ Not admin ──> Show "Access Denied"
         │
         │ 4. Is admin
         ▼
[Fetch report data]
         │
         │ 5. GET /api/admin/fb-report
         │    Cookie: auth-token
         ▼
[API Route: getUserFromRequest()]
         │
         │ 6. Verify JWT signature
         │
         ├─ Invalid ────> 403 Unauthorized
         │
         │ 7. Check role in payload
         │
         ├─ Not admin ──> 403 Unauthorized
         │
         │ 8. Admin verified
         ▼
[Query database & return data]
```

### Security Measures

**1. Authentication:**
- JWT token required in cookie
- Token verified on every API request
- 30-day token expiration
- HttpOnly cookies prevent XSS access

**2. Authorization:**
- Admin role check at API level
- Additional client-side check (UX)
- No data leakage in error messages

**3. Data Protection:**
- Dietary requirements contain health data
- Only admins can access
- No caching of sensitive data
- HTTPS required in production

**4. Export Security:**
- All exports generated client-side
- No files stored on server
- Filenames include date (no user PII)
- Downloads occur over encrypted connection

**5. Input Validation:**
- API validates admin status before queries
- Database constraints prevent invalid data
- TypeScript types enforce structure

**6. Error Handling:**
- Generic error messages to clients
- Detailed errors logged server-side only
- No stack traces exposed to client

---

## Performance Considerations

### Database Queries

**Optimization Strategies:**

1. **Single Query Approach:**
   - Fetch all preferences in one query with joins
   - Use Supabase's `select()` syntax for nested data
   - Leverage index on `food_drink_preferences(user_id)`

2. **Expected Performance:**
   - 50 persons: ~100ms query time
   - 100 persons: ~150ms query time
   - 200 persons: ~250ms query time

3. **Query Plan:**
```sql
-- Index usage
EXPLAIN SELECT * FROM food_drink_preferences WHERE user_id IN (...);
-- Uses: idx_food_drink_user

-- Join efficiency
EXPLAIN SELECT fdp.*, u.name FROM food_drink_preferences fdp
INNER JOIN users u ON fdp.user_id = u.id;
-- Uses: PRIMARY KEY on users(id)
```

### Client-Side Calculations

**Memoization Strategy:**

```typescript
// In page component
const meatStats = useMemo(
  () => calculateMeatStats(reportData?.persons || []),
  [reportData?.persons]
);

const drinkStats = useMemo(
  () => calculateDrinkStats(reportData?.persons || []),
  [reportData?.persons]
);

const dietaryGroups = useMemo(
  () => groupDietaryRequirements(reportData?.persons || []),
  [reportData?.persons]
);
```

**Performance Targets:**
- Calculation time: < 100ms for 200 persons
- Re-render time: < 50ms
- Export generation: < 500ms

**Optimization:**
- Avoid recalculations on unrelated state changes
- Use `useMemo` for expensive calculations
- Lazy-load export libraries (dynamic import)

### Bundle Size

**Current Impact:**
- XLSX library: ~100KB gzipped
- No other new dependencies

**Code Splitting:**
```typescript
// Dynamic import for export library
const handleExportExcel = async () => {
  const XLSX = await import('xlsx');
  // ... export logic
};
```

**Benefits:**
- Reduces initial page load
- XLSX only loaded when export triggered
- Smaller main bundle

### Render Optimization

**Virtualization:**
- Not needed for current scale (<200 persons)
- Consider if detail list exceeds 500 persons
- Use `react-window` if implemented

**Framer Motion:**
- Use `staggerChildren` for list animations
- Limit animation duration (< 300ms)
- Disable animations for print mode

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── fb-rapport/
│   │       └── page.tsx                    [Main page component]
│   │
│   └── api/
│       └── admin/
│           └── fb-report/
│               └── route.ts                [GET endpoint]
│
├── components/
│   └── fb-report/                          [Report-specific components]
│       ├── ReportHeader.tsx                [Stats, timestamp, buttons]
│       ├── DietaryWarnings.tsx             [Dietary requirements section]
│       ├── MeatBreakdown.tsx               [Meat/fish distribution]
│       ├── DrinkBreakdown.tsx              [Drinks distribution]
│       ├── SidesBreakdown.tsx              [Veggies, sauces]
│       ├── PersonDetail.tsx                [Individual person card]
│       ├── PersonDetailList.tsx            [Collapsible list]
│       ├── ProgressBar.tsx                 [Visual percentage bar]
│       └── index.ts                        [Barrel export]
│
├── lib/
│   └── fb-calculations.ts                  [Calculation utilities]
│       ├── calculateMeatStats()
│       ├── calculateDrinkStats()
│       ├── groupDietaryRequirements()
│       ├── formatPersonForExport()
│       └── Constants (PORTION_SIZES, etc.)
│
├── types/
│   └── index.ts                            [Add new types]
│       ├── PersonPreference
│       ├── FBReportData
│       ├── MeatStats
│       ├── DrinkStats
│       ├── DietaryGroups
│       └── FBExportRow
│
└── styles/
    └── print.css                           [Print-specific styles]
        └── @media print { ... }
```

### Component File Details

**page.tsx** (~300-400 lines)
- Main page component
- Data fetching and state management
- Export handlers
- Render orchestration

**route.ts** (~150-200 lines)
- Admin authentication
- Database queries
- Data enrichment (partner names)
- Response formatting

**fb-calculations.ts** (~400-500 lines)
- Pure calculation functions
- Constants
- Helper utilities
- Well-commented algorithms

**Component files** (~100-150 lines each)
- Single responsibility
- Reusable and testable
- Props-based configuration
- Framer Motion animations

---

## Implementation Roadmap

### Phase 1: Foundation (Day 1-2)

**Tasks:**
1. Create type definitions in `src/types/index.ts`
2. Create calculation constants in `src/lib/fb-calculations.ts`
3. Set up API route skeleton in `src/app/api/admin/fb-report/route.ts`
4. Add admin route in `src/app/admin/fb-rapport/page.tsx`

**Deliverables:**
- Type-safe interfaces
- API authentication working
- Basic page renders

**Validation:**
- TypeScript compiles without errors
- Admin can access page
- API returns 403 for non-admins

---

### Phase 2: Data Layer (Day 3-4)

**Tasks:**
1. Implement database queries in API route
2. Partner name enrichment logic
3. Completion status calculation
4. API response formatting

**Deliverables:**
- Complete API implementation
- Data flows to client
- Error handling in place

**Validation:**
- API returns correct data structure
- Partner names appear correctly
- Completion status accurate

---

### Phase 3: Calculation Logic (Day 5-6)

**Tasks:**
1. Implement `calculateMeatStats()`
2. Implement `calculateDrinkStats()`
3. Implement `groupDietaryRequirements()`
4. Write unit tests for calculations

**Deliverables:**
- All calculation functions working
- Memoization in place
- Edge cases handled (empty data, nulls)

**Validation:**
- Manual calculation spot checks
- Unit tests pass
- Performance acceptable (<100ms)

---

### Phase 4: UI Components (Day 7-10)

**Tasks:**
1. Build ReportHeader component
2. Build DietaryWarnings component
3. Build MeatBreakdown component
4. Build DrinkBreakdown component
5. Build SidesBreakdown component
6. Build PersonDetail and PersonDetailList

**Deliverables:**
- All report sections rendering
- Responsive layout
- Framer Motion animations
- Styling matches design system

**Validation:**
- Visual QA against mockups
- Mobile responsiveness
- Animations smooth
- Color contrast accessible

---

### Phase 5: Export Functionality (Day 11-12)

**Tasks:**
1. Install XLSX library
2. Implement print CSS
3. Implement Excel export
4. Implement CSV export
5. Test exports with real data

**Deliverables:**
- Print-to-PDF working
- Excel export with multiple sheets
- CSV export
- Proper filenames with dates

**Validation:**
- PDF preserves layout and colors
- Excel opens correctly
- CSV imports to Google Sheets
- All data present and formatted

---

### Phase 6: Testing & Polish (Day 13-14)

**Tasks:**
1. Cross-browser testing (Chrome, Firefox, Safari)
2. Edge case testing (0 persons, all vegetarian, etc.)
3. Performance testing with large datasets
4. Accessibility audit
5. Final UI polish

**Deliverables:**
- Cross-browser compatibility
- Edge cases handled gracefully
- Performance meets targets
- WCAG 2.1 AA compliance

**Validation:**
- Acceptance criteria met
- No critical bugs
- User testing feedback incorporated

---

### Phase 7: Documentation & Handoff (Day 15)

**Tasks:**
1. Update CLAUDE.md with new routes
2. Write inline code comments
3. Create deployment checklist
4. Knowledge transfer session

**Deliverables:**
- Updated documentation
- Deployment ready
- Team trained

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **XLSX bundle size** | Medium | Low | Use dynamic import for code splitting |
| **Browser print compatibility** | Medium | Low | Test on Chrome, Firefox, Safari; provide fallback instructions |
| **Calculation performance** | Medium | Low | Use useMemo; test with 200+ persons; consider server-side if needed |
| **Data completeness** | High | Medium | Show clear warnings; handle null/undefined gracefully |
| **Partner name mismatch** | Low | Medium | Validate during registration; handle missing names with defaults |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Incomplete preferences** | High | High | Show completion status prominently; send reminders to users |
| **Dietary requirement visibility** | High | Low | Use prominent warning styling; test with stakeholders |
| **Export data accuracy** | High | Low | Thorough testing; manual spot checks; unit tests for calculations |
| **User confusion** | Medium | Low | Clear UI labels; help text; training for admins |

### Security Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Unauthorized access** | High | Low | Admin-only authentication; server-side role check |
| **Data leakage in exports** | Medium | Low | Client-side only; no server storage; HTTPS required |
| **GDPR compliance** | High | Low | Document data usage; admin-only access; no unnecessary retention |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Database performance** | Medium | Low | Index on user_id; monitor query times; optimize if needed |
| **Large dataset handling** | Medium | Low | Test with 200+ persons; consider pagination if needed |
| **Export file corruption** | Low | Low | Use stable XLSX library; test with various datasets |

---

## Acceptance Criteria Mapping

### From User Story

| Criterion | Implementation | Status |
|-----------|----------------|--------|
| Admin page `/admin/fb-rapport` | `src/app/admin/fb-rapport/page.tsx` | Designed |
| Rapport toont timestamp | ReportHeader component with `generatedAt` state | Designed |
| Refresh knop | `handleRefresh()` function | Designed |
| Waarschuwing bij incomplete data | Completion status in ReportHeader | Designed |
| Print-friendly CSS | `@media print` styles | Designed |
| PDF export knop | `handlePrint()` via browser print | Designed |
| Excel/CSV export | `handleExportExcel()`, `handleExportCSV()` with XLSX | Designed |
| Allergieën prominent | DietaryWarnings with warm-red border | Designed |
| Dieetwensen gegroepeerd | `groupDietaryRequirements()` function | Designed |
| Vlees percentages | `calculateMeatStats()` function | Designed |
| Vlees kg geschat | Using `PORTION_SIZES.meat = 200g` | Designed |
| Visuele progress bars | ProgressBar component | Designed |
| Wijn flessen berekening | `calculateWineStats()` in drinkStats | Designed |
| Wijn rood/wit verdeling | Based on `wine_preference` field | Designed |
| Bier kratten berekening | `calculateBeerStats()` in drinkStats | Designed |
| Bier pils/speciaal split | Based on `beer_type` field | Designed |
| Frisdrank per type | SoftDrinkStats breakdown | Designed |
| Water bruisend/plat | WaterStats from `water_preference` | Designed |
| Bubbels champagne/prosecco | BubblesStats from `bubble_type` | Designed |
| Partners als aparte personen | Counted in `totalPersons` | Designed |
| Partner gegroepeerd in detail | PersonDetailList groups by `userId` | Designed |
| Detail view uitklapbaar | PersonDetailList with collapse state | Designed |
| Per persoon alle voorkeuren | PersonDetail component | Designed |

**All acceptance criteria addressed in architecture.**

---

## Architecture Decision Records (ADRs)

### ADR-001: Client-Side Aggregation

**Status:** Accepted

**Context:**
Data aggregation can happen on server or client. Server-side provides better performance for large datasets, but adds complexity.

**Decision:**
Use client-side aggregation with `useMemo` for calculations.

**Rationale:**
- Current scale (<200 persons) well within client capabilities
- Simpler implementation (no additional API endpoints)
- Faster iteration during development
- useMemo prevents unnecessary recalculations
- Can migrate to server-side later if needed

**Consequences:**
- Positive: Simpler codebase, faster development
- Negative: Not suitable for >500 persons without optimization
- Mitigation: Monitor performance; add server-side endpoint if needed

---

### ADR-002: Browser Print for PDF

**Status:** Accepted

**Context:**
PDF generation can use browser print, react-to-print library, or jsPDF library.

**Decision:**
Use browser native print with CSS media queries.

**Rationale:**
- Zero dependencies (no bundle size impact)
- Excellent CSS support
- User controls PDF settings (orientation, margins)
- Cross-browser support (Chrome, Firefox, Safari)
- Simple implementation

**Consequences:**
- Positive: No bundle impact, simple code, good CSS support
- Negative: Cannot programmatically set filename
- Negative: Requires user to select "Save as PDF"
- Mitigation: Provide clear instructions in UI

---

### ADR-003: SheetJS/XLSX for Excel

**Status:** Accepted

**Context:**
Excel export requires library. Options: XLSX, react-xlsx-wrapper, custom CSV.

**Decision:**
Use SheetJS/XLSX library for both Excel and CSV exports.

**Rationale:**
- Industry standard (widely used, well-maintained)
- Supports both .xlsx and .csv formats
- Good TypeScript support
- Can create multiple sheets
- Handles complex data structures

**Consequences:**
- Positive: Single library for both formats
- Positive: Rich feature set (multiple sheets, column widths)
- Negative: ~100KB gzipped bundle size
- Mitigation: Use dynamic import for code splitting

---

### ADR-004: Manual Refresh Strategy

**Status:** Accepted

**Context:**
Report data can refresh automatically (polling) or manually (button).

**Decision:**
Manual refresh with timestamp display.

**Rationale:**
- Meets acceptance criteria (refresh button)
- Simpler implementation (no polling logic)
- Reduces server load
- User controls when to refresh
- Timestamp shows data freshness

**Consequences:**
- Positive: Simple, predictable, low server load
- Negative: Data may be stale if user doesn't refresh
- Mitigation: Show prominent timestamp and completion status

---

## Appendix: Calculation Examples

### Example 1: Small Group (5 persons)

**Input:**
```
Person A (self):     50% beef, 50% chicken | 60% wine (wine_pref=20), 40% beer
Person B (self):     100% vegetarian       | 80% soft drinks, 20% wine (wine_pref=80)
Person C (self):     40% pork, 60% fish    | 50% beer, 50% wine (wine_pref=50)
Person D (partner):  30% beef, 70% chicken | 100% beer
Person E (self):     25% each (balanced)   | 70% wine (wine_pref=0), 30% soft drinks
```

**Meat Calculation:**
```
Beef:       0.5 + 0 + 0 + 0.3 + 0.25 = 1.05 persons → 21% → 0.21 kg
Chicken:    0.5 + 0 + 0 + 0.7 + 0.25 = 1.45 persons → 29% → 0.29 kg
Pork:       0 + 0 + 0.4 + 0 + 0.25 = 0.65 persons → 13% → 0.13 kg
Fish:       0 + 0 + 0.6 + 0 + 0.25 = 0.85 persons → 17% → 0.17 kg
Vegetarian: 0 + 1 + 0 + 0 + 0.25 = 1.25 persons → 25% → 0.25 kg
Game:       0 + 0 + 0 + 0 + 0.25 = 0.25 persons → 5% → 0.05 kg

Total: 1.1 kg
```

**Wine Calculation:**
```
Wine drinkers: A (60%), B (20%), C (50%), E (70%) = 0.6 + 0.2 + 0.5 + 0.7 = 2.0 persons
Total glasses: 2.0 * 2 = 4 glasses
Bottles: ceil(4 / 6) = 1 bottle

Red/White split:
A: 0.6 weight * 80% red (wine_pref=20) = 0.48 red, 0.12 white
B: 0.2 weight * 20% red (wine_pref=80) = 0.04 red, 0.16 white
C: 0.5 weight * 50% red (wine_pref=50) = 0.25 red, 0.25 white
E: 0.7 weight * 100% red (wine_pref=0) = 0.70 red, 0.00 white

Total red: 1.47 → 73.5%
Total white: 0.53 → 26.5%

Red bottles: 1
White bottles: 0
```

---

## Next Steps: Handoff to Backend Coder

**Architect → Backend Coder:**

This architecture provides complete specifications for implementing US-014. Key deliverables:

1. **API Route:** `src/app/api/admin/fb-report/route.ts`
   - Admin authentication
   - Database queries for preferences, users, registrations
   - Partner name enrichment
   - Response formatting

2. **Calculation Library:** `src/lib/fb-calculations.ts`
   - Pure functions for meat, drink, dietary calculations
   - Constants for portion sizes and container sizes
   - Export formatting utilities

3. **Type Definitions:** Updates to `src/types/index.ts`
   - PersonPreference, FBReportData
   - MeatStats, DrinkStats, DietaryGroups
   - Export row interface

**Architect → Frontend Coder:**

4. **Page Component:** `src/app/admin/fb-rapport/page.tsx`
   - Data fetching and state management
   - Refresh functionality
   - Export handlers (print, Excel, CSV)

5. **Report Components:** `src/components/fb-report/*`
   - ReportHeader, DietaryWarnings
   - MeatBreakdown, DrinkBreakdown, SidesBreakdown
   - PersonDetail, PersonDetailList
   - ProgressBar

6. **Print Styles:** CSS media queries for print
   - Page setup (A4, margins)
   - Color preservation
   - Page break controls
   - Hide interactive elements

**Architect → Test Engineer:**

7. **Test Specifications:** (separate document)
   - Unit tests for calculation functions
   - Integration tests for API route
   - E2E tests for export functionality
   - Performance benchmarks

**All questions and clarifications should reference this architecture document.**

---

**Document Status:** Architecture Complete - Ready for Implementation
**Last Updated:** 2026-01-28
**Version:** 1.0
