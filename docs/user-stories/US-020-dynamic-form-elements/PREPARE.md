# US-020: Dynamic Rating Questions - Preparation Documentation

**Date**: 2026-01-28
**Status**: Research Complete
**Next Phase**: Architecture

---

## Executive Summary

This document provides comprehensive research for implementing US-020: Dynamic Rating Questions. This implementation extends the existing `prediction_questions` table (from US-019) to also support dynamic rating questions, replacing the hardcoded rating form on `/rate` page with database-driven questions.

**Key Findings**:
- Existing `prediction_questions` table needs column renaming and new columns
- Current `/rate` page has 5 star rating questions + 2 text questions + 1 binary question
- All infrastructure from US-019 is reusable (DynamicQuestion component, admin UI patterns, API structure)
- Migration involves column rename (`category` → `section`) and adding new `category` column for page filtering
- New question types needed: `star_rating`, `text_short`, `text_long`

**Recommended Approach**:
- Extend existing `prediction_questions` table with backward-compatible migration
- Add new question types to existing type system
- Extend `DynamicQuestion` component to support rating types
- Reuse existing admin interface `/admin/predictions/questions` with category filter
- Seed rating questions from current hardcoded implementation

---

## 1. Current Database Schema

### 1.1 Existing `prediction_questions` Table

**Location**: `/supabase/migrations/20260128_prediction_questions.sql`

```sql
CREATE TABLE IF NOT EXISTS prediction_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Question configuration
  key TEXT UNIQUE NOT NULL,              -- 'wineBottles', 'firstSleeper', etc.
  label TEXT NOT NULL,                   -- "Hoeveel flessen wijn?"
  type TEXT NOT NULL CHECK (type IN ('slider', 'select_participant', 'boolean', 'time', 'select_options')),
  category TEXT NOT NULL CHECK (category IN ('consumption', 'social', 'other')),

  -- Type-specific options (JSONB)
  options JSONB DEFAULT '{}',

  -- Points scoring
  points_exact INTEGER DEFAULT 50,       -- Points for exact match
  points_close INTEGER DEFAULT 25,       -- Points for close answer
  points_direction INTEGER DEFAULT 10,   -- Points for correct direction

  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX IF NOT EXISTS idx_prediction_questions_active ON prediction_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_prediction_questions_sort ON prediction_questions(sort_order);
CREATE INDEX IF NOT EXISTS idx_prediction_questions_category ON prediction_questions(category);
CREATE INDEX IF NOT EXISTS idx_prediction_questions_type ON prediction_questions(type);
```

**Current Question Types**:
- `slider` - Numeric range input
- `select_participant` - Dropdown with participant list
- `boolean` - Yes/No radio buttons
- `time` - Time selection slider
- `select_options` - Custom dropdown options

**Current Categories** (will become `section`):
- `consumption` - Consumption-related predictions
- `social` - Social behavior predictions
- `other` - Miscellaneous predictions

### 1.2 Existing `ratings` Table

**Location**: `/supabase/migrations/001_initial_schema.sql`

```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Star ratings (1-5)
  location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
  hospitality_rating INTEGER CHECK (hospitality_rating BETWEEN 1 AND 5),
  fire_quality_rating INTEGER CHECK (fire_quality_rating BETWEEN 1 AND 5),
  parking_rating INTEGER CHECK (parking_rating BETWEEN 1 AND 5),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),

  -- Text fields
  best_aspect TEXT,
  improvement_suggestion TEXT,

  -- Binary + explanation
  is_worthy BOOLEAN,
  worthy_explanation TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Field Mapping** (current hardcoded → database keys):

| Current Field | Database Column | Type | Required |
|---------------|----------------|------|----------|
| "Locatie" | `location_rating` | star_rating (1-5) | Yes |
| "Gastvrijheid" | `hospitality_rating` | star_rating (1-5) | Yes |
| "Kwaliteit Vuurvoorziening" | `fire_quality_rating` | star_rating (1-5) | Yes |
| "Parkeergelegenheid" | `parking_rating` | star_rating (1-5) | Yes |
| "Algemene Organisatie" | `overall_rating` | star_rating (1-5) | Yes |
| "Wat was het beste aan de locatie?" | `best_aspect` | text_short | No |
| "Wat kan beter?" | `improvement_suggestion` | text_short | No |
| "Is Boy Boom waardig lid?" | `is_worthy` | boolean | Yes |
| "Toelichting" | `worthy_explanation` | text_long | No |

---

## 2. Proposed Schema Changes

### 2.1 Migration Strategy

**Rename Existing Column**:
```sql
-- Rename 'category' to 'section' (keeps existing values)
ALTER TABLE prediction_questions
  RENAME COLUMN category TO section;
