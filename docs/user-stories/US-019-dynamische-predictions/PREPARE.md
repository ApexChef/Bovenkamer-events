# US-019: Dynamische Prediction Vragen - Preparation Documentation

**Date**: 2026-01-28
**Status**: Research Complete
**Next Phase**: Architecture

---

## Executive Summary

This document provides comprehensive research for implementing US-019: Dynamic Prediction Questions. The implementation will enable admins to manage prediction questions through a CRUD interface with drag & drop ordering, replacing the current hardcoded questions in the predictions page.

**Key Findings**:
- Sheet/Drawer component already exists (Radix UI based) - perfect for sidebar editor
- No drag & drop library currently installed - recommend `@dnd-kit/core` and `@dnd-kit/sortable`
- Consistent admin patterns established across `/admin/gebruikers`, `/admin/predictions`, `/admin/registraties`
- Slider, Select, RadioGroup components available and suitable for question rendering
- API patterns use Next.js App Router with JWT-based admin authentication

**Recommended Approach**:
- Install `@dnd-kit` for drag & drop functionality
- Use existing Sheet component for sidebar editor
- Follow established admin page patterns with Card-based layout
- Reuse existing UI components for question preview and rendering

---

## 1. Existing Codebase Patterns

### 1.1 Admin Page Structure

All admin pages follow a consistent pattern:

**Location**: `/src/app/admin/[feature]/page.tsx`

**Structure**:
```tsx
export default function AdminFeaturePage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminFeatureContent />
    </AuthGuard>
  );
}

function AdminFeatureContent() {
  // State management
  // Data fetching
  // Tab/filter controls
  // Card-based layout with CardHeader, CardContent
  // Table or grid display
  // Action buttons
}
```

**Common Elements**:
- `AuthGuard` wrapper with `requireAdmin` and `requireApproved` props
- Loading states with spinner animation
- Error handling with retry button
- Tab navigation for different views
- Card components for sections
- Framer Motion animations for list items

**Examples**:
- `/admin/gebruikers` - User management with search, pagination, table view
- `/admin/predictions` - Predictions with tabs (overview, results, live, scores)
- `/admin/registraties` - Registration approval with status filters

### 1.2 Layout Pattern

```tsx
<div className="min-h-screen bg-deep-green p-4 md:p-8">
  <div className="max-w-6xl mx-auto">
    {/* Header */}
    <div className="mb-8">
      <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
        &larr; Terug naar admin dashboard
      </Link>
      <h1 className="text-4xl font-serif text-gold mb-2">Page Title</h1>
      <p className="text-cream/70">Description</p>
    </div>

    {/* Controls/Filters */}
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Search, filters, action buttons */}
      </CardContent>
    </Card>

    {/* Main Content */}
    <Card>
      <CardHeader>
        <CardTitle>Section Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  </div>
</div>
```

### 1.3 Navigation

Admin pages include back navigation to `/admin` dashboard:
```tsx
<Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
  &larr; Terug naar admin dashboard
</Link>
```

---

## 2. Available UI Components

### 2.1 Layout Components

**Card** (`/src/components/ui/Card.tsx`):
- `Card` - Container with dark wood background
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Subtitle/description
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Sheet/Drawer** (`/src/components/ui/sheet.tsx`):
- Built with Radix UI Dialog
- Supports `side` prop: `right`, `left`, `top`, `bottom` (default: `right`)
- Components: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`
- Animated slide-in/out from specified side
- Overlay background with backdrop
- **Perfect for sidebar editor requirement**

Example usage:
```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Editor Title</SheetTitle>
      <SheetDescription>Description</SheetDescription>
    </SheetHeader>
    {/* Form content */}
    <SheetFooter>
      <Button>Save</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Sidebar** (`/src/components/ui/sidebar.tsx`):
- Full sidebar navigation component (more complex than needed)
- Not recommended for this use case - use Sheet instead

### 2.2 Form Components

**Input** (`/src/components/ui/Input.tsx`):
- Standard text input with theme styling
- Props: `label`, `error`, `hint`

**Select** (`/src/components/ui/Select.tsx`):
- Dropdown with `options` array: `{ value: string, label: string }[]`
- Props: `label`, `placeholder`, `options`, `value`, `onChange`

