# US-015: Food & Beverage Preferences - Architecture Document

## Executive Summary

This architecture document defines the complete technical design for implementing the remaining features of US-015: Food & Beverage Preferences. The implementation adds:

1. Sub-tabs for person selection (Jij | Partner naam)
2. Default drink sliders to 0% (instead of pre-filled values)
3. Conditional wine preference slider (red/white) when wine > 10%
4. Conditional beer type selection when beer > 0%
5. Sarcastic message for "Speciaal Bier" selection

The solution uses existing UI components and patterns from the codebase, requiring no external dependencies. The architecture follows established patterns for state management, database schema, API design, and component composition.

---

## System Context

### Current Implementation

The food & drink preferences page (`/eten-drinken`) currently supports:
- Tab-based interface (Eten | Drinken)
- Separate preferences for user (self) and partner
- Percentage distribution sliders for meat and drinks
- Conditional soft drink selection (when soft drinks > 10%)
- Conditional water preference (when soft drinks ≤ 10%)
- Bubbles preference with champagne/prosecco choice
- Food preferences (dietary requirements, veggies, sauces)

### Architectural Goals

1. **Usability**: Improve navigation between user and partner preferences with sub-tabs
2. **Data Quality**: Default sliders to 0% to distinguish "not filled" from "actual preference"
3. **Personalization**: Collect wine (red/white) and beer (pils/speciaal) preferences for better catering
4. **Brand Consistency**: Maintain humorous tone with sarcastic beer message
5. **Maintainability**: Use existing components and patterns for consistency

### Constraints

**Technical Constraints:**
- Must use existing Supabase PostgreSQL database
- Must maintain backward compatibility with existing data
- Must work on mobile devices (touch-friendly controls)
- Must support both self and partner preferences identically
- Must follow Next.js 14 App Router patterns
- Must use TypeScript strict mode

**Business Constraints:**
- Beer message must be sarcastic but not offensive
- All preferences must remain optional
- Must not significantly increase page load time or complexity
- Must integrate with existing admin reporting (US-014)

**Design Constraints:**
- Must follow Bovenkamer theme (deep-green, gold, cream colors)
- Must use existing UI component library
- Must be accessible (WCAG 2.1 Level AA)
- Must maintain consistent interaction patterns

---

## Architectural Decisions

### ADR-001: Sub-Tabs Implementation Strategy

**Decision:** Implement nested tabs with local state management for person selection.

**Context:**
Users with partners need to fill preferences for both persons. Current implementation shows both sections stacked vertically, requiring significant scrolling.

**Options Considered:**

1. **Nested Tabs (SELECTED)**
   - Add second-level tabs within each main tab (Eten/Drinken)
   - Toggle between "Jij" and "Partner naam" views
   - Only show one person's form at a time
   - **Pros:** Cleaner UX, less scrolling, familiar pattern
   - **Cons:** Requires state management for tab selection

2. **Anchor Links**
   - Add quick-jump links at top of page
   - Keep both sections visible
   - **Pros:** Both sections always visible
   - **Cons:** Still requires scrolling, doesn't solve clutter

3. **Accordion**
   - Collapsible sections for each person
   - **Pros:** Progressive disclosure
   - **Cons:** Unfamiliar pattern, extra clicks

**Rationale:**
Nested tabs provide the best UX by reducing clutter while maintaining familiar navigation patterns. The implementation uses local state and follows existing tab patterns from the main Eten/Drinken tabs.

**Consequences:**
- Add `selectedPerson` state ('self' | 'partner')
- Conditionally render form based on selected person
- Sub-tabs only appear when `hasPartner` is true
- Save buttons remain per-person (no cross-contamination)

---

### ADR-002: Default Drink Slider Values

**Decision:** Change default drink distribution from {softDrinks: 20, wine: 40, beer: 40} to {softDrinks: 0, wine: 0, beer: 0}.

**Context:**
Current pre-filled values (20/40/40) make it impossible to distinguish between "user hasn't filled this in" vs "user chose these exact percentages." This impacts catering planning accuracy.

**Options Considered:**