```

**Add New Column**:
```sql
-- Add 'category' as page filter ('predictions', 'ratings', etc.)
ALTER TABLE prediction_questions
  ADD COLUMN category TEXT NOT NULL DEFAULT 'predictions'
  CHECK (category IN ('predictions', 'ratings'));
```

**Add New Question Types**:
```sql
-- Update type constraint to include rating types
ALTER TABLE prediction_questions
  DROP CONSTRAINT IF EXISTS prediction_questions_type_check;

ALTER TABLE prediction_questions
  ADD CONSTRAINT prediction_questions_type_check
  CHECK (type IN (
    -- Existing types
    'slider',
    'select_participant',
    'boolean',
    'time',
    'select_options',
    -- New rating types
    'star_rating',
    'text_short',
    'text_long'
  ));
```

**Add New Columns for Rating Questions**:
```sql
-- Description text (appears below label)
ALTER TABLE prediction_questions
  ADD COLUMN description TEXT;

-- Placeholder text for inputs
ALTER TABLE prediction_questions
  ADD COLUMN placeholder TEXT;

-- Mark field as required
ALTER TABLE prediction_questions
  ADD COLUMN is_required BOOLEAN DEFAULT false;
```

**Update Indexes**:
```sql
-- Add index on category for filtering
CREATE INDEX IF NOT EXISTS idx_prediction_questions_category
  ON prediction_questions(category);

-- Update section index (was category)
DROP INDEX IF EXISTS idx_prediction_questions_category;
CREATE INDEX IF NOT EXISTS idx_prediction_questions_section
  ON prediction_questions(section);
```

### 2.2 Final Schema Structure

```sql
CREATE TABLE prediction_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Question identification
  key TEXT UNIQUE NOT NULL,              -- Database column name
  label TEXT NOT NULL,                   -- Display label
  description TEXT,                      -- Optional description below label
  placeholder TEXT,                      -- Input placeholder text

  -- Question type & categorization
  type TEXT NOT NULL CHECK (type IN (
    'slider', 'select_participant', 'boolean', 'time', 'select_options',
    'star_rating', 'text_short', 'text_long'
  )),
  category TEXT NOT NULL DEFAULT 'predictions' CHECK (category IN ('predictions', 'ratings')),
  section TEXT NOT NULL CHECK (section IN ('consumption', 'social', 'other')),

  -- Type-specific options (JSONB)
  options JSONB DEFAULT '{}',

  -- Validation
  is_required BOOLEAN DEFAULT false,

  -- Points scoring (may be NULL for ratings)
  points_exact INTEGER DEFAULT 50,
  points_close INTEGER DEFAULT 25,
  points_direction INTEGER DEFAULT 10,

  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.3 Seed Data for Rating Questions