**TextArea** (`/src/components/ui/TextArea.tsx`):
- Multi-line text input
- Props: `label`, `rows`, `error`, `hint`

**Slider** (`/src/components/ui/Slider.tsx`):
- Range input with custom styling
- Props: `label`, `hint`, `min`, `max`, `value`, `onChange`, `unit`, `formatValue`, `formatMin`, `formatMax`
- Displays current value and min/max labels
- **Perfect for rendering slider-type questions**

**RadioGroup** (`/src/components/ui/RadioGroup.tsx`):
- Radio button group
- Props: `label`, `name`, `options`, `value`, `onChange`
- Options format: `{ value: string, label: string }[]`
- **Suitable for boolean questions (Ja/Nee)**

**Checkbox** (`/src/components/ui/Checkbox.tsx`):
- Single checkbox with label

**Button** (`/src/components/ui/Button.tsx`):
- Styled button with variants: `primary`, `secondary`, `ghost`
- Sizes: `sm`, `default`
- Props: `isLoading`, `disabled`, `variant`, `size`

### 2.3 Utility Components

**ProgressSteps** (`/src/components/ui/ProgressSteps.tsx`):
- Not needed for this feature

**Separator** (`/src/components/ui/separator.tsx`):
- Horizontal/vertical divider (Radix UI)

**Skeleton** (`/src/components/ui/skeleton.tsx`):
- Loading placeholder

**Tooltip** (`/src/components/ui/tooltip.tsx`):
- Hover tooltip (Radix UI)

---

## 3. Current Predictions Implementation

### 3.1 User-Facing Page

**Location**: `/src/app/predictions/page.tsx`

**Current Implementation**:
- Hardcoded questions with specific components per type
- Uses `usePredictionsStore` from Zustand for state management
- Three categories: Consumptie, Sociaal, Overig
- Question types currently used:
  - **Slider**: `wineBottles`, `beerCrates`, `meatKilos`, `outsideTemp`, `lastGuestTime`
  - **Select (participant)**: `firstSleeper`, `spontaneousSinger`, `firstToLeave`, `lastToLeave`, `loudestLaugher`, `longestStoryTeller`
  - **RadioGroup (boolean)**: `somethingBurned`

**Data Flow**:
1. User fills predictions
2. Stored in Zustand store (`usePredictionsStore`)
3. Posted to `/api/predictions` with email + predictions object
4. Saved to `registrations` table in `predictions` JSONB column

**Key Code Patterns**:
```tsx
// Slider example
<Slider
  label="Flessen wijn"
  min={5}
  max={30}
  value={predictions.wineBottles ?? 15}
  onChange={(e) => setPrediction('wineBottles', parseInt(e.target.value))}
  unit=" flessen"
/>

// Select example
<Select
  label="Wie valt als eerste in slaap?"
  options={participants}
  placeholder="Selecteer een deelnemer"
  value={predictions.firstSleeper ?? ''}
  onChange={(e) => setPrediction('firstSleeper', e.target.value)}
/>

// RadioGroup example
<RadioGroup
  label="Wordt er iets aangebrand?"
  name="somethingBurned"
  options={[
    { value: 'true', label: 'Ja' },
    { value: 'false', label: 'Nee' },
  ]}
  value={predictions.somethingBurned === undefined ? '' : predictions.somethingBurned.toString()}
  onChange={(v) => setPrediction('somethingBurned', v === 'true')}
/>
```

### 3.2 Zustand Store

**Location**: `/src/lib/store.ts`

**Predictions Store**:
```typescript
interface PredictionsState {
  predictions: Predictions;
  setPrediction: (key: keyof Predictions, value: any) => void;
  isDraft: boolean;
  isSubmitted: boolean;
  saveDraft: () => void;
  submitFinal: () => void;
  canEdit: () => boolean;
}
```

**Storage**: Persisted to localStorage with key `bovenkamer-predictions`

### 3.3 Types

**Location**: `/src/types/index.ts`

**Current Predictions Interface**:
```typescript
export interface Predictions {
  wineBottles?: number;
  beerCrates?: number;
  meatKilos?: number;
  firstSleeper?: string;
  spontaneousSinger?: string;
  firstToLeave?: string;
  lastToLeave?: string;
  loudestLaugher?: string;
  longestStoryTeller?: string;
  somethingBurned?: boolean;
  outsideTemp?: number;
  lastGuestTime?: number; // Slider value: 0=19:00, 22=06:00
}
```