1. **All Zero Defaults (SELECTED)**
   - Start all sliders at 0%
   - `PercentageDistribution` component auto-distributes equally on first interaction
   - **Pros:** Clear indication of user input, better data quality
   - **Cons:** Requires user interaction (but that's the point)

2. **Keep Current Defaults**
   - Maintain 20/40/40 defaults
   - **Pros:** No changes needed
   - **Cons:** Cannot distinguish "not filled" from "actual choice"

3. **NULL State**
   - Use null instead of 0
   - **Pros:** Explicit "not set" state
   - **Cons:** Breaks PercentageDistribution component, requires major refactoring

**Rationale:**
Zero defaults provide clear data quality without breaking existing component behavior. The `PercentageDistribution` component already handles the zero-sum case gracefully (lines 113-122 in PercentageDistribution.tsx).

**Consequences:**
- Update `DEFAULT_DRINK_DISTRIBUTION` in `/src/types/index.ts`
- Update database default in migration
- Existing user data remains unchanged (only affects new entries)
- Conditional sections (wine, beer) won't show until user sets percentages

---

### ADR-003: Wine Preference Implementation

**Decision:** Use single-thumb native range slider with 0-100 value (0 = 100% red, 100 = 100% white).

**Context:**
Need to capture red vs. white wine preference when wine percentage > 10%.

**Options Considered:**

1. **Single-Thumb Slider (SELECTED)**
   - Native HTML range input (0-100)
   - Custom styling with gradient background (red → cream)
   - Display labels: "100% Rood" (left), "100% Wit" (right)
   - Dynamic value label showing interpretation
   - **Pros:** Simple, uses native control, accessible, no dependencies
   - **Cons:** Less granular than two separate percentages

2. **Dual-Thumb Slider**
   - Two percentages that sum to 100%
   - **Pros:** More precise control
   - **Cons:** Requires external library or complex custom implementation, confusing UX

3. **Discrete Buttons**
   - Segmented control: "Rood" | "Mix" | "Wit"
   - **Pros:** Simple choice
   - **Cons:** Less granular, doesn't capture preference intensity

**Rationale:**
Single-thumb slider provides good balance of granularity and simplicity. The 0-100 scale allows capturing preference intensity (e.g., "mostly red" vs "50/50 mix") without overwhelming complexity.

**Consequences:**
- Add `wine_preference INT` column to database (0-100 range check)
- Add `winePreference: number | null` to TypeScript types
- Implement native range input with Tailwind CSS styling
- Show conditional section when `drinkDistribution.wine > 10`
- Reset to null when wine drops to ≤ 10%

---

### ADR-004: Beer Type Selection

**Decision:** Use existing `SegmentedControl` component with two options: "Pils" and "Speciaal Bier".

**Context:**
Need to capture beer preference when beer percentage > 0%.

**Options Considered:**

1. **SegmentedControl (SELECTED)**
   - Two options: Pils (🍺) | Speciaal Bier (🍻)
   - Uses existing component pattern
   - **Pros:** Consistent with codebase, simple, accessible
   - **Cons:** Limited to two choices

2. **Dropdown**
   - Select with multiple beer styles (IPA, Lager, etc.)
   - **Pros:** More granular
   - **Cons:** Overkill for BBQ context, not needed for catering

3. **Free Text**
   - Allow user to type beer preference
   - **Pros:** Maximum flexibility
   - **Cons:** Unusable for catering planning, data quality issues

**Rationale:**
Two-option SegmentedControl is appropriate for BBQ context (not a craft beer festival). The existing component provides consistent UX and accessibility.

**Consequences:**
- Add `beer_type TEXT` column to database (check: 'pils' | 'speciaal')
- Add `beerType: 'pils' | 'speciaal' | null` to TypeScript types
- Show conditional section when `drinkDistribution.beer > 0`
- Reset to null when beer drops to 0%
- Display sarcastic message when "Speciaal Bier" selected

---

### ADR-005: Sarcastic Beer Message Design

**Decision:** Display persistent inline message with warm-red color scheme when "Speciaal Bier" is selected.

**Context:**
Need to display humorous message "Dit is een BBQ, geen Beer Craft festival!" when user selects "Speciaal Bier".

**Options Considered:**

1. **Persistent Inline Message (SELECTED)**
   - Visible box below beer selector
   - Warm-red background (rgba(139, 0, 0, 0.2))
   - Border, italic font, centered text
   - **Pros:** Always visible, reinforces humor, accessible
   - **Cons:** Takes space on page

2. **Toast Notification**
   - Temporary popup message
   - **Pros:** Doesn't take permanent space
   - **Cons:** Easy to miss, not persistent, would need toast library

3. **Tooltip on Hover**
   - Show message on hover/focus
   - **Pros:** Subtle, space-efficient
   - **Cons:** Too subtle, not mobile-friendly, misses the point

**Rationale:**
Persistent message ensures all users see the humor and maintains brand personality. The warm-red color provides visual interest without being alarming.

**Consequences:**
- Implement conditional div with `bg-warm-red/20` background
- Use italic font for sarcastic tone
- Center text for emphasis
- Optional subtle pulse animation
- Always show when `beerType === 'speciaal'`

---

## Component Architecture

### Component Hierarchy

```
EtenDrinkenPage
├── DashboardLayout
├── Header (with back link)
├── Main Tabs (Eten | Drinken)
│   └── [if hasPartner] Person Sub-Tabs (Jij | Partner naam)
│       ├── Card
│       │   └── [activeTab === 'eten']
│       │       └── FoodSection
│       │           ├── Person Header (with User icon)
│       │           ├── Dietary Requirements Input
│       │           ├── Meat Distribution (PercentageDistribution)
│       │           ├── Veggies Preference (SegmentedControl)
│       │           ├── Sauces Preference (SegmentedControl)
│       │           └── Save Button
│       │
│       └── Card
│           └── [activeTab === 'drinken']
│               └── DrinkSection
│                   ├── Person Header (with User icon)
│                   ├── Bubbles Preference (SegmentedControl)
│                   │   └── [if startsWithBubbles] Bubble Type (SegmentedControl)
│                   ├── Drink Distribution (PercentageDistribution)
│                   │   ├── [if softDrinks > 10] Soft Drink Selector (SegmentedControl)
│                   │   ├── [if softDrinks ≤ 10] Water Preference (SegmentedControl)
│                   │   ├── [if wine > 10] Wine Preference Section (NEW)
│                   │   │   ├── Message: "Zo, jij houdt van wijn!"
│                   │   │   ├── Range Slider (red → white)
│                   │   │   └── Value Label
│                   │   └── [if beer > 0] Beer Type Section (NEW)
│                   │       ├── Beer Type Selector (SegmentedControl)
│                   │       └── [if beerType === 'speciaal'] Sarcastic Message
│                   └── Save Button
│
└── Completion Status Card
```

### Component Modifications

#### 1. EtenDrinkenPage Component

**File:** `/src/app/eten-drinken/page.tsx`

**New State:**
```typescript
const [selectedPerson, setSelectedPerson] = useState<'self' | 'partner'>('self');
```

**Updated PersonPreferences Interface:**
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

**New Functions:**
```typescript
// Handle drink distribution changes with conditional resets
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

**Modified Sections:**

1. **Sub-Tabs Rendering** (insert before card rendering):
```tsx
{hasPartner && (
  <div className="flex gap-2 p-1 bg-deep-green/50 rounded-lg mb-4">
    <button
      onClick={() => setSelectedPerson('self')}
      className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${
        selectedPerson === 'self'
          ? 'bg-gold text-deep-green font-medium'
          : 'text-cream/70 hover:text-cream'
      }`}
    >
      {userName}
    </button>
    <button
      onClick={() => setSelectedPerson('partner')}
      className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${
        selectedPerson === 'partner'
          ? 'bg-gold text-deep-green font-medium'
          : 'text-cream/70 hover:text-cream'
      }`}
    >
      {partnerName || 'Partner'}
    </button>
  </div>
)}
```

2. **Conditional Card Rendering** (replace current two-card pattern):
```tsx
<Card>
  <CardContent className="pt-6">
    {activeTab === 'eten'
      ? renderFoodSection(
          selectedPerson === 'self' ? selfPrefs : partnerPrefs,
          selectedPerson === 'self' ? setSelfPrefs : setPartnerPrefs,
          selectedPerson,
          selectedPerson === 'self' ? userName : (partnerName || 'Partner')
        )
      : renderDrinkSection(
          selectedPerson === 'self' ? selfPrefs : partnerPrefs,
          selectedPerson === 'self' ? setSelfPrefs : setPartnerPrefs,
          selectedPerson,
          selectedPerson === 'self' ? userName : (partnerName || 'Partner')
        )
    }
  </CardContent>