```sql
-- Seed rating questions (category = 'ratings')
INSERT INTO prediction_questions (key, label, description, type, category, section, is_required, sort_order) VALUES
  -- Star ratings
  ('location_rating', 'Locatie', 'Ruimte, sfeer, faciliteiten', 'star_rating', 'ratings', 'other', true, 100),
  ('hospitality_rating', 'Gastvrijheid', 'Ontvangst, bediening, aandacht', 'star_rating', 'ratings', 'other', true, 110),
  ('fire_quality_rating', 'Kwaliteit Vuurvoorziening', 'BBQ, vuurplaats, warmte', 'star_rating', 'ratings', 'other', true, 120),
  ('parking_rating', 'Parkeergelegenheid', 'Ruimte, bereikbaarheid', 'star_rating', 'ratings', 'other', true, 130),
  ('overall_rating', 'Algemene Organisatie', 'Totaalindruk van de avond', 'star_rating', 'ratings', 'other', true, 140),

  -- Text questions
  ('best_aspect', 'Wat was het beste aan de locatie?', NULL, 'text_short', 'ratings', 'other', false, 200),
  ('improvement_suggestion', 'Wat kan beter?', NULL, 'text_short', 'ratings', 'other', false, 210),

  -- Binary + explanation
  ('is_worthy', 'Is Boy Boom waardig lid van de Bovenkamer?', NULL, 'boolean', 'ratings', 'other', true, 300),
  ('worthy_explanation', 'Toelichting', 'Waarom wel of niet waardig?', 'text_long', 'ratings', 'other', false, 310)
ON CONFLICT (key) DO NOTHING;
```

**Options JSONB Examples**:

**For `star_rating`**:
```json
{
  "min": 1,
  "max": 5,
  "default": 0
}
```

**For `text_short`**:
```json
{
  "maxLength": 500,
  "rows": 3
}
```

**For `text_long`**:
```json
{
  "maxLength": 2000,
  "rows": 5
}
```

**For `boolean` (worthy question)**:
```json
{
  "trueLabel": "Ja, Waardig",
  "falseLabel": "Nee, Onwaardig",
  "trueStyle": "success",
  "falseStyle": "danger"
}
```

---

## 3. Current TypeScript Types

### 3.1 Existing Prediction Types

**Location**: `/src/types/index.ts`

```typescript
/**
 * Question types supported by prediction system
 */
export type PredictionQuestionType =
  | 'slider'
  | 'select_participant'
  | 'boolean'
  | 'time'
  | 'select_options';

/**
 * Display categories for grouping questions
 */
export type PredictionCategory = 'consumption' | 'social' | 'other';

/**
 * Base prediction question structure from database
 */
export interface PredictionQuestion {
  id: string;
  key: string;
  label: string;
  type: PredictionQuestionType;
  category: PredictionCategory;
  options: PredictionQuestionOptions;
  points_exact: number;
  points_close: number;
  points_direction: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Type-specific options (discriminated union)
 */
export type PredictionQuestionOptions =
  | SliderOptions
  | SelectParticipantOptions
  | BooleanOptions
  | TimeOptions
  | SelectOptionsOptions;
```

### 3.2 Current Rating Interface

**Location**: `/src/types/index.ts`

```typescript
export interface Rating {
  id: string;
  user_id: string;
  location_rating: number;
  hospitality_rating: number;
  fire_quality_rating: number;
  parking_rating: number;
  overall_rating: number;
  best_aspect?: string;
  improvement_suggestion?: string;
  is_worthy: boolean;
  worthy_explanation?: string;
  created_at: string;
}
```

**Frontend State** (from `/src/app/rate/page.tsx`):
```typescript
interface Rating {
  email: string;
  location: number;
  hospitality: number;
  fireQuality: number;
  parking: number;
  overall: number;
  bestAspect: string;
  improvementSuggestion: string;
  isWorthy: boolean | null;
  worthyExplanation: string;
}
```

### 3.3 Proposed Extended Types

