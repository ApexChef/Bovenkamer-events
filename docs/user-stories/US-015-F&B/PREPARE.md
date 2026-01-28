# US-015: Food & Beverage Preferences - Preparation Document

## Executive Summary

This document provides comprehensive research and technical guidance for implementing the remaining features of US-015: Food & Beverage Preferences. The key features to implement are:

1. Changing all drink sliders to default to 0% instead of pre-filled values
2. Adding conditional red/white wine preference slider when wine > 10%
3. Adding conditional beer type selection when beer > 0%
4. Displaying sarcastic message for "Speciaal Bier" selection
5. Adding sub-tabs for person selection (Jij | Partner naam) for quick navigation

The implementation requires updates to the frontend component, database schema, TypeScript types, and API endpoints. No new external libraries are required - the solution can be built using existing UI components and patterns from the codebase.

## Technology Overview

### Current Implementation Stack
- **Frontend Framework**: Next.js 14 (App Router) with React 18+
- **Language**: TypeScript (strict mode)
- **State Management**: React useState hooks (local component state)
- **Styling**: Tailwind CSS with custom theme
- **UI Components**: Custom components in `/src/components/ui/`
- **Database**: Supabase (PostgreSQL) with JSONB storage
- **API Pattern**: Next.js API Routes with RESTful conventions

### Key Files

| File | Purpose | Current State |
|------|---------|---------------|
| `/src/app/eten-drinken/page.tsx` | Main F&B preferences page | Implemented, needs modifications |
| `/src/app/api/food-drinks/route.ts` | API endpoint for saving/loading preferences | Implemented, needs new fields |
| `/src/types/index.ts` | TypeScript type definitions | Needs new types for wine/beer preferences |
| `/src/components/ui/PercentageDistribution.tsx` | Slider distribution component | Complete, reusable |
| `/src/components/ui/SegmentedControl.tsx` | Button group selector | Complete, reusable |
| `/supabase/migrations/20260128_food_drink_preferences.sql` | Database schema | Needs new columns |

---

## Detailed Documentation

### 1. Current Implementation Analysis

#### 1.1 Frontend Component (`eten-drinken/page.tsx`)

**Current Structure:**
- Tab-based interface with "Eten" and "Drinken" tabs
- Support for both user (self) and partner preferences
- Uses `PersonPreferences` interface for state management
- Implements `renderDrinkSection()` function for drink-related UI

**Current Drink Distribution Logic (Lines 312-371):**
```typescript
// Drink distribution uses PercentageDistribution component
<PercentageDistribution
  items={drinkItems}
  values={prefs.drinkDistribution}
  onChange={(values) => setPrefs({ ...prefs, drinkDistribution: values as DrinkDistribution })}
/>

// Current conditional logic:
// - If softDrinks > 10%: Show soft drink preference selector
// - If softDrinks <= 10%: Show water preference selector
```

**Current Default Behavior:**
- Preferences are loaded from API on component mount
- If no saved preferences exist, uses `DEFAULT_FOOD_DRINK_PREFERENCE`
- Current defaults set percentages to 20% (soft drinks), 40% (wine), 40% (beer)

**Missing Features:**
1. No wine-specific preference collection (red vs. white)
2. No beer type selection (Pils vs. Speciaal Bier)
3. Sliders pre-filled with defaults instead of starting at 0%

#### 1.2 Database Schema

**Table: `food_drink_preferences`**

Current columns related to drinks:
```sql
-- Drink preferences
starts_with_bubbles BOOLEAN,
bubble_type TEXT CHECK (bubble_type IN ('champagne', 'prosecco', NULL)),
drink_distribution JSONB DEFAULT '{
  "softDrinks": 20,
  "wine": 40,
  "beer": 40
}'::jsonb,
soft_drink_preference TEXT,
soft_drink_other TEXT,
water_preference TEXT CHECK (water_preference IN ('sparkling', 'flat', NULL)),
```

**Missing Columns:**
- `wine_preference` - INTEGER for red/white slider (0-100)
- `beer_type` - TEXT for pils/speciaal choice

#### 1.3 TypeScript Types

**Current: `DrinkDistribution` interface** (`/src/types/index.ts`, lines 244-254):
```typescript
export interface DrinkDistribution {
  softDrinks: number; // percentage
  wine: number;       // percentage
  beer: number;       // percentage
}

export const DEFAULT_DRINK_DISTRIBUTION: DrinkDistribution = {
  softDrinks: 20,
  wine: 40,
  beer: 40,
};
```

**Current: `FoodDrinkPreference` interface** (lines 270-289):
Contains fields for drinks including:
- `drinkDistribution: DrinkDistribution`
- `softDrinkPreference: string | null`
- `waterPreference: 'sparkling' | 'flat' | null`

**Missing Type Fields:**
- `winePreference: number | null` (0-100, where 0 = 100% red, 100 = 100% white)
- `beerType: 'pils' | 'speciaal' | null`

#### 1.4 API Endpoint

**Current GET Logic** (`/api/food-drinks/route.ts`, lines 6-84):
- Fetches user preferences from database
- Maps snake_case database fields to camelCase frontend fields
- Returns both self and partner preferences

**Current POST Logic** (lines 86-150):
- Accepts email, personType ('self' | 'partner'), and data
- Converts camelCase to snake_case for database
- Uses UPSERT with conflict resolution on `(user_id, person_type)`