</Card>
```

3. **Wine Preference Section** (add after water preference):
```tsx
{/* Conditional: wine preference (red/white) */}
{prefs.drinkDistribution.wine > 10 && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.2 }}
    className="mt-4 pt-4 border-t border-cream/10 space-y-3"
  >
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
        {prefs.winePreference === null || prefs.winePreference === 50
          ? '50/50 Mix'
          : prefs.winePreference < 33
            ? '🍷 Vooral Rood'
            : prefs.winePreference < 50
              ? 'Meer Rood'
              : prefs.winePreference < 67
                ? 'Meer Wit'
                : '🤍 Vooral Wit'
        }
      </div>
    </div>
  </motion.div>
)}
```

4. **Beer Type Section** (add after wine preference):
```tsx
{/* Conditional: beer type selection */}
{prefs.drinkDistribution.beer > 0 && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.2 }}
    className="mt-4 pt-4 border-t border-cream/10 space-y-3"
  >
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="p-3 bg-warm-red/20 border border-warm-red/40 rounded-lg"
      >
        <p className="text-cream text-sm italic text-center font-medium">
          "Dit is een BBQ, geen Beer Craft festival!"
        </p>
      </motion.div>
    )}
  </motion.div>
)}
```

5. **Update PercentageDistribution onChange**:
```tsx
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

## Data Architecture

### Database Schema Changes

**Migration File:** `/supabase/migrations/20260128_wine_beer_preferences.sql`

```sql
-- Migration: Add wine and beer preference fields
-- Date: 2026-01-28
-- Purpose: Support red/white wine slider and pils/speciaal beer choice
-- Related: US-015 Food & Beverage Preferences

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

COMMENT ON COLUMN food_drink_preferences.drink_distribution IS
  'Percentage distribution across drink types (total 100%). Default 0/0/0 to track user input.';
```

**Data Integrity Rules:**

| Rule | Enforcement Level | Description |
|------|------------------|-------------|
| `wine_preference` range (0-100) | Database (CHECK) | Hard constraint preventing invalid values |
| `beer_type` enum ('pils', 'speciaal') | Database (CHECK) | Hard constraint for valid values |
| `wine_preference` only when wine > 10% | Application | Soft rule - reset to NULL when condition not met |
| `beer_type` only when beer > 0% | Application | Soft rule - reset to NULL when condition not met |
| Existing records unchanged | Migration | NULL values are valid for existing data |

**Migration Strategy:**
- Non-breaking: New columns are nullable
- Backward compatible: Existing records remain valid
- No data backfill needed: NULL indicates "not set"
- Safe rollback: Can drop columns if needed

---

### TypeScript Type Updates

**File:** `/src/types/index.ts`

**1. Update DEFAULT_DRINK_DISTRIBUTION (line 250):**
```typescript
export const DEFAULT_DRINK_DISTRIBUTION: DrinkDistribution = {
  softDrinks: 0,  // Changed from 20
  wine: 0,        // Changed from 40
  beer: 0,        // Changed from 40
};
```

**2. Update FoodDrinkPreference interface (line 270):**
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

**3. Update DEFAULT_FOOD_DRINK_PREFERENCE (line 291):**
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

---

### API Endpoint Updates

**File:** `/src/app/api/food-drinks/route.ts`

**1. Update mapPreference function (lines 47-63):**
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

**2. Update dbData construction (lines 114-128):**
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

**API Contract:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `winePreference` | `number \| null` | No | 0-100 range (if not null) |
| `beerType` | `'pils' \| 'speciaal' \| null` | No | Enum validation |

**Error Handling:**
- Database constraint violations return 500 with generic error
- Frontend validation prevents invalid values from being sent
- API validates personType and email presence (existing behavior)

---

## State Management

### Local Component State

**State Variables:**