```typescript
/**
 * Extended question types including ratings
 */
export type QuestionType =
  | 'slider'
  | 'select_participant'
  | 'boolean'
  | 'time'
  | 'select_options'
  | 'star_rating'
  | 'text_short'
  | 'text_long';

/**
 * Page categories for filtering questions
 */
export type QuestionCategory = 'predictions' | 'ratings';

/**
 * Section categories for grouping within page
 */
export type QuestionSection = 'consumption' | 'social' | 'other';

/**
 * Universal question structure
 */
export interface Question {
  id: string;
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  type: QuestionType;
  category: QuestionCategory;
  section: QuestionSection;
  options: QuestionOptions;
  is_required: boolean;
  points_exact?: number;      // Optional for ratings
  points_close?: number;      // Optional for ratings
  points_direction?: number;  // Optional for ratings
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Extended options union
 */
export type QuestionOptions =
  | SliderOptions
  | SelectParticipantOptions
  | BooleanOptions
  | TimeOptions
  | SelectOptionsOptions
  | StarRatingOptions
  | TextShortOptions
  | TextLongOptions;

/**
 * Options for star rating questions
 */
export interface StarRatingOptions {
  type: 'star_rating';
  min: number;
  max: number;
  default?: number;
}

/**
 * Options for short text questions
 */
export interface TextShortOptions {
  type: 'text_short';
  maxLength?: number;
  rows?: number;
}

/**
 * Options for long text questions
 */
export interface TextLongOptions {
  type: 'text_long';
  maxLength?: number;
  rows?: number;
}
```

---

## 4. Current Components Analysis

### 4.1 DynamicQuestion Component

**Location**: `/src/components/predictions/DynamicQuestion.tsx`

**Current Implementation**:
```typescript
interface DynamicQuestionProps {
  question: PredictionQuestion;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
  disabled?: boolean;
  participants?: Array<{ value: string; label: string }>;
}

export function DynamicQuestion({ question, value, onChange, disabled, participants }: DynamicQuestionProps) {
  switch (question.type) {
    case 'slider': // Uses Slider component
    case 'select_participant': // Uses Select component
    case 'boolean': // Uses RadioGroup component
    case 'time': // Uses Slider with time formatting
    case 'select_options': // Uses Select component
    default: // Error message
  }
}
```

**Reusable UI Components**:
- `Slider` - Already exists, suitable for star rating with customization
- `Select` - Dropdown component
- `RadioGroup` - Radio button group
- `TextArea` - Multi-line text input
- `Input` - Single-line text input

**Extensions Needed**:
1. Add `star_rating` case
2. Add `text_short` case (using `TextArea`)
3. Add `text_long` case (using `TextArea` with more rows)
4. Handle `description` prop
5. Handle `placeholder` prop
6. Handle `is_required` validation

### 4.2 Current Rate Page

**Location**: `/src/app/rate/page.tsx`

**Structure**:
```tsx
export default function RatePage() {
  const [rating, setRating] = useState<Rating>({
    email: '',
    location: 0,
    hospitality: 0,
    fireQuality: 0,
    parking: 0,
    overall: 0,
    bestAspect: '',
    improvementSuggestion: '',
    isWorthy: null,
    worthyExplanation: '',
  });

  // Custom StarRating component (lines 21-56)
  function StarRating({ value, onChange, label, description }) { ... }

  // Form with hardcoded questions
  return (
    <form onSubmit={handleSubmit}>
      {/* Email input */}
      <Card>
        <Input type="email" ... />
      </Card>

      {/* Star ratings */}
      <Card>
        <StarRating label="Locatie" description="Ruimte, sfeer, faciliteiten" ... />
        <StarRating label="Gastvrijheid" ... />
        <StarRating label="Kwaliteit Vuurvoorziening" ... />
        <StarRating label="Parkeergelegenheid" ... />
        <StarRating label="Algemene Organisatie" ... />
      </Card>

      {/* Text questions */}
      <Card>
        <TextArea label="Wat was het beste aan de locatie?" ... />
        <TextArea label="Wat kan beter?" ... />
      </Card>

      {/* Worthy question */}
      <Card>
        <button onClick={() => setRating({ ...rating, isWorthy: true })}>
          Ja, Waardig
        </button>
        <button onClick={() => setRating({ ...rating, isWorthy: false })}>
          Nee, Onwaardig
        </button>
        <TextArea label="Toelichting" ... />
      </Card>
    </form>
  );
}
```