**Required Changes:**
- Add mapping for `wine_preference` ↔ `winePreference`
- Add mapping for `beer_type` ↔ `beerType`

---

### 2. Implementation Research

#### 2.1 Slider Default Values (0% Start)

**Problem:**
Current implementation uses `DEFAULT_DRINK_DISTRIBUTION` which pre-fills sliders with 20/40/40 values. This makes it impossible to distinguish between "user hasn't filled this in" vs "user chose these exact percentages."

**Solution:**
Change the default to all zeros:

```typescript
export const DEFAULT_DRINK_DISTRIBUTION: DrinkDistribution = {
  softDrinks: 0,
  wine: 0,
  beer: 0,
};
```

**Impact:**
- `PercentageDistribution` component already handles 0% values (see lines 113-122)
- When all values are 0, component auto-distributes equally on first interaction
- Database defaults also need updating in migration
- Existing data remains unchanged (only affects new users)

**Validation:**
The `PercentageDistribution` component's `normalizeValues()` function handles the case when total is 0:
```typescript
if (total === 0) {
  // Equal distribution if all zero
  const equalShare = Math.floor(100 / items.length);
  const remainder = 100 - (equalShare * items.length);
  return items.reduce((acc, item, idx) => {
    acc[item.key] = equalShare + (idx === 0 ? remainder : 0);
    return acc;
  }, {} as Record<string, number>);
}
```

#### 2.2 Red/White Wine Slider Implementation

**Requirement:**
When wine percentage > 10%, show:
1. Message: "Zo, jij houdt van wijn!"
2. A slider where 0 = 100% red wine, 100 = 100% white wine

**Design Approach:**

**Option A: Single-Thumb Slider (RECOMMENDED)**
Use existing `Slider` component with custom labels:
- Value range: 0-100
- 0 = "100% Rood" (left)
- 50 = "50/50"
- 100 = "100% Wit" (right)

**Advantages:**
- Uses existing `Slider` component
- Simple implementation
- Clear semantics (single value 0-100)
- No external dependencies

**Implementation Pattern:**
```typescript
{prefs.drinkDistribution.wine > 10 && (
  <div className="mt-4 pt-4 border-t border-cream/10 space-y-3">
    <div className="text-gold text-sm font-medium flex items-center gap-2">
      🍷 Zo, jij houdt van wijn!
    </div>
    <Slider
      label="Rood of Wit?"
      min={0}
      max={100}
      value={prefs.winePreference ?? 50}
      onChange={(e) => setPrefs({
        ...prefs,
        winePreference: parseInt(e.target.value)
      })}
      formatMin="100% Rood"
      formatMax="100% Wit"
      formatValue={(val) => {
        if (val < 33) return '🍷 Rood';
        if (val > 66) return '🤍 Wit';
        return '🍷🤍 Mix';
      }}
    />
  </div>
)}
```

**Option B: Dual-Thumb Slider**
Two overlapping range inputs representing red/white percentages that must sum to 100%.

**Disadvantages:**
- Requires custom implementation or external library
- More complex state management
- Potential UX confusion
- Not necessary for this use case