```typescript
// Existing state
const [activeTab, setActiveTab] = useState<TabType>('eten');
const [selfPrefs, setSelfPrefs] = useState<PersonPreferences>({...});
const [partnerPrefs, setPartnerPrefs] = useState<PersonPreferences>({...});
const [selfSaved, setSelfSaved] = useState(false);
const [partnerSaved, setPartnerSaved] = useState(false);

// NEW state
const [selectedPerson, setSelectedPerson] = useState<'self' | 'partner'>('self');
```

### State Flow Diagram

```
User Action → State Update → Conditional Rendering
───────────────────────────────────────────────────

1. User adjusts wine slider to 15%
   ↓
   drinkDistribution.wine = 15
   ↓
   Condition: wine > 10 → TRUE
   ↓
   Render wine preference section
   ↓
   User sets winePreference to 75 (mostly white)

2. User reduces wine slider to 8%
   ↓
   handleDistributionChange() detects wine ≤ 10
   ↓
   Reset: winePreference = null
   ↓
   Condition: wine > 10 → FALSE
   ↓
   Hide wine preference section

3. User sets beer slider to 20%
   ↓
   drinkDistribution.beer = 20
   ↓
   Condition: beer > 0 → TRUE
   ↓
   Render beer type section
   ↓
   User selects beerType = 'speciaal'
   ↓
   Condition: beerType === 'speciaal' → TRUE
   ↓
   Render sarcastic message

4. User clicks sub-tab "Partner"
   ↓
   selectedPerson = 'partner'
   ↓
   Switch to partnerPrefs state
   ↓
   Render partner's form
```

### State Persistence

**Load Flow:**
1. Component mounts
2. useEffect triggers API GET request
3. Response contains selfPreference and partnerPreference
4. Map database format to frontend format (including new fields)
5. Update local state with loaded values
6. Set saved flags if data exists

**Save Flow:**
1. User clicks "Opslaan" button
2. savePreferences(personType) called
3. Current state serialized to JSON
4. API POST request with email, personType, data
5. Database upsert on (user_id, person_type)
6. Success: set saved flag for person

**Validation Before Save:**
```typescript
// Frontend validation (optional, defensive)
if (prefs.winePreference !== null) {
  if (prefs.winePreference < 0 || prefs.winePreference > 100) {
    console.error('Invalid wine preference:', prefs.winePreference);
    prefs.winePreference = 50; // Reset to neutral
  }
}

if (prefs.beerType !== null) {
  if (!['pils', 'speciaal'].includes(prefs.beerType)) {
    console.error('Invalid beer type:', prefs.beerType);
    prefs.beerType = null; // Reset
  }
}
```

---

## User Interface Design

### Visual Design Specifications

#### Wine Preference Slider

**Color Scheme:**
- Background gradient: `from-[#722F37]` (wine red) `to-[#F5F5DC]` (cream)
- Thumb: `#D4AF37` (gold)
- Labels: `text-cream/70` (subtle)
- Value display: `text-gold` (emphasized)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ 🍷 Zo, jij houdt van wijn!                  │ (gold text)
├─────────────────────────────────────────────┤
│ 100% Rood              100% Wit             │ (subtle labels)
│ [────────●──────────────────────────]       │ (gradient slider)
│           🍷 Vooral Rood                     │ (dynamic label)
└─────────────────────────────────────────────┘
```

**Dynamic Label Logic:**
```typescript
{prefs.winePreference === null || prefs.winePreference === 50
  ? '50/50 Mix'
  : prefs.winePreference < 33
    ? '🍷 Vooral Rood'
    : prefs.winePreference < 50
      ? 'Meer Rood'
      : prefs.winePreference < 67
        ? 'Meer Wit'
        : '🤍 Vooral Wit'
}
```

**Accessibility:**
- Native range input (keyboard accessible)
- ARIA label: "Wijn voorkeur: rood naar wit"
- Min/max labels provide context
- Visual feedback via dynamic label

#### Beer Type Selector

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Welk bier?                                  │ (gold heading)
├─────────────────────────────────────────────┤
│ ┌─────────────┬─────────────┐              │
│ │ 🍺 Pils     │ 🍻 Speciaal │              │ (SegmentedControl)
│ └─────────────┴─────────────┘              │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ "Dit is een BBQ, geen Beer Craft        ││ (conditional)
│ │  festival!"                             ││ (warm-red bg)
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

**Sarcastic Message Styling:**
- Background: `bg-warm-red/20` (subtle red tint)
- Border: `border-warm-red/40` (visible but not alarming)
- Font: italic, centered, medium weight
- Padding: comfortable whitespace
- Optional: subtle pulse animation

#### Sub-Tabs Design

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [Eten] [Drinken]           ← Main tabs      │
├─────────────────────────────────────────────┤
│ [Jij] [Tamar]              ← Sub-tabs       │ (only if hasPartner)
└─────────────────────────────────────────────┘
```

**Styling:**
```css
Sub-tab container:
  - bg-deep-green/50
  - rounded-lg
  - padding: 4px
  - gap: 8px

Sub-tab button (active):
  - bg-gold
  - text-deep-green
  - font-medium
  - rounded-md

Sub-tab button (inactive):
  - text-cream/70
  - hover:text-cream
  - transition-colors
```

**Interaction:**
- Click to switch between persons
- Active state clearly indicated
- Smooth transition (no page jump)
- Form content updates instantly

### Responsive Design

**Mobile (< 640px):**
- Sub-tabs remain horizontal (two items fit)
- Wine slider full-width (touch-friendly thumb)
- Beer selector stacks vertically if needed
- Sarcastic message wraps text