**Custom StarRating Component** (lines 21-56):
```tsx
function StarRating({ value, onChange, label, description }: {
  value: number;
  onChange: (val: number) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-cream font-medium">{label}</p>
        <p className="text-cream/50 text-sm">{description}</p>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-10 h-10 rounded-lg border-2 transition-all ${
              star <= value
                ? 'bg-gold border-gold text-dark-wood'
                : 'bg-transparent border-gold/30 text-gold/30 hover:border-gold/60'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Refactoring Strategy**:
1. Extract `StarRating` component to `/src/components/ui/StarRating.tsx`
2. Create dynamic rendering based on fetched questions
3. Group questions by `section` if needed
4. Store answers in dynamic object keyed by question `key`
5. Map to database columns on submit

---

## 5. Current API Routes

### 5.1 Public Prediction Questions Endpoint

**Location**: `/src/app/api/prediction-questions/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  const { data: questions, error } = await supabase
    .from('prediction_questions')
    .select('id, key, label, type, category, options')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return NextResponse.json({ questions: questions || [] });
}
```

**Extension Needed**:
- Add `description`, `placeholder`, `is_required` to SELECT
- Add query parameter for `category` filter: `?category=predictions` or `?category=ratings`

### 5.2 Admin Prediction Questions Endpoints

**Location**: `/src/app/api/admin/prediction-questions/route.ts`

**GET Endpoint**:
```typescript
export async function GET(request: NextRequest) {
  // Admin authentication check
  const user = await getUserFromRequest(request);
  if (!user || !isAdmin(user)) { ... }

  // Filters
  const category = searchParams.get('category');
  const activeFilter = searchParams.get('active') || 'all';

  // Query with filters
  let query = supabase
    .from('prediction_questions')
    .select('*')
    .order('sort_order', { ascending: true });

  if (category) query = query.eq('category', category);
  if (activeFilter !== 'all') query = query.eq('is_active', activeFilter === 'true');

  // Statistics
  const stats = {
    total: allQuestions.length,
    active: allQuestions.filter((q) => q.is_active).length,
    inactive: allQuestions.filter((q) => !q.is_active).length,
    byCategory: { ... },
    answerCounts: await getAnswerCounts(supabase, allQuestions),
  };

  return NextResponse.json({ questions: allQuestions, stats });
}
```

**POST Endpoint** (Create):
```typescript
export async function POST(request: NextRequest) {
  // Admin auth check
  const body = await request.json();

  // Validation
  if (!body.key || !body.label || !body.type || !body.category || !body.options) { ... }
  if (!/^[a-z][a-z0-9_]*$/.test(body.key)) { ... }
  if (!validTypes.includes(body.type)) { ... }
  if (!validCategories.includes(body.category)) { ... }

  // Check duplicate key
  const { data: existing } = await supabase
    .from('prediction_questions')
    .select('id')
    .eq('key', body.key)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'Key bestaat al' }, { status: 409 });

  // Get max sort_order
  const { data: maxSortOrder } = await supabase
    .from('prediction_questions')
    .select('sort_order')
    .eq('category', body.category)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Insert
  const { data: question, error } = await supabase
    .from('prediction_questions')
    .insert({
      key: body.key,
      label: body.label,
      type: body.type,
      category: body.category,
      options: body.options,
      points_exact: body.points_exact ?? 50,
      points_close: body.points_close ?? 25,
      points_direction: body.points_direction ?? 10,
      sort_order: maxSortOrder ? maxSortOrder.sort_order + 10 : 0,
      is_active: true,
    })
    .select()
    .single();

  return NextResponse.json({ question }, { status: 201 });
}
```

**Extensions Needed**:
- Update validation to accept new types: `star_rating`, `text_short`, `text_long`
- Add validation for new fields: `description`, `placeholder`, `is_required`
- Update `section` logic (renamed from `category`)

### 5.3 Rating Endpoint

**Location**: `/src/app/api/rating/route.ts`

**POST Endpoint** (Current):
```typescript
export async function POST(request: NextRequest) {
  const { email, rating } = await request.json();

  // Find user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  // Map to database columns
  const ratingData = {
    user_id: user.id,
    location_rating: rating.location,
    hospitality_rating: rating.hospitality,
    fire_quality_rating: rating.fireQuality,
    parking_rating: rating.parking,
    overall_rating: rating.overall,
    best_aspect: rating.bestAspect || null,
    improvement_suggestion: rating.improvementSuggestion || null,
    is_worthy: rating.isWorthy,
    worthy_explanation: rating.worthyExplanation || null,
  };

  // Upsert
  if (existingRating) {
    await supabase.from('ratings').update(ratingData).eq('id', existingRating.id);
  } else {
    await supabase.from('ratings').insert(ratingData);
  }
}
```

**Extension Strategy**:
Two options:
1. **Keep hardcoded** - No changes, ratings table unchanged
2. **Make dynamic** - Accept dynamic rating object, map to columns based on question keys

**Recommended: Keep hardcoded** for US-020 (simpler, no breaking changes to ratings table)

---

## 6. Admin Interface Analysis

### 6.1 Current Admin Predictions Questions Page

**Location**: `/src/app/admin/predictions/questions/page.tsx`

**Features**:
- List all questions with stats (total, active, inactive, by category)
- Filter by category, active status
- Drag & drop reordering
- QuestionEditor Sheet (sidebar editor)
- QuestionList component with edit/toggle/reorder actions

**Components Used**:
- `QuestionList` - Draggable list with categories (`/src/components/admin/predictions/QuestionList.tsx`)
- `QuestionEditor` - Sheet sidebar for create/edit (`/src/components/admin/predictions/QuestionEditor.tsx`)

**Extension Needed**:
- Add tab or filter for `category`: "Predictions" vs "Ratings"
- Update stats to show breakdown by both `category` and `section`
- Extend `QuestionEditor` to support new question types

### 6.2 Current Admin Ratings Page

**Location**: `/src/app/admin/ratings/page.tsx`

**Current State**: Placeholder page ("Coming soon")

**Proposed Enhancement**:
- Show all ratings in table format
- Statistics: averages per criterion, worthy percentage
- Individual rating details
- Export functionality

---

## 7. Implementation Recommendations

### 7.1 Migration Approach

**Phase 1: Database Migration**
1. Create migration file: `20260128_dynamic_ratings.sql`
2. Rename `category` column to `section`
3. Add new `category` column with default `'predictions'`
4. Add new columns: `description`, `placeholder`, `is_required`
5. Update type constraint to include rating types
6. Update indexes
7. Seed rating questions

**Phase 2: Type System Update**
1. Extend `PredictionQuestionType` to `QuestionType`
2. Add `StarRatingOptions`, `TextShortOptions`, `TextLongOptions`
3. Create `QuestionCategory` and `QuestionSection` types
4. Update `Question` interface (formerly `PredictionQuestion`)

**Phase 3: Component Extensions**
1. Extract `StarRating` component from `/rate` page
2. Create `TextShort` component (wrapper around `TextArea`)
3. Create `TextLong` component (wrapper around `TextArea`)
4. Extend `DynamicQuestion` to support new types
5. Update `QuestionEditor` to support new fields

**Phase 4: API Updates**
1. Update `/api/prediction-questions` to support category filter
2. Update admin endpoints to handle new fields
3. Update validation logic for new types

**Phase 5: Rate Page Refactor**
1. Fetch questions from API with `?category=ratings`
2. Render questions dynamically using `DynamicQuestion`
3. Store answers in dynamic object
4. Submit to existing `/api/rating` endpoint (unchanged)

**Phase 6: Admin Interface**
1. Add category filter to admin questions page
2. Update stats to show section breakdown
3. Enhance admin ratings page to show submitted ratings

### 7.2 Backward Compatibility

**Existing Predictions**:
- All existing prediction questions have `category = 'predictions'` after migration
- No breaking changes to prediction flow
- Zustand store unchanged

**Database**:
- Column rename is transparent to application (update queries)
- Default value for new `category` column ensures existing rows work
- RLS policies unchanged

### 7.3 Testing Considerations

**Unit Tests**:
- StarRating component rendering
- TextShort/TextLong components
- DynamicQuestion with new types
- Validation for new fields

**Integration Tests**:
- Fetch rating questions from API
- Submit rating with dynamic questions
- Admin CRUD for rating questions

**E2E Tests**:
- User completes rating form with dynamic questions
- Admin creates new rating question → appears on rate page

---

## 8. Constraints & Considerations

### 8.1 Data Mapping

**Challenge**: Ratings table has fixed columns, but questions are dynamic.

**Solution**: Question `key` must match database column name exactly.

**Example**:
- Question key: `location_rating`
- Database column: `location_rating`
- If keys don't match, add mapping logic in API

### 8.2 Validation

**Star Ratings**:
- Enforce min=1, max=5
- Require value between min and max
- Show error if required and not answered

**Text Fields**:
- Enforce maxLength if specified
- Show character count
- Trim whitespace

**Required Fields**:
- Check `is_required` flag
- Block submit if required fields empty
- Show validation errors inline

### 8.3 Scoring

**Ratings Don't Have Points**:
- Set `points_exact`, `points_close`, `points_direction` to NULL for rating questions
- Hide points fields in admin editor for rating questions
- Filter out null points in leaderboard calculations

### 8.4 Security

**RLS Policies**:
- Anyone can read active questions
- Only admins can write
- User can only submit rating for their own user_id

**Input Sanitization**:
- Escape HTML in text fields
- Validate maxLength server-side
- Prevent XSS in description/placeholder fields

---

## 9. Files & Locations

### 9.1 New Files to Create

```
supabase/migrations/
  └── 20260128_dynamic_ratings.sql          # Database migration