**Note**: This will need to be replaced with a dynamic structure based on question keys from database.

---

## 4. Admin Predictions Page

**Location**: `/src/app/admin/predictions/page.tsx`

**Current Features**:
- Tab navigation: Overview, Results (Uitkomsten), Live Mode, Scores (Punten)
- **Overview**: Shows all user predictions in table format
- **Results**: Form to enter actual outcomes
- **Live Mode**: Quick-entry cards for live updates during event
- **Scores**: Calculate and award points

**Relevant Patterns**:
- Uses same hardcoded `PREDICTION_LABELS` mapping
- Fetches actual results from `/api/admin/predictions/results`
- Displays predictions in table with `formatValue()` helper
- Points calculation logic in `/api/admin/predictions/calculate`

**Impact on US-019**:
- Results entry form will need to adapt to dynamic questions
- Points calculation logic must read from `prediction_questions` table for point values
- Overview table will need to dynamically generate columns

---

## 5. API Patterns

### 5.1 Route Structure

**Admin Routes**: `/src/app/api/admin/[resource]/route.ts`

**Naming Convention**:
- `route.ts` for collection operations (GET list, POST create)
- `[id]/route.ts` for item operations (GET one, PATCH update, DELETE)
- `[id]/[action]/route.ts` for specific actions (approve, reject, etc.)

### 5.2 Authentication Pattern