**Desktop (≥ 640px):**
- Same layout (already optimized)
- Hover states on interactive elements
- Larger touch targets not needed

**Touch Considerations:**
- Slider thumb minimum 20px (44px recommended)
- Segmented control buttons minimum 44px height
- Sub-tab buttons comfortable spacing

### Animation Strategy

**Framer Motion Transitions:**

```typescript
// Conditional section entrance
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
transition={{ duration: 0.2 }}

// Sarcastic message entrance
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.2 }}
```

**Animation Principles:**
- Subtle and quick (200ms)
- Purpose: visual continuity, not decoration
- Entrance/exit for conditional sections
- Avoid jarring layout shifts
- Respect `prefers-reduced-motion`

---

## Integration Points

### Existing Components Used

| Component | File | Usage |
|-----------|------|-------|
| `SegmentedControl` | `/src/components/ui/SegmentedControl.tsx` | Beer type selector, existing patterns |
| `PercentageDistribution` | `/src/components/ui/PercentageDistribution.tsx` | Drink sliders, existing |
| `Card`, `Button`, `Input` | `/src/components/ui/` | Layout and form controls |
| `DashboardLayout` | `/src/components/layouts/` | Page wrapper |

**No New Components Needed** - All UI elements use existing patterns.

### API Integration

**Endpoint:** `/api/food-drinks`

**GET Request:**
```typescript
const response = await fetch(
  `/api/food-drinks?email=${encodeURIComponent(currentUser.email)}`
);
const data = await response.json();
// data includes new fields: winePreference, beerType
```

**POST Request:**
```typescript
await fetch('/api/food-drinks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: currentUser.email,
    personType: 'self', // or 'partner'
    data: {
      ...prefs,
      winePreference: prefs.winePreference,
      beerType: prefs.beerType,
    },
  }),
});
```

### Dashboard Integration

**CTA Updates:**

The dashboard (`/dashboard/page.tsx`) shows completion status. No changes needed - the existing logic checks if food/drink preferences exist. The new fields are part of the same record.

**Completion Logic:**
```typescript
// Existing check (no changes needed)
const hasFoodDrinkPrefs = selfPreference !== null;
```

The dashboard CTA will automatically reflect completion when user saves preferences (new fields included).

---

## Security Considerations

### Input Validation

**Frontend Validation:**
```typescript
// Wine preference range check
if (winePreference !== null && (winePreference < 0 || winePreference > 100)) {
  // Invalid - reset or prevent save
}

// Beer type enum check
if (beerType !== null && !['pils', 'speciaal'].includes(beerType)) {
  // Invalid - reset or prevent save
}
```

**Database Constraints:**
```sql
CHECK (wine_preference >= 0 AND wine_preference <= 100)
CHECK (beer_type IN ('pils', 'speciaal', NULL))
```

**API Validation:**
- Email required (existing)
- PersonType validated (existing)
- User existence checked (existing)
- New fields pass through (validated by DB constraints)

### Authorization

**Existing Security:**
- User can only access their own preferences (checked via email)
- No user ID in URL (prevents enumeration)
- JWT authentication for API routes (existing pattern)

**No New Vulnerabilities:**
- Wine preference is numeric (no XSS)
- Beer type is enum (no injection)
- No user-generated content beyond predefined choices
- Same authorization model as existing fields

### Data Privacy

**Considerations:**
- Food/drink preferences are not sensitive PII
- Stored in same table as existing preferences
- Subject to same privacy policy
- No additional consent needed
- Can be deleted with account (cascade delete)

---

## Performance Considerations

### Component Rendering

**Performance Characteristics:**
- New conditional sections only render when thresholds met
- Wine slider is native input (minimal overhead)
- Beer selector uses existing SegmentedControl (already optimized)
- Framer Motion animations are GPU-accelerated
- Local state updates are immediate (no API calls on change)

**No Performance Impact:**
- Bundle size unchanged (no new dependencies)
- Render time negligible (simple conditionals)
- Database queries unchanged (same SELECT/UPSERT)
- Network payload slightly larger (two new fields)

### Database Performance

**Query Impact:**
- SELECT: Two additional columns (minimal overhead)
- INSERT/UPDATE: Two additional columns (minimal overhead)
- Indexes unchanged (wine/beer not indexed)
- JSONB drink_distribution unchanged (still simple object)

**Storage Impact:**
- `wine_preference`: 4 bytes per record (INT)
- `beer_type`: ~10 bytes per record (TEXT)
- Total: ~14 bytes per record (negligible)

### Network Performance

**Payload Size:**
```json
// Additional bytes per request
{
  "winePreference": 75,     // ~20 bytes
  "beerType": "speciaal"    // ~25 bytes
}
// Total: ~45 bytes (0.045 KB) - negligible
```

**Optimization Opportunities:**
- Compress API responses (gzip) - already in place
- Debounce slider changes - not needed (save on button click)
- Lazy load components - not needed (small page)

---

## Testing Strategy

### Unit Testing Scenarios

**Test Case 1: Slider Defaults**
```
GIVEN a user with no saved preferences
WHEN they load the eten-drinken page
THEN all drink sliders should show 0%
AND no conditional sections should be visible
```

**Test Case 2: Wine Conditional Appearance**
```
GIVEN a user on the drinken tab
WHEN they set wine slider to 11%
THEN the wine preference section should appear
AND show message "Zo, jij houdt van wijn!"
AND show slider from "100% Rood" to "100% Wit"
AND default to 50 (50/50 mix)
```