src/components/ui/
  └── StarRating.tsx                        # Extracted star rating component

src/components/questions/
  └── TextShort.tsx                         # Short text input component
  └── TextLong.tsx                          # Long text input component

docs/user-stories/US-020-dynamic-form-elements/
  └── PREPARE.md                            # This document
```

### 9.2 Files to Modify

```
src/types/index.ts                          # Add new types
src/components/predictions/DynamicQuestion.tsx  # Add new cases
src/app/api/prediction-questions/route.ts  # Add category filter
src/app/api/admin/prediction-questions/route.ts  # Update validation
src/app/rate/page.tsx                       # Refactor to dynamic
src/app/admin/predictions/questions/page.tsx  # Add category filter
```

---

## 10. Seed Data Details

### 10.1 Rating Questions Seed

```sql
-- Star rating questions
INSERT INTO prediction_questions (
  key, label, description, type, category, section, is_required, sort_order, options
) VALUES
  (
    'location_rating',
    'Locatie',
    'Ruimte, sfeer, faciliteiten',
    'star_rating',
    'ratings',
    'other',
    true,
    100,
    '{"type": "star_rating", "min": 1, "max": 5, "default": 0}'
  ),
  (
    'hospitality_rating',
    'Gastvrijheid',
    'Ontvangst, bediening, aandacht',
    'star_rating',
    'ratings',
    'other',
    true,
    110,
    '{"type": "star_rating", "min": 1, "max": 5, "default": 0}'
  ),
  (
    'fire_quality_rating',
    'Kwaliteit Vuurvoorziening',
    'BBQ, vuurplaats, warmte',
    'star_rating',
    'ratings',
    'other',
    true,
    120,
    '{"type": "star_rating", "min": 1, "max": 5, "default": 0}'
  ),
  (
    'parking_rating',
    'Parkeergelegenheid',
    'Ruimte, bereikbaarheid',
    'star_rating',
    'ratings',
    'other',
    true,
    130,
    '{"type": "star_rating", "min": 1, "max": 5, "default": 0}'
  ),
  (
    'overall_rating',
    'Algemene Organisatie',
    'Totaalindruk van de avond',
    'star_rating',
    'ratings',
    'other',
    true,
    140,
    '{"type": "star_rating", "min": 1, "max": 5, "default": 0}'
  ),

  -- Text short questions
  (
    'best_aspect',
    'Wat was het beste aan de locatie?',
    NULL,
    'text_short',
    'ratings',
    'other',
    false,
    200,
    '{"type": "text_short", "placeholder": "Bijv. de sfeer, het uitzicht, de ruimte...", "maxLength": 500, "rows": 3}'
  ),
  (
    'improvement_suggestion',
    'Wat kan beter?',
    NULL,
    'text_short',
    'ratings',
    'other',
    false,
    210,
    '{"type": "text_short", "placeholder": "Constructieve feedback voor de toekomst...", "maxLength": 500, "rows": 3}'
  ),

  -- Binary question
  (
    'is_worthy',
    'Is Boy Boom waardig lid van de Bovenkamer?',
    NULL,
    'boolean',
    'ratings',
    'other',
    true,
    300,
    '{"type": "boolean", "trueLabel": "Ja, Waardig", "falseLabel": "Nee, Onwaardig", "trueStyle": "success", "falseStyle": "danger"}'
  ),

  -- Text long question
  (
    'worthy_explanation',
    'Toelichting',
    'Waarom wel of niet waardig?',
    'text_long',
    'ratings',
    'other',
    false,
    310,
    '{"type": "text_long", "placeholder": "Waarom wel of niet waardig?", "maxLength": 2000, "rows": 5}'
  )