All admin API routes follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Admin toegang vereist',
        },
        { status: 403 }
      );
    }

    // Business logic
    const supabase = createServerClient();
    const { data, error } = await supabase.from('table').select('*');

    if (error) {
      console.error('Error:', error);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Foutmelding' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
```

### 5.3 Pagination Pattern

Used in `/api/admin/users`:

```typescript
const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

const from = (page - 1) * limit;
const to = from + limit - 1;

let query = supabase
  .from('users')
  .select('*', { count: 'exact' })
  .range(from, to)
  .order('created_at', { ascending: false });

const { data, error, count } = await query;

// Return with pagination metadata
return NextResponse.json({
  data,
  pagination: {
    page,
    limit,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  },
});
```

### 5.4 CRUD Examples

**GET Collection** (from `/api/admin/users/route.ts`):
- Search/filter support
- Pagination
- Count aggregation

**PATCH Single Item** (from `/api/admin/users/[id]/role/route.ts`):
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { data, error } = await supabase
    .from('users')
    .update({ role: body.role })
    .eq('id', params.id)
    .select()
    .single();
}
```

**DELETE** (soft delete pattern):
- Set `is_active = false` or `deleted_at = NOW()`
- Store `deleted_by` user ID
- Optional `deletion_reason`

---

## 6. Database & Supabase Patterns

### 6.1 Client Initialization

**Client-side**: `import { supabase } from '@/lib/supabase'`
**Server-side**: `const supabase = createServerClient()`

Uses environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` (server only)

### 6.2 Query Patterns

**Select with Relations**:
```typescript
const { data, error } = await supabase
  .from('users')
  .select(`
    id,
    name,
    registrations (
      id,
      has_partner
    )
  `);
```

**Insert**:
```typescript
const { data, error } = await supabase
  .from('table')
  .insert({ field: 'value' })
  .select()
  .single();
```

**Update**:
```typescript
const { data, error } = await supabase
  .from('table')
  .update({ field: 'value' })
  .eq('id', id)
  .select()
  .single();
```

**Delete** (soft):
```typescript
const { error } = await supabase
  .from('table')
  .update({ is_active: false, deleted_at: new Date().toISOString() })
  .eq('id', id);
```

### 6.3 RLS (Row Level Security)

Based on existing tables, RLS policies should:
- Allow public read for `is_active = true` records (for public API)
- Restrict write operations to authenticated admins only

**Example RLS Pattern**:
```sql
-- Public read for active questions
CREATE POLICY "Anyone can view active questions"
  ON prediction_questions FOR SELECT
  USING (is_active = true);

-- Admin-only write
CREATE POLICY "Only admins can manage questions"
  ON prediction_questions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 7. Required New Components

### 7.1 Drag & Drop Implementation

**No existing library** - Need to install:

**Recommended**: `@dnd-kit` (modern, React 18 compatible, TypeScript support)

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Rationale**:
- Actively maintained (last update: 2024)
- Better performance than `react-beautiful-dnd`
- Excellent TypeScript support
- Accessible by default
- Smaller bundle size
- Used by Vercel, Stripe, etc.

**Basic Usage Pattern**:
```tsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
function SortableItem({ id, question }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="flex items-center gap-2">
        <div className="cursor-grab">☰</div>
        <div>{question.label}</div>
      </div>
    </div>
  );
}

// Container Component
function QuestionList({ questions, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // Calculate new order and call onReorder
    }
  };

  return (
    <DndContext sensors={sensors} collapsibleBy={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
        {questions.map(q => <SortableItem key={q.id} id={q.id} question={q} />)}
      </SortableContext>
    </DndContext>
  );
}
```

### 7.2 Emoji Picker

**Requirement**: Select emoji for `select_options` type questions (screenshot shows grouped emoji picker)

**Options**:
1. **Custom Simple Picker**: Predefined emoji groups (recommended for MVP)
2. **Library**: `emoji-picker-react` (if more flexibility needed)

**Recommended Approach (Simple)**:
```tsx
const EMOJI_GROUPS = {
  food: ['🍖', '🥩', '🍗', '🐟', '🥬', '🧀', '🍞', '🥗'],
  animals: ['🐷', '🐄', '🐔', '🐑', '🦌', '🐟', '🦐', '🦞'],
  drinks: ['🍷', '🍺', '🥂', '🍾', '☕', '🧃', '🥤'],
  misc: ['✅', '❌', '🔥', '❄️', '☀️', '🌧️', '⏰', '🎵'],
};

function EmojiPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
        <div key={group}>
          <p className="text-xs text-cream/60 mb-1">{group}</p>
          {emojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => onChange(emoji)}
              className={`text-2xl hover:scale-110 transition ${value === emoji ? 'bg-gold/20 rounded' : ''}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

**If using library** (optional):
```bash
npm install emoji-picker-react
```

### 7.3 Question Preview Component

**Purpose**: Show real-time preview of how question will appear to users

**Implementation**:
```tsx
function QuestionPreview({ question }: { question: PredictionQuestion }) {
  switch (question.type) {
    case 'slider':
      return (
        <Slider
          label={question.label}
          min={question.options.min}
          max={question.options.max}
          value={question.options.default || question.options.min}
          unit={question.options.unit}
          hint={question.options.hint}
          disabled
        />
      );

    case 'select_participant':
      return (
        <Select
          label={question.label}
          options={[{ value: 'participant1', label: 'Voorbeeld Deelnemer' }]}
          disabled
        />
      );

    case 'boolean':
      return (
        <RadioGroup
          label={question.label}
          name="preview"
          options={[
            { value: 'true', label: question.options.trueLabel || 'Ja' },
            { value: 'false', label: question.options.falseLabel || 'Nee' },
          ]}
          disabled
        />
      );

    case 'time':
      return (
        <Slider
          label={question.label}
          min={0}
          max={22}
          value={question.options.default || 10}
          formatValue={(v) => {
            const hour = 19 + Math.floor(v / 2);
            const min = (v % 2) * 30;
            return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          }}
          disabled
        />
      );

    case 'select_options':
      return (
        <Select
          label={question.label}
          options={question.options.choices || []}
          disabled
        />
      );

    default:
      return <p className="text-cream/50">Onbekend vraagtype</p>;
  }
}
```

---

## 8. Dependencies Summary

### 8.1 Existing Dependencies (Already Installed)

✅ **Next.js 14** (App Router) - Framework
✅ **React 18.2** - UI library
✅ **TypeScript 5.3** - Type safety
✅ **Tailwind CSS 3.4** - Styling
✅ **Framer Motion 12.26** - Animations
✅ **Zustand 5.0** - State management
✅ **@radix-ui/react-dialog** - Sheet/Drawer component
✅ **@radix-ui/react-tooltip** - Tooltips
✅ **@supabase/supabase-js** - Database client
✅ **lucide-react** - Icons
✅ **class-variance-authority** - Component variants
✅ **clsx + tailwind-merge** - Utility for className merging

### 8.2 Required New Dependencies

**Drag & Drop**:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Emoji Picker** (Optional - can build simple custom):
```bash
npm install emoji-picker-react  # Only if custom solution not sufficient
```

### 8.3 No Additional Dependencies Needed

- Form validation: Can use native HTML5 + React state
- UUID generation: Use `crypto.randomUUID()` (native)
- Date handling: Use native `Date` API
- HTTP client: Use native `fetch`

---

## 9. Database Schema Considerations

### 9.1 Existing Schema (from US-019 README)

```sql
CREATE TABLE prediction_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Question configuration
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,

  -- Type-specific options (JSONB)
  options JSONB DEFAULT '{}',

  -- Points
  points_exact INTEGER DEFAULT 50,
  points_close INTEGER DEFAULT 25,
  points_direction INTEGER DEFAULT 10,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.2 JSONB Options Structure

**For `slider` type**:
```json
{
  "min": 5,
  "max": 30,
  "unit": " flessen",
  "hint": "~20 personen = 15",
  "default": 15
}
```

**For `select_options` type**:
```json
{
  "choices": [
    { "value": "pork", "label": "Varken", "emoji": "🐷" },
    { "value": "beef", "label": "Rund", "emoji": "🐄" }
  ]
}
```

**For `time` type**:
```json
{
  "minHour": 19,
  "maxHour": 6,
  "default": 10
}
```

**For `boolean` type**:
```json
{
  "trueLabel": "Ja",
  "falseLabel": "Nee",
  "trueEmoji": "✅",
  "falseEmoji": "❌"
}
```

### 9.3 Migration Considerations

**Existing Predictions Data**:
- Currently stored in `registrations.predictions` JSONB column
- Keys like `wineBottles`, `firstSleeper`, etc.
- Migration strategy: Keep keys consistent when creating questions from seed data
- Ensure backward compatibility during transition

**Seed Questions**:
- Create migration script to populate initial questions
- Use existing hardcoded questions as template
- Assign appropriate `sort_order` per category

---

## 10. API Endpoints Design

### 10.1 Required Endpoints (from US-019)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/admin/prediction-questions` | GET | List all questions (admin view) | Admin |
| `/api/admin/prediction-questions` | POST | Create new question | Admin |
| `/api/admin/prediction-questions/[id]` | PATCH | Update question | Admin |
| `/api/admin/prediction-questions/[id]` | DELETE | Soft delete question | Admin |
| `/api/admin/prediction-questions/reorder` | POST | Update sort_order for multiple | Admin |
| `/api/prediction-questions` | GET | Get active questions (public) | None |

### 10.2 Response Formats

**GET `/api/admin/prediction-questions`**:
```json
{
  "questions": [
    {
      "id": "uuid",
      "key": "wineBottles",
      "label": "Flessen wijn",
      "type": "slider",
      "category": "consumption",
      "options": { "min": 5, "max": 30, "unit": " flessen" },
      "points_exact": 50,
      "points_close": 25,
      "points_direction": 10,
      "is_active": true,
      "sort_order": 0,
      "created_at": "2026-01-28T...",
      "updated_at": "2026-01-28T..."
    }
  ],
  "stats": {
    "total": 12,
    "active": 10,
    "byCategory": {
      "consumption": 3,
      "social": 6,
      "other": 3
    }
  }
}
```

**POST `/api/admin/prediction-questions`**:
```json
{
  "key": "wineBottles",
  "label": "Flessen wijn",
  "type": "slider",
  "category": "consumption",
  "options": { "min": 5, "max": 30, "unit": " flessen", "default": 15 },
  "points_exact": 50,
  "points_close": 25,
  "points_direction": 10
}
```

**POST `/api/admin/prediction-questions/reorder`**:
```json
{
  "questions": [
    { "id": "uuid1", "sort_order": 0 },
    { "id": "uuid2", "sort_order": 1 },
    { "id": "uuid3", "sort_order": 2 }
  ]
}
```

**GET `/api/prediction-questions`** (public):
```json
{
  "questions": [
    {
      "id": "uuid",
      "key": "wineBottles",
      "label": "Flessen wijn",
      "type": "slider",
      "category": "consumption",
      "options": { "min": 5, "max": 30, "unit": " flessen", "default": 15 }
    }
  ]
}
```

Note: Public endpoint excludes `points_*`, `is_active`, and admin metadata.

---

## 11. Technical Constraints & Considerations

### 11.1 Performance

**Drag & Drop**:
- List size: ~12 questions per category (max ~36 total)
- Performance: Should be negligible with `@dnd-kit`

**Database Queries**:
- Add index on `sort_order` and `category` for efficient ordering
- Cache active questions on client-side for predictions page

**Optimistic Updates**:
- Use optimistic UI updates for drag & drop reordering
- Fallback to previous state on error

### 11.2 Validation

**Frontend**:
- Required fields: `key`, `label`, `type`, `category`
- Key format: lowercase, no spaces, alphanumeric + underscore
- Type-specific validation for options
- Duplicate key check (real-time)

**Backend**:
- Duplicate key validation (database unique constraint)
- Type validation against allowed types
- Category validation against fixed categories
- Options JSONB validation per type

### 11.3 Error Handling

**API Errors**:
- `DUPLICATE_KEY`: Key already exists
- `INVALID_TYPE`: Unknown question type
- `INVALID_CATEGORY`: Invalid category
- `INVALID_OPTIONS`: Options don't match type requirements
- `QUESTION_IN_USE`: Cannot delete question with existing answers

**Frontend**:
- Show error messages inline in Sheet editor
- Confirm dialog before deleting questions
- Warn if question has existing answers

### 11.4 Security

**Admin Only**:
- All write operations require admin role
- JWT validation on every request
- RLS policies on database

**Input Sanitization**:
- Escape user input in labels
- Validate JSONB structure
- Prevent XSS in emoji picker

### 11.5 Backward Compatibility

**Migration Strategy**:
1. Create `prediction_questions` table
2. Seed with existing hardcoded questions (keep same keys)
3. Update predictions page to fetch from API
4. Keep Zustand store structure compatible
5. Update admin results page to read points from questions table
6. Deploy in phases: DB → API → Frontend

**Existing Data**:
- All existing user predictions use current keys
- Seeded questions must use same keys
- Future questions can use any valid key

---

## 12. Testing Considerations

### 12.1 Unit Tests

**Components to Test**:
- Question preview component (all types render correctly)
- Drag & drop reordering logic
- Form validation logic
- Type-specific option validation

**API Routes to Test**:
- CRUD operations
- Admin authentication
- Validation rules
- Reorder endpoint

### 12.2 Integration Tests

**User Flows**:
- Create new question → appears in list
- Edit question → preview updates
- Reorder questions → saves correctly
- Toggle active status → affects public API
- Delete question → soft delete, not in public API

**Admin Flows**:
- View predictions page with dynamic questions
- Enter results for dynamic questions
- Calculate points using dynamic point values

### 12.3 E2E Tests (Playwright)

**Critical Paths**:
- Admin creates slider question → user sees it on predictions page
- Admin reorders questions → user sees new order
- User submits predictions → admin sees results
- Admin enters actual results → points calculated correctly

---

## 13. UI/UX Recommendations

### 13.1 Sidebar Editor

**Width**: `sm:max-w-sm` (default Sheet width) or custom `sm:max-w-lg` for more space

**Sections**:
1. **Question Type** (top) - Dropdown to select type
2. **Basic Info** - Key, Label, Category
3. **Type-Specific Options** - Conditional fields based on type
4. **Points Configuration** - Exact, Close, Direction
5. **Preview** - Live preview at bottom
6. **Actions** - Delete (left), Save (right)

**Behavior**:
- Auto-save draft to localStorage while editing
- Confirm before closing with unsaved changes
- Show validation errors inline
- Disable save button until valid

### 13.2 Main Question List

**Layout**:
- Group by category (Consumptie, Sociaal, Overig)
- Each category in own Card
- Drag handle on left (☰ icon)
- Question label in middle
- Type badge + answer count
- Active toggle + Edit button on right

**Visual Feedback**:
- Highlight row on hover
- Show drag placeholder while dragging
- Animate item movements
- Badge color: green = active, gray = inactive

### 13.3 Mobile Responsiveness

**Drag & Drop**:
- Use `PointerSensor` from `@dnd-kit` (works on touch)
- Increase touch target size on mobile
- Visual feedback for touch drag

**Sidebar**:
- Full screen on mobile
- Scrollable content area
- Fixed header and footer

**Question List**:
- Stack info vertically on mobile
- Larger touch targets for buttons
- Simplified view (hide less important info)

---

## 14. Recommended Implementation Order

### Phase 1: Foundation
1. Install `@dnd-kit` dependencies
2. Create TypeScript types for `PredictionQuestion`
3. Seed existing questions to database (already completed)
4. Create admin API endpoints (GET, POST, PATCH, DELETE, reorder)
5. Create public API endpoint (GET active questions)

### Phase 2: Admin UI
6. Create admin page `/admin/predictions/questions`
7. Implement question list with category grouping
8. Add drag & drop reordering
9. Create Sheet sidebar editor component
10. Implement type-specific form fields
11. Add question preview component
12. Implement CRUD actions

### Phase 3: User-Facing
13. Update predictions page to fetch from API
14. Refactor prediction rendering to be dynamic
15. Update Zustand store to work with dynamic keys
16. Test with existing user data

### Phase 4: Admin Updates
17. Update `/admin/predictions` results form to be dynamic
18. Update points calculation to read from questions table
19. Add statistics (answer counts per question)

### Phase 5: Polish
20. Add validation and error handling
21. Implement confirmation dialogs
22. Add loading states and animations
23. Write tests
24. Documentation

---

## 15. File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── predictions/
│   │       ├── questions/
│   │       │   └── page.tsx              # NEW: Admin question management
│   │       └── page.tsx                  # UPDATE: Dynamic results form
│   ├── predictions/
│   │   └── page.tsx                      # UPDATE: Dynamic question rendering
│   └── api/
│       ├── admin/
│       │   └── prediction-questions/
│       │       ├── route.ts              # NEW: GET list, POST create
│       │       ├── [id]/
│       │       │   └── route.ts          # NEW: PATCH update, DELETE
│       │       └── reorder/
│       │           └── route.ts          # NEW: POST reorder
│       └── prediction-questions/
│           └── route.ts                  # NEW: GET active (public)
│
├── components/
│   ├── admin/
│   │   └── predictions/
│   │       ├── QuestionList.tsx          # NEW: Draggable list with categories
│   │       ├── QuestionEditor.tsx        # NEW: Sheet sidebar editor
│   │       ├── QuestionPreview.tsx       # NEW: Preview component
│   │       └── TypeSpecificFields.tsx    # NEW: Conditional fields per type
│   └── predictions/
│       └── DynamicQuestion.tsx           # NEW: Render question by type
│
├── lib/
│   └── predictions/
│       ├── validation.ts                 # NEW: Validation helpers
│       └── types.ts                      # NEW: Question type guards
│
└── types/
    └── index.ts                          # UPDATE: Add PredictionQuestion type
```

---

## 16. Next Steps for Architect

The Architect should focus on:

1. **Database Schema Refinement**
   - Confirm JSONB structure for each question type
   - Design indexes for performance
   - Define RLS policies

2. **API Contract Definition**
   - Finalize request/response formats
   - Error code standardization
   - Reorder endpoint algorithm

3. **State Management Strategy**
   - How to handle dynamic prediction keys in Zustand
   - LocalStorage migration strategy
   - Cache invalidation for active questions

4. **Type System Design**
   - TypeScript interfaces for all question types
   - Type guards for runtime validation
   - Options type discrimination

5. **Migration Path**
   - Deployment sequence (DB → API → Frontend)
   - Rollback strategy
   - Data validation scripts

6. **Component Architecture**
   - QuestionEditor component structure
   - Form state management (controlled vs. uncontrolled)
   - Preview update strategy (debounced or real-time)

7. **Drag & Drop Implementation Details**
   - Sensor configuration
   - Collision detection algorithm
   - Reorder API call strategy (optimistic vs. pessimistic)

---

## Files Saved To

This preparation documentation is saved to:
**`/Users/alwinvandijken/Projects/github.com/ApexChef/Bovenkamer-events/docs/user-stories/US-019-dynamische-predictions/PREPARE.md`**

---

**Research Date**: 2026-01-28
**Prepared By**: PACT Preparer
**Status**: ✅ Complete - Ready for Architecture Phase