**Test Case 3: Wine Preference Interaction**
```
GIVEN the wine preference section is visible
WHEN user moves slider to 25 (mostly red)
THEN the label should show "🍷 Vooral Rood"
WHEN user moves slider to 75 (mostly white)
THEN the label should show "🤍 Vooral Wit"
```

**Test Case 4: Wine Conditional Disappearance**
```
GIVEN wine preference is set to 70 (mostly white)
WHEN user reduces wine slider to 10%
THEN wine preference should reset to null
AND wine preference section should disappear
```

**Test Case 5: Beer Conditional Appearance**
```
GIVEN a user on the drinken tab
WHEN they set beer slider to 1%
THEN the beer type section should appear
AND show options "Pils" and "Speciaal Bier"
AND no option should be selected by default
```

**Test Case 6: Sarcastic Message**
```
GIVEN the beer type section is visible
WHEN user selects "Speciaal Bier"
THEN the sarcastic message should appear
AND display "Dit is een BBQ, geen Beer Craft festival!"
AND use warm-red color scheme
```

**Test Case 7: Beer Conditional Disappearance**
```
GIVEN beer type is set to "pils"
WHEN user reduces beer slider to 0%
THEN beer type should reset to null
AND beer type section should disappear
```

**Test Case 8: Sub-Tabs Switching**
```
GIVEN a user with a partner
WHEN they click the partner sub-tab
THEN the form should show partner's preferences
AND the sub-tab should highlight
WHEN they click "Jij" sub-tab
THEN the form should show user's preferences
```

**Test Case 9: Data Persistence**
```
GIVEN a user has filled wine (70) and beer (pils) preferences
WHEN they click "Opslaan"
THEN the data should save successfully
WHEN they reload the page
THEN wine preference should be 70
AND beer type should be "pils"
AND conditional sections should appear correctly
```

**Test Case 10: Partner Independence**
```
GIVEN a user sets their own wine to 80 (mostly white)
AND partner's wine is not set
WHEN they switch to partner tab
THEN partner's wine slider should be at 0%
AND wine preference section should NOT appear
```

### Integration Testing

**API Round-Trip Test:**
```typescript
// 1. POST preferences with new fields
const postResponse = await fetch('/api/food-drinks', {
  method: 'POST',
  body: JSON.stringify({
    email: 'test@example.com',
    personType: 'self',
    data: {
      // ... existing fields
      winePreference: 75,
      beerType: 'speciaal',
    },
  }),
});
expect(postResponse.ok).toBe(true);

// 2. GET preferences
const getResponse = await fetch('/api/food-drinks?email=test@example.com');
const data = await getResponse.json();

// 3. Verify new fields
expect(data.selfPreference.winePreference).toBe(75);
expect(data.selfPreference.beerType).toBe('speciaal');
```

**Database Constraint Test:**
```sql
-- Should FAIL: wine_preference out of range
INSERT INTO food_drink_preferences (user_id, person_type, wine_preference)
VALUES ('...', 'self', 150);
-- Expected: CHECK constraint violation

-- Should SUCCEED: valid wine_preference
INSERT INTO food_drink_preferences (user_id, person_type, wine_preference)
VALUES ('...', 'self', 75);

-- Should FAIL: invalid beer_type
INSERT INTO food_drink_preferences (user_id, person_type, beer_type)
VALUES ('...', 'self', 'craft-ipa');
-- Expected: CHECK constraint violation
```

### User Acceptance Testing

**Scenario 1: Wine Lover Journey**
```
1. User logs in and navigates to Eten & Drinken
2. Switches to "Drinken" tab
3. Sets wine slider to 60%
4. Sees encouraging message "Zo, jij houdt van wijn!"
5. Adjusts wine preference slider to 80 (mostly white)
6. Sees label update to "🤍 Vooral Wit"
7. Clicks "Opslaan"
8. Sees success confirmation
9. Reloads page
10. Verifies wine preferences are preserved
```

**Scenario 2: Beer Enthusiast with Humor**
```
1. User navigates to Drinken tab
2. Sets beer slider to 40%
3. Sees beer type selector appear
4. Selects "Speciaal Bier"
5. Sees sarcastic message appear
6. Laughs, continues with selection
7. Saves preferences successfully
```

**Scenario 3: Partner Preferences**
```
1. User with partner navigates to Eten & Drinken
2. Sees sub-tabs: "Jij" and "Partner Name"
3. Fills own preferences (wine 70, beer pils)
4. Clicks "Opslaan" for self
5. Clicks partner sub-tab
6. Sees empty form (all sliders at 0%)
7. Fills partner preferences (wine 20, beer speciaal)
8. Clicks "Opslaan" for partner
9. Both preferences saved independently
```

**Scenario 4: Changing Mind**
```
1. User sets wine to 50%, selects wine preference 90 (white)
2. Decides they don't want wine
3. Reduces wine slider to 0%
4. Wine preference section disappears
5. Preferences reset gracefully
6. Saves updated preferences
```

### Edge Case Testing

**Edge Case 1: Boundary Values**
```
Wine = 10% → No wine section (not > 10)
Wine = 11% → Wine section appears (> 10)
Beer = 0% → No beer section (not > 0)
Beer = 1% → Beer section appears (> 0)
```

**Edge Case 2: Rapid Slider Changes**
```
User rapidly adjusts wine: 0% → 50% → 5% → 30% → 8%
System should handle state updates gracefully
Final state: wine 8%, winePreference null, section hidden
```