**Research Sources:**
- [Multi-Thumb Sliders: Particular Two-Thumb Case | CSS-Tricks](https://css-tricks.com/multi-thumb-sliders-particular-two-thumb-case/)
- [Native dual range slider — HTML, CSS & JavaScript | Medium](https://medium.com/@predragdavidovic10/native-dual-range-slider-html-css-javascript-91e778134816)
- [10 Best Range Slider Components For React (2026) | ReactScript](https://reactscript.com/best-range-slider/)

**Recommendation:** Use Option A (single-thumb slider) for simplicity and consistency with existing UI patterns.

#### 2.3 Beer Type Selection

**Requirement:**
When beer percentage > 0%, show:
1. Choice between "Speciaal Bier" or "Pils"
2. If "Speciaal Bier" selected: Display sarcastic text "Dit is een BBQ, geen Beer Craft festival!"

**Design Approach:**

Use existing `SegmentedControl` component (proven pattern in codebase):

```typescript
{prefs.drinkDistribution.beer > 0 && (
  <div className="mt-4 pt-4 border-t border-cream/10 space-y-3">
    <h5 className="text-sm text-gold">Welk bier?</h5>
    <SegmentedControl
      label=""
      options={[
        { value: 0, label: 'Pils', emoji: '🍺' },
        { value: 1, label: 'Speciaal Bier', emoji: '🍻' },
      ]}
      value={prefs.beerType === 'pils' ? 0 : prefs.beerType === 'speciaal' ? 1 : -1}
      onChange={(val) => setPrefs({
        ...prefs,
        beerType: val === 0 ? 'pils' : 'speciaal'
      })}
    />
    {prefs.beerType === 'speciaal' && (
      <div className="p-3 bg-warm-red/20 border border-warm-red/40 rounded-lg">
        <p className="text-cream text-sm italic text-center">
          "Dit is een BBQ, geen Beer Craft festival!"
        </p>
      </div>
    )}
  </div>
)}
```

**Visual Design:**
- Sarcastic message uses `warm-red` color (#8B0000) from theme
- Background with transparency for subtle effect
- Border for emphasis
- Italic font for sarcastic tone
- Centered text for impact

**Alternative Visual Approaches:**
1. Toast notification (too intrusive)
2. Tooltip on hover (too subtle)
3. Bold/prominent banner (recommended implementation above)

#### 2.4 Conditional Rendering Logic

**Current Pattern:**
```typescript
{prefs.drinkDistribution.softDrinks > 10 ? (
  // Show soft drink preference
) : (
  // Show water preference
)}
```

**New Pattern:**
Wine and beer conditions are additive (both can show simultaneously):
```typescript
<PercentageDistribution ... />

{/* Conditional: soft drink or water */}
{prefs.drinkDistribution.softDrinks > 10 ? (
  <div>Soft drink selector</div>
) : (
  <div>Water preference</div>
)}

{/* Conditional: wine preference */}
{prefs.drinkDistribution.wine > 10 && (
  <div>Wine red/white slider</div>
)}

{/* Conditional: beer type */}
{prefs.drinkDistribution.beer > 0 && (
  <div>Beer type selector</div>
)}
```

---

### 3. Database Schema Updates

#### 3.1 Required Migration

**File:** `/supabase/migrations/20260128_wine_beer_preferences.sql`

```sql
-- Migration: Add wine and beer preference fields
-- Date: 2026-01-28
-- Purpose: Support red/white wine slider and pils/speciaal beer choice

-- Add wine preference column (0-100, where 0=red, 100=white)
ALTER TABLE food_drink_preferences
ADD COLUMN wine_preference INT DEFAULT NULL
CHECK (wine_preference >= 0 AND wine_preference <= 100);

-- Add beer type column
ALTER TABLE food_drink_preferences
ADD COLUMN beer_type TEXT DEFAULT NULL
CHECK (beer_type IN ('pils', 'speciaal', NULL));

-- Update default drink distribution to start at 0
ALTER TABLE food_drink_preferences
ALTER COLUMN drink_distribution SET DEFAULT '{
  "softDrinks": 0,
  "wine": 0,
  "beer": 0
}'::jsonb;

-- Comments for documentation
COMMENT ON COLUMN food_drink_preferences.wine_preference IS
  'Wine color preference: 0 = 100% red, 50 = mix, 100 = 100% white. NULL if wine <= 10%.';

COMMENT ON COLUMN food_drink_preferences.beer_type IS
  'Beer type preference: pils or speciaal. NULL if beer = 0%.';
```

**Migration Strategy:**
- New columns are nullable to support existing records
- Existing records remain unaffected (NULL values are valid)
- Default drink_distribution only affects new inserts
- No data migration needed

#### 3.2 Data Integrity

**Constraints:**
- `wine_preference` only meaningful when `drink_distribution->>'wine' > 10`
- `beer_type` only meaningful when `drink_distribution->>'beer' > 0`
- These are application-level constraints, not database-level (for flexibility)

**Validation Logic (Frontend):**
```typescript
// Reset wine preference if wine drops to <= 10%
if (newDistribution.wine <= 10) {
  prefs.winePreference = null;
}

// Reset beer type if beer drops to 0%
if (newDistribution.beer === 0) {
  prefs.beerType = null;
}
```

---

### 4. TypeScript Type Updates

#### 4.1 Required Changes to `/src/types/index.ts`

**Update 1: Change DEFAULT_DRINK_DISTRIBUTION** (line 250):
```typescript
export const DEFAULT_DRINK_DISTRIBUTION: DrinkDistribution = {
  softDrinks: 0,  // Changed from 20
  wine: 0,        // Changed from 40
  beer: 0,        // Changed from 40
};
```

**Update 2: Add fields to FoodDrinkPreference interface** (line 270):
```typescript
export interface FoodDrinkPreference {
  id?: string;
  userId: string;
  personType: PersonType;
  // Food
  dietaryRequirements: string;
  meatDistribution: MeatDistribution;
  veggiesPreference: number;
  saucesPreference: number;
  // Drinks
  startsWithBubbles: boolean | null;
  bubbleType: 'champagne' | 'prosecco' | null;
  drinkDistribution: DrinkDistribution;
  softDrinkPreference: string | null;
  softDrinkOther: string;
  waterPreference: 'sparkling' | 'flat' | null;
  winePreference: number | null;           // NEW: 0-100 (red to white)
  beerType: 'pils' | 'speciaal' | null;    // NEW: beer type choice
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}
```

**Update 3: Update DEFAULT_FOOD_DRINK_PREFERENCE** (line 291):
```typescript
export const DEFAULT_FOOD_DRINK_PREFERENCE: Omit<FoodDrinkPreference, 'id' | 'userId' | 'personType' | 'createdAt' | 'updatedAt'> = {
  dietaryRequirements: '',
  meatDistribution: DEFAULT_MEAT_DISTRIBUTION,
  veggiesPreference: 3,
  saucesPreference: 3,
  startsWithBubbles: null,
  bubbleType: null,
  drinkDistribution: DEFAULT_DRINK_DISTRIBUTION,
  softDrinkPreference: null,
  softDrinkOther: '',
  waterPreference: null,
  winePreference: null,    // NEW
  beerType: null,          // NEW
};
```

#### 4.2 Component State Interface

**Update PersonPreferences interface** in `eten-drinken/page.tsx` (lines 42-53):
```typescript
interface PersonPreferences {
  dietaryRequirements: string;
  meatDistribution: MeatDistribution;
  veggiesPreference: number;
  saucesPreference: number;
  startsWithBubbles: boolean | null;
  bubbleType: 'champagne' | 'prosecco' | null;
  drinkDistribution: DrinkDistribution;
  softDrinkPreference: string | null;
  softDrinkOther: string;
  waterPreference: 'sparkling' | 'flat' | null;
  winePreference: number | null;           // NEW
  beerType: 'pils' | 'speciaal' | null;    // NEW
}
```

---

### 5. API Endpoint Updates

#### 5.1 GET Endpoint Modifications

**File:** `/src/app/api/food-drinks/route.ts`

**Update mapPreference function** (lines 47-63):
```typescript
const mapPreference = (pref: Record<string, unknown>): FoodDrinkPreference => ({
  id: pref.id as string,
  userId: pref.user_id as string,
  personType: pref.person_type as PersonType,
  dietaryRequirements: (pref.dietary_requirements as string) || '',
  meatDistribution: (pref.meat_distribution as FoodDrinkPreference['meatDistribution']) || DEFAULT_MEAT_DISTRIBUTION,
  veggiesPreference: (pref.veggies_preference as number) ?? 3,
  saucesPreference: (pref.sauces_preference as number) ?? 3,
  startsWithBubbles: pref.starts_with_bubbles as boolean | null,
  bubbleType: pref.bubble_type as 'champagne' | 'prosecco' | null,
  drinkDistribution: (pref.drink_distribution as FoodDrinkPreference['drinkDistribution']) || DEFAULT_DRINK_DISTRIBUTION,
  softDrinkPreference: pref.soft_drink_preference as string | null,
  softDrinkOther: (pref.soft_drink_other as string) || '',
  waterPreference: pref.water_preference as 'sparkling' | 'flat' | null,
  winePreference: (pref.wine_preference as number) ?? null,          // NEW
  beerType: (pref.beer_type as 'pils' | 'speciaal') ?? null,         // NEW
  createdAt: pref.created_at as string,
  updatedAt: pref.updated_at as string,
});
```

#### 5.2 POST Endpoint Modifications

**Update dbData construction** (lines 114-128):
```typescript
const dbData = {
  user_id: user.id,
  person_type: personType,
  dietary_requirements: data.dietaryRequirements || null,
  meat_distribution: data.meatDistribution || null,
  veggies_preference: data.veggiesPreference ?? 3,
  sauces_preference: data.saucesPreference ?? 3,
  starts_with_bubbles: data.startsWithBubbles ?? null,
  bubble_type: data.bubbleType || null,
  drink_distribution: data.drinkDistribution || null,
  soft_drink_preference: data.softDrinkPreference || null,
  soft_drink_other: data.softDrinkOther || null,
  water_preference: data.waterPreference || null,
  wine_preference: data.winePreference ?? null,           // NEW
  beer_type: data.beerType || null,                       // NEW
  updated_at: new Date().toISOString(),
};
```

---

### 6. Frontend Component Updates

#### 6.1 State Initialization

**Update initial state** in `eten-drinken/page.tsx` (lines 66-74):
```typescript
const [selfPrefs, setSelfPrefs] = useState<PersonPreferences>({
  ...DEFAULT_FOOD_DRINK_PREFERENCE,
  winePreference: null,    // Explicit initialization
  beerType: null,          // Explicit initialization
});

const [partnerPrefs, setPartnerPrefs] = useState<PersonPreferences>({
  ...DEFAULT_FOOD_DRINK_PREFERENCE,
  winePreference: null,
  beerType: null,
});
```

#### 6.2 Loading Preferences

**Update preference loading** (lines 100-131):
```typescript
if (data.selfPreference) {
  setSelfPrefs({
    dietaryRequirements: data.selfPreference.dietaryRequirements || '',
    meatDistribution: data.selfPreference.meatDistribution || DEFAULT_MEAT_DISTRIBUTION,
    veggiesPreference: data.selfPreference.veggiesPreference ?? 3,
    saucesPreference: data.selfPreference.saucesPreference ?? 3,
    startsWithBubbles: data.selfPreference.startsWithBubbles,
    bubbleType: data.selfPreference.bubbleType,
    drinkDistribution: data.selfPreference.drinkDistribution || DEFAULT_DRINK_DISTRIBUTION,
    softDrinkPreference: data.selfPreference.softDrinkPreference,
    softDrinkOther: data.selfPreference.softDrinkOther || '',
    waterPreference: data.selfPreference.waterPreference,
    winePreference: data.selfPreference.winePreference ?? null,    // NEW
    beerType: data.selfPreference.beerType ?? null,                // NEW
  });
  setSelfSaved(true);
}

// Similar update for partnerPreference
```

#### 6.3 Render Function Updates

**Update renderDrinkSection** (lines 264-382):

Add after the existing soft drink/water conditional (after line 371):

```typescript
{/* Conditional: wine preference (red/white) */}
{prefs.drinkDistribution.wine > 10 && (
  <div className="mt-4 pt-4 border-t border-cream/10 space-y-3">
    <div className="text-gold text-sm font-medium flex items-center gap-2">
      <span>🍷</span>
      <span>Zo, jij houdt van wijn!</span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-cream/70">100% Rood</span>
        <span className="text-cream/70">100% Wit</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={prefs.winePreference ?? 50}
        onChange={(e) => setPrefs({
          ...prefs,
          winePreference: parseInt(e.target.value)
        })}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer
          bg-gradient-to-r from-[#722F37] to-[#F5F5DC]
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-gold
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-gold
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
      />
      <div className="text-center text-gold text-sm font-medium">
        {prefs.winePreference === null || prefs.winePreference === 50 ? '50/50 Mix' :
         prefs.winePreference < 33 ? '🍷 Vooral Rood' :
         prefs.winePreference < 50 ? 'Meer Rood' :
         prefs.winePreference < 67 ? 'Meer Wit' : '🤍 Vooral Wit'}
      </div>
    </div>
  </div>
)}

{/* Conditional: beer type selection */}
{prefs.drinkDistribution.beer > 0 && (
  <div className="mt-4 pt-4 border-t border-cream/10 space-y-3">
    <h5 className="text-sm text-gold">Welk bier?</h5>
    <SegmentedControl
      label=""
      options={[
        { value: 0, label: 'Pils', emoji: '🍺' },
        { value: 1, label: 'Speciaal Bier', emoji: '🍻' },
      ]}
      value={prefs.beerType === 'pils' ? 0 : prefs.beerType === 'speciaal' ? 1 : -1}
      onChange={(val) => setPrefs({
        ...prefs,
        beerType: val === 0 ? 'pils' : 'speciaal'
      })}
    />
    {prefs.beerType === 'speciaal' && (
      <div className="p-3 bg-warm-red/20 border border-warm-red/40 rounded-lg animate-pulse-subtle">
        <p className="text-cream text-sm italic text-center font-medium">
          "Dit is een BBQ, geen Beer Craft festival!"
        </p>
      </div>
    )}
  </div>
)}
```

#### 6.4 Sub-tabs for Person Selection

**Requirement:**
When user has a partner, add sub-tabs for quick navigation between user and partner preferences:
```
[Eten] [Drinken]           ← Main tabs
   [Jij] [Tamar]           ← Person sub-tabs (only when partner exists)
```

**Implementation Approach:**

**Option A: Nested Tabs (RECOMMENDED)**
Add a second-level tab bar that controls which person's preferences are shown:

```typescript
// State for person selection
const [selectedPerson, setSelectedPerson] = useState<'self' | 'partner'>('self');

// Render in tab content
{hasPartner && (
  <div className="flex gap-2 mb-6 border-b border-cream/10 pb-4">
    <button
      onClick={() => setSelectedPerson('self')}
      className={`px-4 py-2 rounded-lg transition-colors ${
        selectedPerson === 'self'
          ? 'bg-gold text-dark-wood'
          : 'bg-cream/10 text-cream/70 hover:bg-cream/20'
      }`}
    >
      Jij
    </button>
    <button
      onClick={() => setSelectedPerson('partner')}
      className={`px-4 py-2 rounded-lg transition-colors ${
        selectedPerson === 'partner'
          ? 'bg-gold text-dark-wood'
          : 'bg-cream/10 text-cream/70 hover:bg-cream/20'
      }`}
    >
      {partnerName || 'Partner'}
    </button>
  </div>
)}

{/* Conditionally render based on selectedPerson */}
{selectedPerson === 'self' ? (
  <FoodSection prefs={selfPrefs} setPrefs={setSelfPrefs} ... />
) : (
  <FoodSection prefs={partnerPrefs} setPrefs={setPartnerPrefs} ... />
)}
```

**Option B: Anchor Links**
Use scroll-to links at the top of the page:
```typescript
<div className="flex gap-4 mb-4">
  <a href="#self-prefs" className="text-gold hover:underline">Jouw voorkeuren</a>
  <a href="#partner-prefs" className="text-gold hover:underline">{partnerName}'s voorkeuren</a>
</div>
```
- **Disadvantage:** Both sections still render, page remains long

**Recommendation:** Use Option A (nested tabs) for cleaner UX and shorter page.

**State Considerations:**
- Sub-tab selection resets when switching between Eten/Drinken main tabs
- Or: Sub-tab selection persists across main tabs (user preference)
- Saved state per person remains independent

**Visual Design:**
- Sub-tabs use same styling as main tabs but smaller
- Show partner's actual name if available
- Subtle indicator showing completion status per person

#### 6.5 State Reset Logic

**Add distribution change handler:**
```typescript
const handleDistributionChange = (
  prefs: PersonPreferences,
  setPrefs: React.Dispatch<React.SetStateAction<PersonPreferences>>,
  newDistribution: DrinkDistribution
) => {
  const updates: Partial<PersonPreferences> = {
    drinkDistribution: newDistribution,
  };

  // Reset wine preference if wine drops to 10% or below
  if (newDistribution.wine <= 10 && prefs.winePreference !== null) {
    updates.winePreference = null;
  }

  // Reset beer type if beer drops to 0%
  if (newDistribution.beer === 0 && prefs.beerType !== null) {
    updates.beerType = null;
  }

  setPrefs({ ...prefs, ...updates });
};
```

**Update PercentageDistribution onChange:**
```typescript
<PercentageDistribution
  items={drinkItems}
  values={prefs.drinkDistribution}
  onChange={(values) => handleDistributionChange(
    prefs,
    setPrefs,
    values as DrinkDistribution
  )}
/>
```

---

### 7. Visual Design Considerations

#### 7.1 Wine Slider Styling

**Color Scheme:**
- Left (Red wine): `#722F37` (existing wine color from theme)
- Right (White wine): `#F5F5DC` (cream color from theme)
- Gradient background: `from-[#722F37] to-[#F5F5DC]`
- Thumb: `#D4AF37` (gold color)

**Visual Feedback:**
- Display text below slider showing interpretation
- Use emojis: 🍷 for red, 🤍 for white
- Center position (50) shows "50/50 Mix"

#### 7.2 Beer Message Styling

**Design Goals:**
- Clearly visible (not subtle)
- Humorous tone (italic font)
- Warning aesthetic (red color)
- Not alarming (transparency, soft border)

**Implementation:**
```css
.beer-warning {
  padding: 0.75rem;
  background-color: rgba(139, 0, 0, 0.2);  /* warm-red/20 */
  border: 1px solid rgba(139, 0, 0, 0.4);  /* warm-red/40 */
  border-radius: 0.5rem;
  animation: pulse-subtle 2s infinite;
}
```

**Animation (Optional):**
```css
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}
```

#### 7.3 Responsive Considerations

**Mobile (< 640px):**
- Sliders remain full-width
- Text labels stack vertically if needed
- Touch-friendly slider thumbs (min 20px)

**Desktop (>= 640px):**
- Same layout (already optimized)
- Hover states on sliders

---

### 8. Testing Strategy

#### 8.1 Unit Testing Scenarios

**Test Case 1: Slider Defaults**
- Load page with no saved preferences
- Verify all drink sliders show 0%
- Verify no conditional sections are visible

**Test Case 2: Wine Conditional**
- Set wine to 11%
- Verify wine message appears
- Verify wine slider appears
- Set wine slider and verify state update

**Test Case 3: Beer Conditional**
- Set beer to 1%
- Verify beer type selector appears
- Select "Speciaal Bier"
- Verify sarcastic message appears

**Test Case 4: State Resets**
- Set wine to 20%, select red preference
- Reduce wine to 5%
- Verify wine preference is reset to null
- Verify wine conditional section disappears

**Test Case 5: Data Persistence**
- Fill in all drink preferences including wine/beer
- Save preferences
- Reload page
- Verify all preferences are restored correctly

#### 8.2 Integration Testing

**API Round-Trip:**
1. POST preferences with wine/beer data
2. GET preferences
3. Verify wine_preference and beer_type are correctly stored and retrieved

**Database Validation:**
1. Insert record with wine_preference outside 0-100 range (should fail)
2. Insert record with invalid beer_type (should fail)
3. Verify UNIQUE constraint on (user_id, person_type)

#### 8.3 User Acceptance Testing

**Scenario 1: Wine Lover**
- User sets wine to 50%
- Sees encouraging message
- Selects preference (e.g., 75% = more white)
- Saves successfully

**Scenario 2: Beer Enthusiast with Humor**
- User sets beer to 30%
- Chooses "Speciaal Bier"
- Sees and acknowledges sarcastic message
- Not offended, continues with registration

**Scenario 3: Zero State**
- New user hasn't interacted with sliders
- All show 0%
- User adjusts sliders to their preference
- System correctly interprets first-time input

---

### 9. Edge Cases and Error Handling

#### 9.1 Edge Cases

**Case 1: Rapid Slider Changes**
- User quickly changes wine from 50% to 5%
- Wine preference should be reset
- Conditional should disappear smoothly (no flash)

**Case 2: Partner Without Preferences**
- User has partner
- Partner preferences never filled
- Should show defaults (all 0%)
- Should not show conditional sections

**Case 3: Database Migration**
- Existing users have old data (no wine/beer fields)
- New fields are NULL
- Application treats NULL as "not set"
- No errors on page load

**Case 4: Percentage Distribution Edge**
- Wine is exactly 10% (not > 10)
- Wine conditional should NOT appear
- Beer is exactly 0% (not > 0)
- Beer conditional should NOT appear

#### 9.2 Error Handling

**Database Errors:**
```typescript
try {
  const { error: upsertError } = await supabase
    .from('food_drink_preferences')
    .upsert(dbData, { onConflict: 'user_id,person_type' });

  if (upsertError) {
    console.error('Error saving preferences:', upsertError);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
} catch (error) {
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Unexpected error occurred' },
    { status: 500 }
  );
}
```

**Frontend Validation:**
```typescript
// Validate wine preference range
if (prefs.winePreference !== null &&
    (prefs.winePreference < 0 || prefs.winePreference > 100)) {
  console.error('Invalid wine preference:', prefs.winePreference);
  prefs.winePreference = 50; // Reset to default
}

// Validate beer type
if (prefs.beerType !== null &&
    !['pils', 'speciaal'].includes(prefs.beerType)) {
  console.error('Invalid beer type:', prefs.beerType);
  prefs.beerType = null; // Reset
}
```

---

### 10. Compatibility Matrix

| Component | Current Version | Compatible With | Notes |
|-----------|----------------|-----------------|-------|
| Next.js | 14.x | React 18+ | App Router required |
| React | 18.x | Next.js 14+ | Hooks API used |
| TypeScript | 5.x | Strict mode | All types defined |
| Tailwind CSS | 3.x | Custom config | Theme colors used |
| Supabase Client | Latest | PostgreSQL 15+ | JSONB support |
| Framer Motion | Latest | React 18+ | Animations (optional) |

**Browser Compatibility:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 14+, Android Chrome)

**Database Compatibility:**
- PostgreSQL 13+ (JSONB support)
- Supabase hosted (current)

---

### 11. Performance Considerations

#### 11.1 Component Rendering

**Current Performance:**
- `PercentageDistribution` uses `useCallback` for normalization (optimized)
- Local state updates are immediate (no API calls on every change)
- Save only occurs on button click (batch updates)

**No Performance Impact:**
- New conditional sections only render when thresholds met
- Wine slider is a simple native range input (no heavy library)
- Beer selector uses existing `SegmentedControl` (already performant)

#### 11.2 Database Queries

**Current Pattern:**
- Single SELECT query loads all preferences (self + partner)
- Single UPSERT saves one person's preferences
- Indexes exist on `user_id` for fast lookups

**No Additional Load:**
- New columns are simple types (INT, TEXT)
- No additional queries required
- JSONB columns remain unchanged

#### 11.3 Bundle Size

**No External Dependencies:**
- No new npm packages required
- Uses existing components and patterns
- No bundle size increase

---

### 12. Security Considerations

#### 12.1 Input Validation

**Wine Preference:**
- Database constraint: `CHECK (wine_preference >= 0 AND wine_preference <= 100)`
- Frontend validation before save
- API validates range before insert

**Beer Type:**
- Database constraint: `CHECK (beer_type IN ('pils', 'speciaal', NULL))`
- Frontend enforces valid values through SegmentedControl
- API validates enum values

#### 12.2 Authorization

**Current Security:**
- User can only save their own preferences (checked via email)
- API verifies user exists before allowing save
- No risk of SQL injection (using parameterized queries via Supabase client)

**No New Vulnerabilities:**
- New fields follow same patterns
- No user-generated content beyond predefined choices
- Wine preference is numeric (no XSS risk)
- Beer type is enum (no injection risk)

#### 12.3 Data Privacy

**Considerations:**
- Food/drink preferences are not sensitive data
- Stored in same table as existing preferences
- Subject to same privacy policy
- No PII in new fields

---

### 13. Resource Links

#### Documentation
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Hooks API Reference](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

#### Slider Implementation Research
- [Multi-Thumb Sliders: Particular Two-Thumb Case | CSS-Tricks](https://css-tricks.com/multi-thumb-sliders-particular-two-thumb-case/)
- [Native dual range slider — HTML, CSS & JavaScript | Medium](https://medium.com/@predragdavidovic10/native-dual-range-slider-html-css-javascript-91e778134816)
- [A native way of having more than one thumb on a range slider in HTML | utilitybend](https://utilitybend.com/blog/a-native-way-of-having-more-than-one-thumb-on-a-range-slider-in-html)
- [10 Best Range Slider Components For React (2026 Update) | ReactScript](https://reactscript.com/best-range-slider/)
- [React Slider component - Material UI](https://mui.com/material-ui/react-slider/)

#### Project-Specific
- [CLAUDE.md - Project Documentation](../../../CLAUDE.md)
- [User Story: US-015](./README.md)

---

### 14. Recommendations

#### 14.1 Implementation Priority

**Phase 1: Core Changes (Required)**
1. Update database schema (add migration)
2. Update TypeScript types
3. Update API endpoint mappings
4. Change default drink distribution to 0%

**Phase 2: UI Implementation (Required)**
5. Add sub-tabs for person selection (Jij | Partner)
6. Add wine conditional with slider
7. Add beer conditional with selector and message
8. Add state reset logic for conditionals

**Phase 3: Polish (Recommended)**
8. Add subtle animations (pulse on beer message)
9. Add validation messages
10. Update dashboard CTA to reflect new fields

**Phase 4: Testing & Deployment (Required)**
11. Test all scenarios
12. Verify data persistence
13. User acceptance testing
14. Deploy to production

#### 14.2 Alternative Approaches Considered

**Alternative 1: Separate Wine Red/White Percentages**
- Store as two separate fields (red_wine_percentage, white_wine_percentage)
- **Rejected:** More complex, harder to validate (must sum to 100%), single slider is clearer

**Alternative 2: Wine as Enum (Red/White/Rose/Mix)**
- Store as discrete choices instead of slider
- **Rejected:** Less granular, doesn't capture preference intensity

**Alternative 3: Beer Type as Free Text**
- Allow user to type beer brand/style
- **Rejected:** Too complex for catering planning, limited choices are sufficient

**Alternative 4: Toast Notification for Beer Message**
- Show temporary toast instead of persistent message
- **Rejected:** Too easy to miss, persistent message reinforces humor

#### 14.3 Future Enhancements (Out of Scope)

**Potential US-015.1: Wine Varietals**
- Allow users to specify red varietals (Cabernet, Merlot, etc.)
- Allow users to specify white varietals (Chardonnay, Sauvignon Blanc, etc.)

**Potential US-015.2: Beer Styles**
- Expand beer choices to include IPA, Lager, Stout, etc.
- Only relevant if event offers multiple craft options

**Potential US-015.3: Cocktail Preferences**
- Add cocktail category to drink distribution
- Add conditional for cocktail type preferences

---

### 15. Decision Framework

When implementing this feature, use the following decision criteria:

#### Criterion 1: Simplicity vs. Granularity
- **Question:** How detailed should preference collection be?
- **Answer:** Balance detail with user experience. Wine slider (0-100) provides granularity without overwhelming. Beer choice (2 options) is appropriate for BBQ context.
- **Weight:** High priority

#### Criterion 2: User Experience
- **Question:** Are conditionals clear and intuitive?
- **Answer:** Yes. Conditionals only appear when relevant, reducing cognitive load. Thresholds (wine > 10%, beer > 0%) are logical.
- **Weight:** High priority

#### Criterion 3: Data Quality
- **Question:** Will default-to-0 improve data quality?
- **Answer:** Yes. Distinguishes between "no input" and "actual preference." Critical for catering planning.
- **Weight:** High priority

#### Criterion 4: Technical Complexity
- **Question:** Does implementation require new dependencies?
- **Answer:** No. Uses existing components and patterns. Low technical risk.
- **Weight:** Medium priority

#### Criterion 5: Humor and Tone
- **Question:** Is sarcastic beer message appropriate?
- **Answer:** Yes. Fits event tone (casual BBQ). Message is lighthearted, not offensive.
- **Weight:** Low priority (but important for brand consistency)

---

### 16. Next Steps for Architecture Phase

The architect should consider the following when designing the implementation:

1. **Component Structure**
   - Should wine/beer conditionals be extracted into separate components?
   - Should state reset logic be centralized into a custom hook?

2. **State Management**
   - Is local state sufficient, or should preferences use Zustand store?
   - Should there be optimistic UI updates before API response?

3. **Validation Strategy**
   - Where should validation occur? (Frontend, API, Database)
   - Should there be client-side warnings before save?

4. **Animation Decisions**
   - Should conditionals animate in/out? (Framer Motion already imported)
   - Should beer message pulse, or is that too distracting?

5. **Accessibility**
   - Are slider labels sufficient for screen readers?
   - Should there be ARIA labels on conditional sections?

6. **Migration Rollback**
   - What's the rollback strategy if migration fails?
   - Should old records be backfilled, or is NULL acceptable?

7. **Analytics**
   - Should we track how many users select "Speciaal Bier"?
   - Should we track wine preference distributions?

---

### 17. Constraints and Limitations

#### Technical Constraints
- Must use existing Supabase database (no schema redesign)
- Must maintain backward compatibility with existing data
- Must work on mobile devices (touch-friendly sliders)
- Must support both self and partner preferences identically

#### Business Constraints
- Beer message must be sarcastic but not offensive
- Wine preference must be useful for catering planning
- All preferences must be optional (can remain at 0%)
- Must not significantly increase page load time

#### Design Constraints
- Must follow existing Bovenkamer theme (colors, fonts)
- Must use existing UI component library
- Must match existing patterns (SegmentedControl, conditional rendering)
- Must be accessible (WCAG 2.1 Level AA)

#### Timeline Constraints
- Implementation should be straightforward (< 1 day)
- No external dependencies to reduce deployment risk
- Must be testable before event date

---

### 18. Success Criteria

A successful implementation delivers:

1. All drink sliders default to 0% for new users
2. Sub-tabs appear for person selection when user has partner
3. Wine preference slider appears when wine > 10%
4. Wine slider accurately captures red/white preference (0-100)
5. Beer type selector appears when beer > 0%
6. Sarcastic message displays for "Speciaal Bier" choice
7. All preferences save and load correctly via API
8. Database stores new fields with proper constraints
9. TypeScript types are complete and enforce correctness
10. No regressions to existing functionality
11. Mobile-responsive and touch-friendly

---

## Conclusion

This preparation document provides comprehensive technical research and guidance for implementing US-015 enhancements. The solution requires:

- **Database**: 2 new columns (wine_preference, beer_type) + default change
- **Types**: 2 new fields in FoodDrinkPreference interface + default change
- **API**: Mapping for 2 new fields (GET/POST endpoints)
- **Frontend**: Sub-tabs for person navigation + 2 new conditional sections + state reset logic

**Key Technical Decisions:**
- Use single-thumb slider for wine (0-100, red to white)
- Use SegmentedControl for beer type (existing component)
- Default all drink percentages to 0%
- Reset wine/beer preferences when thresholds not met

**No External Dependencies Required:**
- All components exist in codebase
- All patterns are established
- No new libraries needed

**Estimated Complexity:** Low-Medium
- Clear requirements
- Existing patterns to follow
- Minimal new code required
- No architectural changes

The architecture phase can proceed with confidence that the implementation is well-researched and technically sound.

---

## Sources

- [Multi-Thumb Sliders: Particular Two-Thumb Case | CSS-Tricks](https://css-tricks.com/multi-thumb-sliders-particular-two-thumb-case/)
- [Native dual range slider — HTML, CSS & JavaScript | Medium](https://medium.com/@predragdavidovic10/native-dual-range-slider-html-css-javascript-91e778134816)
- [A native way of having more than one thumb on a range slider in HTML | utilitybend](https://utilitybend.com/blog/a-native-way-of-having-more-than-one-thumb-on-a-range-slider-in-html)
- [10 Best Range Slider Components For React (2026 Update) | ReactScript](https://reactscript.com/best-range-slider/)
- [React Slider component - Material UI](https://mui.com/material-ui/react-slider/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Hooks API Reference](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