ON CONFLICT (key) DO NOTHING;
```

---

## 11. Next Steps for Architect

The Architect should focus on:

1. **Migration Script Design**
   - Confirm column rename strategy
   - Determine if `section` values need updating
   - Define rollback strategy

2. **Type System Refinement**
   - Finalize `QuestionOptions` discriminated union
   - Type guards for runtime validation
   - Ensure backward compatibility with `PredictionQuestion`

3. **Component Architecture**
   - Decide on StarRating component API
   - Define TextShort vs TextLong distinction
   - DynamicQuestion extension strategy

4. **API Contract Updates**
   - Clarify category filter behavior
   - Define validation rules for new types
   - Error codes for rating-specific errors

5. **Admin UI Flow**
   - Category filter UI/UX (tabs vs dropdown)
   - Stats display for multiple categories
   - QuestionEditor conditional fields

6. **Data Flow**
   - Rate page: fetch → render → submit flow
   - Mapping strategy (question key → database column)
   - Validation timing (client vs server)

---

## 12. Resources & References

**Related User Stories**:
- US-019: Dynamic Prediction Questions (foundation)
- US-017: User Management (admin patterns)
- US-014: F&B Admin (admin report patterns)

**Key Files**:
- `/supabase/migrations/20260128_prediction_questions.sql` - Existing schema
- `/src/types/index.ts` - Type definitions
- `/src/components/predictions/DynamicQuestion.tsx` - Question renderer
- `/src/app/rate/page.tsx` - Current rating page
- `/src/app/admin/predictions/questions/page.tsx` - Admin interface

**External Dependencies**:
- None (all required libraries already installed from US-019)

---

## Files Saved To

This preparation documentation is saved to:
**`/Users/alwinvandijken/Projects/github.com/ApexChef/Bovenkamer-events/docs/user-stories/US-020-dynamic-form-elements/PREPARE.md`**

---

**Research Date**: 2026-01-28
**Prepared By**: PACT Preparer
**Status**: ✅ Complete - Ready for Architecture Phase