**Edge Case 3: Concurrent Tab Switching**
```
User switches main tab (Eten → Drinken) while sub-tab shows Partner
Form should render partner's drink preferences correctly
State should not mix between persons
```

**Edge Case 4: Database Migration**
```
Existing user has old data (no wine/beer fields)
Fields are NULL in database
API returns null values
Frontend treats as "not set"
No errors on page load
Conditionals don't show until percentages set
```

---

## Deployment Strategy

### Implementation Sequence

**Phase 1: Database & Types (Foundation)**
1. Run database migration (add columns, update defaults)
2. Update TypeScript types in `/src/types/index.ts`
3. Verify types compile without errors

**Phase 2: API Layer (Data Flow)**
4. Update API endpoint mappings (GET/POST)
5. Test API with Postman/curl (verify new fields)
6. Verify database constraints work

**Phase 3: Frontend Components (UI)**
7. Add state variables and helper functions
8. Implement sub-tabs for person selection
9. Add wine preference section with slider
10. Add beer type section with message
11. Test local development environment

**Phase 4: Testing & Validation**
12. Run unit tests (if implemented)
13. Manual testing of all scenarios
14. Test on mobile devices
15. Verify accessibility with screen reader

**Phase 5: Deployment**
16. Merge to `develop` branch
17. Test on staging environment
18. Create PR to `main`
19. Deploy to production (Netlify)
20. Monitor for errors

### Rollback Plan

**If Critical Issues Arise:**

1. **Database Rollback:**
```sql
-- Remove new columns
ALTER TABLE food_drink_preferences
DROP COLUMN wine_preference,
DROP COLUMN beer_type;

-- Revert drink_distribution default
ALTER TABLE food_drink_preferences
ALTER COLUMN drink_distribution SET DEFAULT '{
  "softDrinks": 20,
  "wine": 40,
  "beer": 40
}'::jsonb;
```

2. **Code Rollback:**
- Revert commit via Git
- Redeploy previous version
- Database remains compatible (NULL values ignored)

3. **Partial Rollback:**
- Keep database changes (columns remain)
- Hide UI sections with feature flag (if needed)
- Fix issues and redeploy

### Monitoring

**Post-Deployment Checks:**
- [ ] Page loads without JavaScript errors
- [ ] API endpoints return 200 status
- [ ] New fields save and load correctly
- [ ] Conditionals show/hide appropriately
- [ ] Mobile layout renders correctly
- [ ] No console warnings or errors
- [ ] Database queries perform well

**Metrics to Watch:**
- API response times (should remain similar)
- Error rates (should not increase)
- User completion rates (may improve with clearer defaults)
- Database storage (negligible increase)

---

## Risk Assessment

### Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Database migration fails | Low | High | Test migration on staging first; Have rollback script ready |
| Users confused by 0% defaults | Medium | Low | Clear UX (sliders work intuitively); Instructions remain same |
| Slider accessibility issues | Low | Medium | Use native range input; Add ARIA labels; Test with screen reader |
| State synchronization bugs | Medium | Medium | Thorough testing of conditional logic; Use helper functions |
| Performance degradation | Very Low | Low | Components are lightweight; Monitor post-deploy |
| Sarcastic message offends users | Low | Low | Message is lighthearted; Fits event tone; Can adjust if needed |
| Sub-tabs confuse users with partners | Low | Low | Clear labels; Only shows when needed; Matches familiar pattern |

### Mitigation Strategies

**Database Migration:**
- Run migration on staging environment first
- Test with sample data
- Keep rollback script ready
- Schedule during low-traffic period

**User Experience:**
- Maintain existing patterns (consistency)
- Use clear labels and visual feedback
- Provide same instructions as before
- Test with real users if possible

**Technical Quality:**
- Code review before merging
- Test on multiple browsers
- Test on mobile devices
- Monitor error logs post-deploy

**Communication:**
- Document changes in release notes
- Admin can see new data in reporting (US-014)
- Support team aware of new fields

---

## Documentation Requirements

### Code Documentation

**Inline Comments:**
```typescript
// Reset wine preference if wine percentage drops below threshold
if (newDistribution.wine <= 10 && prefs.winePreference !== null) {
  updates.winePreference = null;
}

// Show wine preference slider only when wine > 10%
{prefs.drinkDistribution.wine > 10 && (
  // Wine section component
)}
```

**Function Documentation:**
```typescript
/**
 * Handles drink distribution changes and resets conditional preferences
 * when thresholds are not met.
 *
 * @param prefs - Current person preferences
 * @param setPrefs - State setter function
 * @param newDistribution - New drink distribution values
 */
const handleDistributionChange = (
  prefs: PersonPreferences,
  setPrefs: React.Dispatch<React.SetStateAction<PersonPreferences>>,
  newDistribution: DrinkDistribution
) => {
  // Implementation
};
```

### Database Documentation

**Schema Comments:**
```sql
COMMENT ON COLUMN food_drink_preferences.wine_preference IS
  'Wine color preference: 0 = 100% red, 50 = mix, 100 = 100% white. NULL if wine <= 10%.';

COMMENT ON COLUMN food_drink_preferences.beer_type IS
  'Beer type preference: pils or speciaal. NULL if beer = 0%.';
```

### API Documentation

**Update API docs (if exists) with new fields:**

```markdown
## POST /api/food-drinks

### Request Body
{
  "email": "user@example.com",
  "personType": "self" | "partner",
  "data": {
    // ... existing fields
    "winePreference": number | null,  // NEW: 0-100, red to white
    "beerType": "pils" | "speciaal" | null  // NEW: beer type
  }
}

### Response
{
  "success": true,
  "message": "Jouw voorkeuren opgeslagen"
}
```

---

## Success Criteria

A successful implementation delivers:

- [ ] All drink sliders default to 0% for new users
- [ ] Sub-tabs appear for person selection when user has partner
- [ ] Sub-tabs switch between user and partner preferences smoothly
- [ ] Wine preference section appears when wine > 10%
- [ ] Wine slider displays with gradient (red → white)
- [ ] Wine slider shows dynamic label based on value
- [ ] Wine preference saves and loads correctly
- [ ] Wine preference resets when wine drops to ≤ 10%
- [ ] Beer type section appears when beer > 0%
- [ ] Beer type selector shows Pils and Speciaal Bier options
- [ ] Sarcastic message displays when Speciaal Bier selected
- [ ] Sarcastic message uses warm-red color scheme
- [ ] Beer type resets when beer drops to 0%
- [ ] All preferences persist across page reloads
- [ ] Database stores new fields with proper constraints
- [ ] TypeScript types are complete and enforce correctness
- [ ] API correctly maps new fields (camelCase ↔ snake_case)
- [ ] No regressions to existing functionality
- [ ] Mobile-responsive and touch-friendly
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Page performance remains unchanged
- [ ] Admin reporting includes new fields (US-014 compatibility)

---

## Appendix

### A. File Modification Summary

| File | Type | Changes |
|------|------|---------|
| `/supabase/migrations/20260128_wine_beer_preferences.sql` | New | Create migration for wine/beer columns and defaults |
| `/src/types/index.ts` | Modified | Add winePreference, beerType fields; Change default distribution |
| `/src/app/eten-drinken/page.tsx` | Modified | Add sub-tabs, wine section, beer section, state handlers |
| `/src/app/api/food-drinks/route.ts` | Modified | Add field mappings for wine/beer in GET/POST |

**Total Files Modified:** 3 existing + 1 new migration

### B. Estimated Effort

| Phase | Estimated Time | Complexity |
|-------|---------------|------------|
| Database Migration | 30 minutes | Low |
| TypeScript Types | 15 minutes | Low |
| API Endpoint Updates | 30 minutes | Low |
| Frontend Components | 2-3 hours | Medium |
| Testing | 1-2 hours | Medium |
| Documentation | 30 minutes | Low |
| **Total** | **5-7 hours** | **Low-Medium** |

**Assumptions:**
- Developer familiar with codebase
- No unexpected bugs or issues
- Standard development environment
- Testing on local and staging

### C. Dependencies

**External Dependencies:**
- None (uses existing libraries)

**Internal Dependencies:**
- Existing UI components (SegmentedControl, etc.)
- Existing database table (food_drink_preferences)
- Existing API patterns
- Existing state management patterns

**Prerequisite Changes:**
- None (standalone feature)

### D. Future Enhancements (Out of Scope)

**Potential US-015.1: Wine Varietals**
- Allow users to specify red varietals (Cabernet, Merlot, Pinot Noir)
- Allow users to specify white varietals (Chardonnay, Sauvignon Blanc, Riesling)
- Requires additional database fields and UI complexity

**Potential US-015.2: Beer Styles**
- Expand beer choices to include IPA, Lager, Stout, Wheat, etc.
- Only relevant if event offers multiple craft options
- Current two-option approach appropriate for BBQ context

**Potential US-015.3: Cocktail Preferences**
- Add cocktail category to drink distribution
- Add conditional for cocktail type preferences
- Out of scope for BBQ event

**Potential US-015.4: Analytics Dashboard**
- Visualize preference distributions across all users
- Help with procurement planning
- Part of admin reporting (US-014)

### E. References

**Design Patterns:**
- [React Hooks Best Practices](https://react.dev/reference/react)
- [Next.js App Router Patterns](https://nextjs.org/docs/app)
- [Tailwind CSS Customization](https://tailwindcss.com/docs)

**Accessibility:**
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN: ARIA Range](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/slider_role)

**Project-Specific:**
- [CLAUDE.md - Project Documentation](/Users/alwinvandijken/Projects/github.com/ApexChef/Bovenkamer-events/CLAUDE.md)
- [US-015 User Story](./README.md)
- [US-015 Preparation Document](./PREPARE.md)

---

## Conclusion

This architecture provides a comprehensive blueprint for implementing the remaining features of US-015: Food & Beverage Preferences. The design follows established patterns, uses existing components, and requires no external dependencies.

**Key Architectural Principles Applied:**
- **Separation of Concerns:** Database, API, and UI layers clearly defined
- **Consistency:** Uses existing component patterns and design system
- **Simplicity:** Single-thumb slider, two-option selector, local state
- **Accessibility:** Native controls, ARIA labels, keyboard navigation
- **Maintainability:** Clear state management, conditional rendering logic
- **Performance:** Minimal overhead, lightweight components
- **Security:** Database constraints, input validation, existing auth

**Implementation Readiness:**
All technical decisions are documented with rationale. Component specifications are detailed enough for implementation. Database schema changes are defined with migration script. API modifications are clearly mapped. The solution is ready to move to the Code phase.

**Next Steps:**
Proceed to implementation following the sequence defined in the Deployment Strategy section. Start with database migration and types, then API layer, then frontend components, followed by testing and deployment.

---

**Document Control:**
- **Version:** 1.0
- **Date:** 2026-01-28
- **Author:** Claude Opus 4.5 (PACT Architect Agent)
- **Status:** Ready for Implementation
- **Approval:** Pending Code Phase Review

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
