# US-019: Dynamische Prediction Vragen - Architecture Document

**Date**: 2026-01-28
**Status**: Architecture Complete - Ready for Implementation
**Previous Phase**: [Preparation](./PREPARE.md)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [TypeScript Type System](#typescript-type-system)
4. [Component Architecture](#component-architecture)
5. [API Specifications](#api-specifications)
6. [State Management](#state-management)
7. [Database Schema & Migration](#database-schema--migration)
8. [Implementation Details](#implementation-details)
9. [File Structure](#file-structure)
10. [Validation & Error Handling](#validation--error-handling)
11. [Security Considerations](#security-considerations)
12. [Migration Strategy](#migration-strategy)
13. [Testing Strategy](#testing-strategy)
14. [Deployment Considerations](#deployment-considerations)

---

## Executive Summary

### Architectural Goals

This architecture enables dynamic management of prediction questions through an admin interface, replacing the current hardcoded questions. The design prioritizes:

1. **Backward Compatibility**: Existing user predictions remain functional
2. **Type Safety**: Full TypeScript coverage with runtime validation
3. **Flexibility**: Support for multiple question types with extensible options
4. **User Experience**: Drag & drop reordering, real-time preview, inline editing
5. **Performance**: Optimistic updates, client-side caching, minimal re-renders

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Drag & Drop** | @dnd-kit | Modern, performant, TypeScript-native, accessible |
| **Editor UI** | Sheet (Radix Dialog) | Already installed, consistent with existing patterns |
| **Emoji Picker** | Custom dropdown | Simple, controlled, no extra dependencies |
| **State Management** | Zustand with dynamic keys | Compatible with existing localStorage, type-safe |
| **API Pattern** | Next.js App Router | Consistent with existing admin endpoints |
| **Validation** | Runtime + Zod schemas | Type-safe validation on client and server |
| **Time Input** | Slider (0-22) | Reuses existing Slider component, consistent UX |

### Technology Stack

**New Dependencies**:
```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "zod": "^3.22.4"
}
```

**Existing Dependencies** (Leveraged):
- Next.js 14 (App Router)
- TypeScript 5.3
- Zustand 5.0
- Radix UI (Sheet/Dialog)
- Framer Motion
- Tailwind CSS

---

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      ADMIN INTERFACE                         │
│  /admin/predictions/questions                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐    ┌──────────────────────────────┐    │
│  │ QuestionList   │───▶│  QuestionEditor (Sheet)      │    │
│  │ - Categories   │    │  - Type Selection            │    │
│  │ - Drag & Drop  │    │  - Basic Fields              │    │
│  │ - Stats        │    │  - Type-Specific Options     │    │
│  │ - Active Toggle│    │  - Points Configuration      │    │
│  └────────────────┘    │  - Live Preview              │    │
│         │              └──────────────────────────────┘    │
│         │                           │                       │
│         └───────────┬───────────────┘                       │
│                     ▼                                       │
│         ┌─────────────────────────┐                        │
│         │  Admin API Layer        │                        │
│         │  /api/admin/prediction- │                        │
│         │  questions/*            │                        │
│         └─────────────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
│  prediction_questions table (PostgreSQL/Supabase)           │
│  - CRUD operations                                           │
│  - RLS policies (admin write, public read active)           │
│  - Sort order management                                     │
└──────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                    PUBLIC API LAYER                          │
│  /api/prediction-questions (GET active)                     │
└──────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                  USER-FACING INTERFACE                       │
│  /predictions                                                │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐    │
│  │  DynamicQuestionRenderer                           │    │
│  │  - Fetches active questions                        │    │
│  │  - Renders by type (slider, select, boolean, etc) │    │
│  │  - Stores answers in Zustand with dynamic keys    │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

**Admin Creates/Updates Question**:
```
1. Admin opens Sheet editor
2. Fills form with question details
3. Preview updates in real-time (local state)
4. On Save: POST/PATCH to /api/admin/prediction-questions
5. Database updated via Supabase
6. List re-fetches and updates (optimistic UI)
7. Public API automatically includes new active question
```

**User Answers Predictions**:
```
1. User visits /predictions
2. Fetch active questions from /api/prediction-questions
3. Render questions dynamically by type
4. User fills predictions
5. Store in Zustand: predictions[question.key] = value
6. On submit: POST to /api/predictions with all answers
7. Save to registrations.predictions JSONB column
```

**Admin Drag & Drop Reorder**:
```
1. Admin drags question to new position
2. Local state updates immediately (optimistic)
3. Calculate new sort_order values for affected questions
4. POST to /api/admin/prediction-questions/reorder
5. Update multiple questions in single transaction
6. On error: Rollback to previous order
```

---

## TypeScript Type System

### Core Question Types

**Location**: `src/types/index.ts`

```typescript
// ============================================================================
// PREDICTION QUESTION TYPES (US-019)
// ============================================================================

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
  key: string; // Unique identifier for storing answers
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

/**
 * Options for slider-type questions
 */
export interface SliderOptions {
  type: 'slider';
  min: number;
  max: number;
  unit: string; // e.g., " flessen", "°C", " kg"
  hint?: string; // e.g., "~20 personen = 15"
  default?: number;
}

/**
 * Options for select_participant type (no specific options needed)
 */
export interface SelectParticipantOptions {
  type: 'select_participant';
}

/**
 * Options for boolean (yes/no) questions
 */
export interface BooleanOptions {
  type: 'boolean';
  trueLabel?: string; // Default: "Ja"
  falseLabel?: string; // Default: "Nee"
  trueEmoji?: string; // Default: "✅"
  falseEmoji?: string; // Default: "❌"
}

/**
 * Options for time selection questions
 * Uses slider internally (0 = 19:00, 22 = 06:00, half-hour increments)
 */
export interface TimeOptions {
  type: 'time';
  minHour: number; // Default: 19
  maxHour: number; // Default: 6 (next day)
  default?: number; // Slider value (0-22)
}

/**
 * Options for select with custom choices
 */
export interface SelectOptionsOptions {
  type: 'select_options';
  choices: SelectChoice[];
}

/**
 * Individual choice for select_options type
 */
export interface SelectChoice {
  value: string; // Internal value
  label: string; // Display text
  emoji?: string; // Optional emoji prefix
}

/**
 * Type guard: Check if options are for slider
 */
export function isSliderOptions(options: PredictionQuestionOptions): options is SliderOptions {
  return options.type === 'slider';
}

/**
 * Type guard: Check if options are for select_participant
 */
export function isSelectParticipantOptions(
  options: PredictionQuestionOptions
): options is SelectParticipantOptions {
  return options.type === 'select_participant';
}

/**
 * Type guard: Check if options are for boolean
 */
export function isBooleanOptions(options: PredictionQuestionOptions): options is BooleanOptions {
  return options.type === 'boolean';
}

/**
 * Type guard: Check if options are for time
 */
export function isTimeOptions(options: PredictionQuestionOptions): options is TimeOptions {
  return options.type === 'time';
}

/**
 * Type guard: Check if options are for select_options
 */
export function isSelectOptionsOptions(
  options: PredictionQuestionOptions
): options is SelectOptionsOptions {
  return options.type === 'select_options';
}

/**
 * New prediction structure (replaces hardcoded Predictions interface)
 * Now uses dynamic keys based on question configuration
 */
export interface DynamicPredictions {
  [key: string]: string | number | boolean | undefined;
}

/**
 * DEPRECATED: Legacy hardcoded predictions interface
 * Keep for backward compatibility during migration
 * @deprecated Use DynamicPredictions instead
 */
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
  lastGuestTime?: number;
}
```

### API Types

**Location**: `src/types/api.ts` (NEW FILE)

```typescript
/**
 * API request/response types for prediction questions
 */

import { PredictionQuestion, PredictionCategory } from './index';

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Create new prediction question
 */
export interface CreatePredictionQuestionRequest {
  key: string;
  label: string;
  type: PredictionQuestion['type'];
  category: PredictionCategory;
  options: PredictionQuestion['options'];
  points_exact?: number; // Optional, defaults to 50
  points_close?: number; // Optional, defaults to 25
  points_direction?: number; // Optional, defaults to 10
}

/**
 * Update existing prediction question
 */
export interface UpdatePredictionQuestionRequest {
  label?: string;
  type?: PredictionQuestion['type'];
  category?: PredictionCategory;
  options?: PredictionQuestion['options'];
  points_exact?: number;
  points_close?: number;
  points_direction?: number;
  is_active?: boolean;
}

/**
 * Reorder questions
 */
export interface ReorderQuestionsRequest {
  questions: Array<{
    id: string;
    sort_order: number;
  }>;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Admin list response with statistics
 */
export interface AdminQuestionsListResponse {
  questions: PredictionQuestion[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<PredictionCategory, number>;
    answerCounts: Record<string, number>; // question.id -> count of answers
  };
}

/**
 * Public list response (active questions only, minimal fields)
 */
export interface PublicQuestionsListResponse {
  questions: Array<{
    id: string;
    key: string;
    label: string;
    type: PredictionQuestion['type'];
    category: PredictionCategory;
    options: PredictionQuestion['options'];
  }>;
}

/**
 * Single question response
 */
export interface QuestionResponse {
  question: PredictionQuestion;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, string[]>; // Validation errors
}

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_CATEGORY: 'INVALID_CATEGORY',
  INVALID_OPTIONS: 'INVALID_OPTIONS',

  // Business logic
  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  QUESTION_IN_USE: 'QUESTION_IN_USE',
  CANNOT_DELETE_ACTIVE: 'CANNOT_DELETE_ACTIVE',

  // Server
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
```

### Validation Schemas (Zod)

**Location**: `src/lib/predictions/validation.ts` (NEW FILE)

```typescript
import { z } from 'zod';

/**
 * Zod schemas for runtime validation of prediction questions
 */

// Question types
export const questionTypeSchema = z.enum([
  'slider',
  'select_participant',
  'boolean',
  'time',
  'select_options',
]);

// Categories
export const categorySchema = z.enum(['consumption', 'social', 'other']);

// Options schemas
export const sliderOptionsSchema = z.object({
  type: z.literal('slider'),
  min: z.number().int(),
  max: z.number().int(),
  unit: z.string().max(10),
  hint: z.string().max(100).optional(),
  default: z.number().int().optional(),
});

export const selectParticipantOptionsSchema = z.object({
  type: z.literal('select_participant'),
});

export const booleanOptionsSchema = z.object({
  type: z.literal('boolean'),
  trueLabel: z.string().max(20).optional(),
  falseLabel: z.string().max(20).optional(),
  trueEmoji: z.string().max(5).optional(),
  falseEmoji: z.string().max(5).optional(),
});

export const timeOptionsSchema = z.object({
  type: z.literal('time'),
  minHour: z.number().int().min(0).max(23),
  maxHour: z.number().int().min(0).max(23),
  default: z.number().int().min(0).max(22).optional(),
});

export const selectChoiceSchema = z.object({
  value: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  emoji: z.string().max(5).optional(),
});

export const selectOptionsOptionsSchema = z.object({
  type: z.literal('select_options'),
  choices: z.array(selectChoiceSchema).min(2).max(20),
});

// Union of all options schemas
export const questionOptionsSchema = z.discriminatedUnion('type', [
  sliderOptionsSchema,
  selectParticipantOptionsSchema,
  booleanOptionsSchema,
  timeOptionsSchema,
  selectOptionsOptionsSchema,
]);

// Key validation: lowercase, no spaces, alphanumeric + underscore
export const questionKeySchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z][a-z0-9_]*$/, {
    message: 'Key must start with lowercase letter and contain only lowercase letters, numbers, and underscores',
  });

// Full question validation
export const createQuestionSchema = z.object({
  key: questionKeySchema,
  label: z.string().min(3).max(200),
  type: questionTypeSchema,
  category: categorySchema,
  options: questionOptionsSchema,
  points_exact: z.number().int().min(0).max(200).default(50),
  points_close: z.number().int().min(0).max(200).default(25),
  points_direction: z.number().int().min(0).max(200).default(10),
});

export const updateQuestionSchema = z.object({
  label: z.string().min(3).max(200).optional(),
  type: questionTypeSchema.optional(),
  category: categorySchema.optional(),
  options: questionOptionsSchema.optional(),
  points_exact: z.number().int().min(0).max(200).optional(),
  points_close: z.number().int().min(0).max(200).optional(),
  points_direction: z.number().int().min(0).max(200).optional(),
  is_active: z.boolean().optional(),
});

export const reorderQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    })
  ),
});

/**
 * Validate options match the specified type
 */
export function validateOptionsForType(type: string, options: unknown): boolean {
  try {
    switch (type) {
      case 'slider':
        sliderOptionsSchema.parse(options);
        return true;
      case 'select_participant':
        selectParticipantOptionsSchema.parse(options);
        return true;
      case 'boolean':
        booleanOptionsSchema.parse(options);
        return true;
      case 'time':
        timeOptionsSchema.parse(options);
        return true;
      case 'select_options':
        selectOptionsOptionsSchema.parse(options);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}
```

---

## Component Architecture

### Admin Components

#### 1. QuestionList Component

**Location**: `src/components/admin/predictions/QuestionList.tsx`

**Purpose**: Display all questions grouped by category with drag & drop ordering

**Props**:
```typescript
interface QuestionListProps {
  onEdit: (question: PredictionQuestion) => void;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onReorder: (questions: PredictionQuestion[]) => Promise<void>;
}
```

**Features**:
- Groups questions by category (Consumptie, Sociaal, Overig)
- Drag & drop within and between categories
- Active/inactive toggle
- Edit button opens QuestionEditor
- Shows answer count per question
- Visual feedback during drag
- Optimistic updates for reordering

**Component Structure**:
```tsx
<div className="space-y-6">
  {/* Category: Consumption */}
  <Card>
    <CardHeader>
      <CardTitle>Consumptie</CardTitle>
    </CardHeader>
    <CardContent>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={consumptionQuestions} strategy={verticalListSortingStrategy}>
          {consumptionQuestions.map(q => (
            <SortableQuestionItem
              key={q.id}
              question={q}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
            />
          ))}
        </SortableContext>
      </DndContext>
    </CardContent>
  </Card>

  {/* Category: Social */}
  {/* ... similar structure ... */}

  {/* Category: Other */}
  {/* ... similar structure ... */}
</div>
```

**Drag & Drop Implementation**:
```typescript
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sensor configuration
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px movement required to start drag
    },
  })
);

// Handle drag end
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const oldIndex = questions.findIndex(q => q.id === active.id);
  const newIndex = questions.findIndex(q => q.id === over.id);

  // Calculate new order
  const reordered = arrayMove(questions, oldIndex, newIndex);

  // Update sort_order values
  const updates = reordered.map((q, index) => ({
    ...q,
    sort_order: index * 10, // Gaps of 10 allow future insertions
  }));

  // Optimistic update
  setQuestions(updates);

  // Persist to server
  onReorder(updates).catch(() => {
    // Rollback on error
    setQuestions(questions);
  });
};
```

#### 2. SortableQuestionItem Component

**Location**: `src/components/admin/predictions/SortableQuestionItem.tsx`

**Purpose**: Individual question row with drag handle

**Props**:
```typescript
interface SortableQuestionItemProps {
  question: PredictionQuestion;
  onEdit: (question: PredictionQuestion) => void;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}
```

**Component Structure**:
```tsx
function SortableQuestionItem({ question, onEdit, onToggleActive }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-dark-wood/50 rounded-lg",
        "hover:bg-dark-wood/70 transition-colors",
        isDragging && "opacity-50 shadow-xl"
      )}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-cream/40" />
      </div>

      {/* Question Info */}
      <div className="flex-1">
        <p className="text-cream font-medium">{question.label}</p>
        <p className="text-cream/50 text-sm">
          {getTypeLabel(question.type)} • {getAnswerCount(question.id)} antwoorden
        </p>
      </div>

      {/* Active Toggle */}
      <Switch
        checked={question.is_active}
        onCheckedChange={(checked) => onToggleActive(question.id, checked)}
      />

      {/* Edit Button */}
      <Button variant="ghost" size="sm" onClick={() => onEdit(question)}>
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

#### 3. QuestionEditor Component (Sheet Sidebar)

**Location**: `src/components/admin/predictions/QuestionEditor.tsx`

**Purpose**: Sidebar form for creating/editing questions

**Props**:
```typescript
interface QuestionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: PredictionQuestion | null; // null = create new, otherwise edit
  onSave: (question: CreatePredictionQuestionRequest | UpdatePredictionQuestionRequest) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}
```

**State Management**:
```typescript
interface EditorState {
  key: string;
  label: string;
  type: PredictionQuestionType;
  category: PredictionCategory;
  options: PredictionQuestionOptions;
  points_exact: number;
  points_close: number;
  points_direction: number;
  errors: Record<string, string>;
}
```

**Component Structure**:
```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
    <SheetHeader>
      <SheetTitle>{question ? 'Vraag Bewerken' : 'Nieuwe Vraag'}</SheetTitle>
      <SheetDescription>
        {question ? 'Pas de vraag aan' : 'Voeg een nieuwe voorspelling toe'}
      </SheetDescription>
    </SheetHeader>

    <div className="space-y-6 py-6">
      {/* Basic Fields */}
      <div className="space-y-4">
        <Select
          label="Type"
          value={formState.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          options={TYPE_OPTIONS}
        />

        <Select
          label="Categorie"
          value={formState.category}
          onChange={(e) => setFormState({ ...formState, category: e.target.value })}
          options={CATEGORY_OPTIONS}
        />

        <Input
          label="Key"
          value={formState.key}
          onChange={(e) => setFormState({ ...formState, key: e.target.value })}
          error={formState.errors.key}
          hint="Unieke identifier (bijv. wineBottles)"
          disabled={!!question} // Cannot change key on edit
        />

        <Input
          label="Label"
          value={formState.label}
          onChange={(e) => setFormState({ ...formState, label: e.target.value })}
          error={formState.errors.label}
          hint="De vraag die gebruikers zien"
        />
      </div>

      {/* Type-Specific Fields */}
      <div className="border-t border-cream/10 pt-4">
        <h3 className="text-sm font-medium text-gold mb-3">Type Opties</h3>
        <TypeSpecificFields
          type={formState.type}
          options={formState.options}
          onChange={(options) => setFormState({ ...formState, options })}
          errors={formState.errors}
        />
      </div>

      {/* Points Configuration */}
      <div className="border-t border-cream/10 pt-4">
        <h3 className="text-sm font-medium text-gold mb-3">Punten</h3>
        <div className="space-y-3">
          <Input
            type="number"
            label="Exact"
            value={formState.points_exact}
            onChange={(e) => setFormState({ ...formState, points_exact: parseInt(e.target.value) })}
            hint="100% correct"
          />
          <Input
            type="number"
            label="Dichtbij"
            value={formState.points_close}
            onChange={(e) => setFormState({ ...formState, points_close: parseInt(e.target.value) })}
            hint="Binnen 10%"
          />
          <Input
            type="number"
            label="Richting"
            value={formState.points_direction}
            onChange={(e) => setFormState({ ...formState, points_direction: parseInt(e.target.value) })}
            hint="Goede richting (te hoog/laag)"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-cream/10 pt-4">
        <h3 className="text-sm font-medium text-gold mb-3">Preview</h3>
        <QuestionPreview question={buildPreviewQuestion(formState)} />
      </div>
    </div>

    <SheetFooter>
      {question && (
        <Button
          variant="ghost"
          onClick={() => handleDelete()}
          className="mr-auto text-warm-red"
        >
          Verwijderen
        </Button>
      )}
      <Button variant="secondary" onClick={() => onOpenChange(false)}>
        Annuleren
      </Button>
      <Button onClick={handleSave} disabled={!isValid()}>
        Opslaan
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Validation Logic**:
```typescript
function validateForm(state: EditorState): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate key
  if (!state.key.match(/^[a-z][a-z0-9_]*$/)) {
    errors.key = 'Key moet beginnen met kleine letter en alleen kleine letters, cijfers en _ bevatten';
  }

  // Validate label
  if (state.label.length < 3) {
    errors.label = 'Label moet minimaal 3 tekens bevatten';
  }

  // Type-specific validation
  try {
    validateOptionsForType(state.type, state.options);
  } catch (e) {
    errors.options = 'Ongeldige opties voor dit type';
  }

  return errors;
}
```

#### 4. TypeSpecificFields Component

**Location**: `src/components/admin/predictions/TypeSpecificFields.tsx`

**Purpose**: Render appropriate form fields based on question type

**Props**:
```typescript
interface TypeSpecificFieldsProps {
  type: PredictionQuestionType;
  options: PredictionQuestionOptions;
  onChange: (options: PredictionQuestionOptions) => void;
  errors: Record<string, string>;
}
```

**Component Structure**:
```tsx
function TypeSpecificFields({ type, options, onChange, errors }: Props) {
  switch (type) {
    case 'slider':
      return <SliderFields options={options as SliderOptions} onChange={onChange} errors={errors} />;
    case 'select_participant':
      return <SelectParticipantFields />;
    case 'boolean':
      return <BooleanFields options={options as BooleanOptions} onChange={onChange} errors={errors} />;
    case 'time':
      return <TimeFields options={options as TimeOptions} onChange={onChange} errors={errors} />;
    case 'select_options':
      return <SelectOptionsFields options={options as SelectOptionsOptions} onChange={onChange} errors={errors} />;
    default:
      return null;
  }
}

// Example: SliderFields
function SliderFields({ options, onChange, errors }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          label="Min"
          value={options.min}
          onChange={(e) => onChange({ ...options, min: parseInt(e.target.value) })}
          error={errors['options.min']}
        />
        <Input
          type="number"
          label="Max"
          value={options.max}
          onChange={(e) => onChange({ ...options, max: parseInt(e.target.value) })}
          error={errors['options.max']}
        />
      </div>
      <Input
        label="Unit"
        value={options.unit}
        onChange={(e) => onChange({ ...options, unit: e.target.value })}
        hint="bijv. ' flessen', '°C', ' kg'"
        error={errors['options.unit']}
      />
      <Input
        type="number"
        label="Default waarde"
        value={options.default ?? ''}
        onChange={(e) => onChange({ ...options, default: parseInt(e.target.value) })}
      />
      <Input
        label="Hint (optioneel)"
        value={options.hint ?? ''}
        onChange={(e) => onChange({ ...options, hint: e.target.value })}
        hint="bijv. '~20 personen = 15'"
      />
    </div>
  );
}

// Example: SelectOptionsFields with Emoji Picker
function SelectOptionsFields({ options, onChange, errors }: Props) {
  const [choices, setChoices] = useState<SelectChoice[]>(options.choices || []);

  const addChoice = () => {
    setChoices([...choices, { value: '', label: '', emoji: '' }]);
  };

  const updateChoice = (index: number, field: keyof SelectChoice, value: string) => {
    const updated = [...choices];
    updated[index] = { ...updated[index], [field]: value };
    setChoices(updated);
    onChange({ ...options, choices: updated });
  };

  const removeChoice = (index: number) => {
    const updated = choices.filter((_, i) => i !== index);
    setChoices(updated);
    onChange({ ...options, choices: updated });
  };

  return (
    <div className="space-y-3">
      {choices.map((choice, index) => (
        <div key={index} className="flex gap-2 items-start">
          {/* Emoji Picker */}
          <EmojiPicker
            value={choice.emoji || ''}
            onChange={(emoji) => updateChoice(index, 'emoji', emoji)}
          />

          {/* Label Input */}
          <Input
            placeholder="Label"
            value={choice.label}
            onChange={(e) => updateChoice(index, 'label', e.target.value)}
            error={errors[`choices.${index}.label`]}
          />

          {/* Value Input (auto-generated from label if empty) */}
          <Input
            placeholder="Value"
            value={choice.value}
            onChange={(e) => updateChoice(index, 'value', e.target.value)}
            hint="Automatisch als leeg"
          />

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeChoice(index)}
            className="text-warm-red"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <Button variant="secondary" onClick={addChoice}>
        + Optie toevoegen
      </Button>
    </div>
  );
}
```

#### 5. EmojiPicker Component

**Location**: `src/components/admin/predictions/EmojiPicker.tsx`

**Purpose**: Simple emoji selector dropdown

**Props**:
```typescript
interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}
```

**Emoji Groups**:
```typescript
const EMOJI_GROUPS = {
  food: {
    label: 'Eten',
    emojis: ['🍖', '🥩', '🍗', '🐟', '🥬', '🧀', '🍞', '🥗', '🍝', '🍕'],
  },
  animals: {
    label: 'Dieren',
    emojis: ['🐷', '🐄', '🐔', '🐑', '🦌', '🐟', '🦐', '🦞', '🦀', '🐙'],
  },
  drinks: {
    label: 'Drankjes',
    emojis: ['🍷', '🍺', '🥂', '🍾', '☕', '🧃', '🥤', '🧊', '🍹', '🍸'],
  },
  symbols: {
    label: 'Symbolen',
    emojis: ['✅', '❌', '🔥', '❄️', '☀️', '🌧️', '⏰', '🎵', '⭐', '💯'],
  },
} as const;
```

**Component Structure**:
```tsx
function EmojiPicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center bg-dark-wood border border-cream/20 rounded text-2xl hover:border-gold transition"
      >
        {value || '😀'}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 p-3 bg-dark-wood border border-cream/20 rounded-lg shadow-xl w-64">
          {Object.entries(EMOJI_GROUPS).map(([key, group]) => (
            <div key={key} className="mb-3 last:mb-0">
              <p className="text-xs text-cream/60 mb-1">{group.label}</p>
              <div className="grid grid-cols-8 gap-1">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onChange(emoji);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "text-2xl hover:scale-110 transition p-1 rounded",
                      value === emoji && "bg-gold/20"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 6. QuestionPreview Component

**Location**: `src/components/admin/predictions/QuestionPreview.tsx`

**Purpose**: Real-time preview of how question will appear to users

**Props**:
```typescript
interface QuestionPreviewProps {
  question: PredictionQuestion | Partial<PredictionQuestion>;
}
```

**Component Structure**:
```tsx
function QuestionPreview({ question }: Props) {
  // Render disabled version of actual user-facing component
  return (
    <div className="p-4 bg-deep-green/50 border border-cream/10 rounded-lg">
      <DynamicQuestion
        question={question as PredictionQuestion}
        value={getDefaultValue(question)}
        onChange={() => {}} // No-op
        disabled // Preview only
      />
    </div>
  );
}

function getDefaultValue(question: Partial<PredictionQuestion>) {
  switch (question.type) {
    case 'slider':
      return (question.options as SliderOptions)?.default ?? (question.options as SliderOptions)?.min ?? 0;
    case 'time':
      return (question.options as TimeOptions)?.default ?? 10;
    case 'boolean':
      return false;
    default:
      return '';
  }
}
```

### User-Facing Components

#### 7. DynamicQuestion Component

**Location**: `src/components/predictions/DynamicQuestion.tsx`

**Purpose**: Render a prediction question based on its type

**Props**:
```typescript
interface DynamicQuestionProps {
  question: PredictionQuestion;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
  disabled?: boolean;
  participants?: Array<{ value: string; label: string }>;
}
```

**Component Structure**:
```tsx
function DynamicQuestion({ question, value, onChange, disabled, participants }: Props) {
  switch (question.type) {
    case 'slider': {
      const opts = question.options as SliderOptions;
      return (
        <Slider
          label={question.label}
          min={opts.min}
          max={opts.max}
          value={(value as number) ?? opts.default ?? opts.min}
          onChange={(e) => onChange(parseInt(e.target.value))}
          unit={opts.unit}
          hint={opts.hint}
          disabled={disabled}
        />
      );
    }

    case 'select_participant': {
      return (
        <Select
          label={question.label}
          options={participants || []}
          placeholder="Selecteer een deelnemer"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    }

    case 'boolean': {
      const opts = question.options as BooleanOptions;
      return (
        <RadioGroup
          label={question.label}
          name={question.key}
          options={[
            {
              value: 'true',
              label: `${opts.trueEmoji || '✅'} ${opts.trueLabel || 'Ja'}`,
            },
            {
              value: 'false',
              label: `${opts.falseEmoji || '❌'} ${opts.falseLabel || 'Nee'}`,
            },
          ]}
          value={value === undefined ? '' : value.toString()}
          onChange={(v) => onChange(v === 'true')}
          disabled={disabled}
        />
      );
    }

    case 'time': {
      const opts = question.options as TimeOptions;
      return (
        <Slider
          label={question.label}
          min={0}
          max={22}
          value={(value as number) ?? opts.default ?? 10}
          onChange={(e) => onChange(parseInt(e.target.value))}
          formatValue={formatTimeValue}
          disabled={disabled}
        />
      );
    }

    case 'select_options': {
      const opts = question.options as SelectOptionsOptions;
      const selectOptions = opts.choices.map((choice) => ({
        value: choice.value,
        label: choice.emoji ? `${choice.emoji} ${choice.label}` : choice.label,
      }));

      return (
        <Select
          label={question.label}
          options={selectOptions}
          placeholder="Selecteer een optie"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    }

    default:
      return <p className="text-warm-red">Onbekend vraagtype: {question.type}</p>;
  }
}

// Time formatting helper
function formatTimeValue(value: number): string {
  const totalMinutes = 19 * 60 + value * 30;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
```

---

## API Specifications

### Admin API Endpoints

All admin endpoints require authentication and admin role verification.

#### 1. GET /api/admin/prediction-questions

**Purpose**: List all questions with statistics

**Authentication**: Required (Admin)

**Query Parameters**:
```typescript
{
  category?: 'consumption' | 'social' | 'other'; // Filter by category
  active?: 'true' | 'false' | 'all'; // Filter by active status (default: 'all')
}
```

**Response** (200):
```typescript
{
  questions: PredictionQuestion[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    byCategory: {
      consumption: number;
      social: number;
      other: number;
    };
    answerCounts: {
      [questionId: string]: number; // Count of user answers per question
    };
  };
}
```

**Errors**:
- 403: Unauthorized (not admin)
- 500: Database error

**Implementation**:
```typescript
// src/app/api/admin/prediction-questions/route.ts
export async function GET(request: NextRequest) {
  try {
    // Check admin
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin toegang vereist', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeFilter = searchParams.get('active') || 'all';

    const supabase = createServerClient();

    // Build query
    let query = supabase
      .from('prediction_questions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (activeFilter !== 'all') {
      query = query.eq('is_active', activeFilter === 'true');
    }

    const { data: questions, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: questions.length,
      active: questions.filter(q => q.is_active).length,
      inactive: questions.filter(q => !q.is_active).length,
      byCategory: {
        consumption: questions.filter(q => q.category === 'consumption').length,
        social: questions.filter(q => q.category === 'social').length,
        other: questions.filter(q => q.category === 'other').length,
      },
      answerCounts: await getAnswerCounts(supabase),
    };

    return NextResponse.json({ questions, stats });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Database fout', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}

// Helper: Get answer counts for all questions
async function getAnswerCounts(supabase: any): Promise<Record<string, number>> {
  // Query registrations table to count how many users answered each question
  const { data: registrations } = await supabase
    .from('registrations')
    .select('predictions');

  const counts: Record<string, number> = {};

  registrations?.forEach((reg: any) => {
    if (reg.predictions) {
      Object.keys(reg.predictions).forEach((key) => {
        counts[key] = (counts[key] || 0) + 1;
      });
    }
  });

  return counts;
}
```

#### 2. POST /api/admin/prediction-questions

**Purpose**: Create new question

**Authentication**: Required (Admin)

**Request Body**:
```typescript
{
  key: string; // Unique
  label: string;
  type: PredictionQuestionType;
  category: PredictionCategory;
  options: PredictionQuestionOptions;
  points_exact?: number; // Default: 50
  points_close?: number; // Default: 25
  points_direction?: number; // Default: 10
}
```

**Response** (201):
```typescript
{
  question: PredictionQuestion;
}
```

**Errors**:
- 400: Validation error
- 403: Unauthorized
- 409: Duplicate key
- 500: Database error

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
  try {
    // Check admin
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin toegang vereist', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate with Zod
    const validation = createQuestionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validatie fout',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const supabase = createServerClient();

    // Check for duplicate key
    const { data: existing } = await supabase
      .from('prediction_questions')
      .select('id')
      .eq('key', data.key)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Key bestaat al', code: 'DUPLICATE_KEY' },
        { status: 409 }
      );
    }

    // Get max sort_order for category
    const { data: maxSortOrder } = await supabase
      .from('prediction_questions')
      .select('sort_order')
      .eq('category', data.category)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sort_order = maxSortOrder ? maxSortOrder.sort_order + 10 : 0;

    // Insert
    const { data: question, error } = await supabase
      .from('prediction_questions')
      .insert({
        ...data,
        sort_order,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Database fout', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}
```

#### 3. PATCH /api/admin/prediction-questions/[id]

**Purpose**: Update existing question

**Authentication**: Required (Admin)

**Request Body**:
```typescript
{
  label?: string;
  type?: PredictionQuestionType;
  category?: PredictionCategory;
  options?: PredictionQuestionOptions;
  points_exact?: number;
  points_close?: number;
  points_direction?: number;
  is_active?: boolean;
}
```

**Response** (200):
```typescript
{
  question: PredictionQuestion;
}
```

**Errors**:
- 400: Validation error
- 403: Unauthorized
- 404: Question not found
- 500: Database error

**Implementation**:
```typescript
// src/app/api/admin/prediction-questions/[id]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin toegang vereist', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate
    const validation = updateQuestionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validatie fout',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const supabase = createServerClient();

    // Update
    const { data: question, error } = await supabase
      .from('prediction_questions')
      .update(data)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vraag niet gevonden', code: 'QUESTION_NOT_FOUND' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Database fout', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}
```

#### 4. DELETE /api/admin/prediction-questions/[id]

**Purpose**: Soft delete question (set is_active = false)

**Authentication**: Required (Admin)

**Response** (200):
```typescript
{
  success: true;
}
```

**Errors**:
- 403: Unauthorized
- 404: Question not found
- 500: Database error

**Implementation**:
```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin toegang vereist', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // Soft delete (set is_active = false)
    const { error } = await supabase
      .from('prediction_questions')
      .update({ is_active: false })
      .eq('id', params.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vraag niet gevonden', code: 'QUESTION_NOT_FOUND' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Database fout', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}
```

#### 5. POST /api/admin/prediction-questions/reorder

**Purpose**: Update sort_order for multiple questions

**Authentication**: Required (Admin)

**Request Body**:
```typescript
{
  questions: Array<{
    id: string;
    sort_order: number;
  }>;
}
```

**Response** (200):
```typescript
{
  success: true;
  updated: number; // Count of updated questions
}
```

**Errors**:
- 400: Validation error
- 403: Unauthorized
- 500: Database error

**Implementation**:
```typescript
// src/app/api/admin/prediction-questions/reorder/route.ts
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin toegang vereist', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate
    const validation = reorderQuestionsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validatie fout',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { questions } = validation.data;

    const supabase = createServerClient();

    // Update in transaction (simulate with Promise.all)
    const updates = questions.map(({ id, sort_order }) =>
      supabase
        .from('prediction_questions')
        .update({ sort_order })
        .eq('id', id)
    );

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      updated: questions.length,
    });
  } catch (error) {
    console.error('Error reordering questions:', error);
    return NextResponse.json(
      { error: 'Database fout', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}
```

### Public API Endpoint

#### 6. GET /api/prediction-questions

**Purpose**: Get active questions for users

**Authentication**: None (public)

**Query Parameters**: None

**Response** (200):
```typescript
{
  questions: Array<{
    id: string;
    key: string;
    label: string;
    type: PredictionQuestionType;
    category: PredictionCategory;
    options: PredictionQuestionOptions;
  }>;
}
```

**Notes**:
- Only returns `is_active = true` questions
- Excludes points configuration (admin-only)
- Ordered by `sort_order`

**Implementation**:
```typescript
// src/app/api/prediction-questions/route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: questions, error } = await supabase
      .from('prediction_questions')
      .select('id, key, label, type, category, options')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Database fout', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}
```

---

## State Management

### Zustand Store Updates

**Location**: `src/lib/store.ts`

#### Updated Predictions Store

```typescript
// Updated predictions store to support dynamic keys
interface PredictionsState {
  predictions: DynamicPredictions; // Changed from Predictions
  isDraft: boolean;
  isSubmitted: boolean;
  setPrediction: (key: string, value: string | number | boolean) => void; // Changed signature
  saveDraft: () => void;
  submitFinal: () => void;
  canEdit: () => boolean;
  reset: () => void;
}

export const usePredictionsStore = create<PredictionsState>()(
  persist(
    (set, get) => ({
      predictions: {},
      isDraft: false,
      isSubmitted: false,

      setPrediction: (key: string, value: string | number | boolean) =>
        set((state) => ({
          predictions: { ...state.predictions, [key]: value },
        })),

      saveDraft: () => set({ isDraft: true }),

      submitFinal: () => set({ isSubmitted: true, isDraft: false }),

      canEdit: () => {
        const now = new Date();
        return now < EVENT_START;
      },

      reset: () => set({ predictions: {}, isDraft: false, isSubmitted: false }),
    }),
    {
      name: 'bovenkamer-predictions',
      // Migration: Convert old predictions to new format
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Already in correct format or empty
          return persistedState as PredictionsState;
        }
        return persistedState;
      },
    }
  )
);
```

**Migration Strategy**:
- Existing localStorage data with keys like `wineBottles`, `firstSleeper` will continue to work
- New questions added by admin will use their configured `key` values
- No data loss - backward compatible

### Admin Page State

**Location**: `src/app/admin/predictions/questions/page.tsx`

```typescript
interface AdminQuestionsPageState {
  questions: PredictionQuestion[];
  isLoading: boolean;
  error: string | null;
  selectedQuestion: PredictionQuestion | null;
  isEditorOpen: boolean;
  stats: AdminQuestionsListResponse['stats'] | null;
}

// Local state management
function AdminQuestionsPage() {
  const [state, setState] = useState<AdminQuestionsPageState>({
    questions: [],
    isLoading: true,
    error: null,
    selectedQuestion: null,
    isEditorOpen: false,
    stats: null,
  });

  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/admin/prediction-questions');
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setState(prev => ({
        ...prev,
        questions: data.questions,
        stats: data.stats,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Kon vragen niet laden',
        isLoading: false,
      }));
    }
  }

  // ... handlers
}
```

---

## Database Schema & Migration

The migration has already been created at `supabase/migrations/20260128_prediction_questions.sql`.

**Key Points**:
- `key` field is UNIQUE to prevent duplicates
- `options` JSONB column for type-specific configuration
- `sort_order` for drag & drop ordering (gaps of 10 allow insertions)
- `is_active` for soft deletes
- RLS policies: public read active, admin full control
- Seeded with existing hardcoded questions

**Indexes**:
- `idx_prediction_questions_active` on `is_active`
- `idx_prediction_questions_sort` on `sort_order`
- `idx_prediction_questions_category` on `category`
- `idx_prediction_questions_type` on `type`

---

## Implementation Details

### Drag & Drop Configuration

**Package Installation**:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Sensor Setup** (for touch and mouse):
```typescript
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Require 8px movement before drag starts
    },
  })
);
```

**Collision Detection**:
```typescript
import { closestCenter } from '@dnd-kit/core';

<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  {/* Sortable items */}
</DndContext>
```

**Reorder Algorithm**:
```typescript
import { arrayMove } from '@dnd-kit/sortable';

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const oldIndex = questions.findIndex(q => q.id === active.id);
  const newIndex = questions.findIndex(q => q.id === over.id);

  // Reorder locally
  const reordered = arrayMove(questions, oldIndex, newIndex);

  // Assign new sort_order values (gaps of 10)
  const updates = reordered.map((q, index) => ({
    id: q.id,
    sort_order: index * 10,
  }));

  // Optimistic update
  setQuestions(reordered.map((q, i) => ({ ...q, sort_order: i * 10 })));

  // Persist to API
  fetch('/api/admin/prediction-questions/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions: updates }),
  }).catch(() => {
    // Rollback on error
    setQuestions(questions);
  });
}
```

### Time Slider Implementation

**Time Range**: 19:00 (start) to 06:00 (next day) in 30-minute increments

**Slider Value Mapping**:
- Value 0 = 19:00
- Value 1 = 19:30
- Value 2 = 20:00
- ...
- Value 10 = 00:00 (midnight)
- ...
- Value 22 = 06:00 (morning)

**Formatting Function**:
```typescript
function formatTimeValue(value: number): string {
  // Convert slider value to time
  const totalMinutes = 19 * 60 + value * 30;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
```

**Usage in Slider**:
```tsx
<Slider
  label="Hoe laat vertrekt de laatste gast?"
  min={0}
  max={22}
  value={predictions.lastGuestTime ?? 10}
  onChange={(e) => setPrediction('lastGuestTime', parseInt(e.target.value))}
  formatValue={formatTimeValue}
  formatMin={() => '19:00'}
  formatMax={() => '06:00'}
/>
```

### Emoji Picker Implementation

**Simple Approach** (Recommended):
- Dropdown with predefined emoji groups
- No external library needed
- Fast, lightweight, controlled

**Categories**:
- Eten (Food): 🍖 🥩 🍗 🐟 🥬 🧀 🍞 🥗
- Dieren (Animals): 🐷 🐄 🐔 🐑 🦌 🐟 🦐 🦞
- Drankjes (Drinks): 🍷 🍺 🥂 🍾 ☕ 🧃 🥤
- Symbolen (Symbols): ✅ ❌ 🔥 ❄️ ☀️ 🌧️ ⏰ 🎵

**Alternative** (If more flexibility needed):
```bash
npm install emoji-picker-react
```

### Sheet Sidebar Configuration

**Width**: `sm:max-w-lg` (larger than default for more space)

**Overflow**: Scrollable content area with fixed header/footer

**Example**:
```tsx
<SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
  <SheetHeader className="sticky top-0 bg-dark-wood z-10 pb-4">
    <SheetTitle>Vraag Bewerken</SheetTitle>
  </SheetHeader>

  <div className="py-6 space-y-6">
    {/* Form content */}
  </div>

  <SheetFooter className="sticky bottom-0 bg-dark-wood pt-4">
    {/* Action buttons */}
  </SheetFooter>
</SheetContent>
```

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── predictions/
│   │       ├── questions/
│   │       │   └── page.tsx                  # NEW: Admin question management page
│   │       └── page.tsx                      # UPDATE: Dynamic results form
│   │
│   ├── predictions/
│   │   └── page.tsx                          # UPDATE: Use DynamicQuestion component
│   │
│   └── api/
│       ├── admin/
│       │   └── prediction-questions/
│       │       ├── route.ts                  # NEW: GET list, POST create
│       │       ├── [id]/
│       │       │   └── route.ts              # NEW: PATCH update, DELETE
│       │       └── reorder/
│       │           └── route.ts              # NEW: POST reorder
│       │
│       └── prediction-questions/
│           └── route.ts                      # NEW: GET active (public)
│
├── components/
│   ├── admin/
│   │   └── predictions/
│   │       ├── QuestionList.tsx              # NEW: Main list with drag & drop
│   │       ├── SortableQuestionItem.tsx      # NEW: Individual draggable item
│   │       ├── QuestionEditor.tsx            # NEW: Sheet sidebar editor
│   │       ├── TypeSpecificFields.tsx        # NEW: Type-specific form fields
│   │       ├── QuestionPreview.tsx           # NEW: Live preview
│   │       └── EmojiPicker.tsx               # NEW: Simple emoji selector
│   │
│   └── predictions/
│       └── DynamicQuestion.tsx               # NEW: Render question by type
│
├── lib/
│   └── predictions/
│       ├── validation.ts                     # NEW: Zod schemas
│       └── helpers.ts                        # NEW: Utility functions
│
└── types/
    ├── index.ts                              # UPDATE: Add PredictionQuestion types
    └── api.ts                                # NEW: API request/response types
```

### Detailed File Purposes

| File | Purpose | Status |
|------|---------|--------|
| `/app/admin/predictions/questions/page.tsx` | Main admin page for question management | NEW |
| `/components/admin/predictions/QuestionList.tsx` | List with categories and drag & drop | NEW |
| `/components/admin/predictions/SortableQuestionItem.tsx` | Individual draggable question row | NEW |
| `/components/admin/predictions/QuestionEditor.tsx` | Sheet sidebar for create/edit | NEW |
| `/components/admin/predictions/TypeSpecificFields.tsx` | Conditional fields per question type | NEW |
| `/components/admin/predictions/QuestionPreview.tsx` | Real-time question preview | NEW |
| `/components/admin/predictions/EmojiPicker.tsx` | Emoji selector dropdown | NEW |
| `/components/predictions/DynamicQuestion.tsx` | Dynamic question renderer for users | NEW |
| `/app/predictions/page.tsx` | User-facing predictions page | UPDATE |
| `/app/admin/predictions/page.tsx` | Admin results entry | UPDATE |
| `/api/admin/prediction-questions/route.ts` | List/create questions | NEW |
| `/api/admin/prediction-questions/[id]/route.ts` | Update/delete question | NEW |
| `/api/admin/prediction-questions/reorder/route.ts` | Reorder endpoint | NEW |
| `/api/prediction-questions/route.ts` | Public active questions | NEW |
| `/lib/predictions/validation.ts` | Zod validation schemas | NEW |
| `/lib/predictions/helpers.ts` | Utility functions | NEW |
| `/types/index.ts` | Core type definitions | UPDATE |
| `/types/api.ts` | API types | NEW |
| `/lib/store.ts` | Zustand predictions store | UPDATE |

---

## Validation & Error Handling

### Client-Side Validation

**Form Validation** (Real-time):
```typescript
// Validate as user types
function validateField(field: string, value: any): string | null {
  switch (field) {
    case 'key':
      if (!value.match(/^[a-z][a-z0-9_]*$/)) {
        return 'Key moet beginnen met kleine letter';
      }
      break;
    case 'label':
      if (value.length < 3) {
        return 'Label moet minimaal 3 tekens bevatten';
      }
      break;
    // ... other fields
  }
  return null;
}
```

**Pre-Submit Validation**:
```typescript
function validateForm(state: EditorState): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Basic fields
  if (!questionKeySchema.safeParse(state.key).success) {
    errors.key = 'Ongeldige key';
  }

  if (state.label.length < 3) {
    errors.label = 'Label te kort';
  }

  // Type-specific validation
  try {
    validateOptionsForType(state.type, state.options);
  } catch (e) {
    errors.options = 'Ongeldige opties';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
```

### Server-Side Validation

**Zod Schema Validation**:
```typescript
const validation = createQuestionSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json(
    {
      error: 'Validatie fout',
      code: 'VALIDATION_ERROR',
      details: validation.error.flatten().fieldErrors,
    },
    { status: 400 }
  );
}
```

**Business Logic Validation**:
```typescript
// Check for duplicate key
const { data: existing } = await supabase
  .from('prediction_questions')
  .select('id')
  .eq('key', data.key)
  .single();

if (existing) {
  return NextResponse.json(
    { error: 'Key bestaat al', code: 'DUPLICATE_KEY' },
    { status: 409 }
  );
}
```

### Error Handling Patterns

**API Error Response Format**:
```typescript
interface ErrorResponse {
  error: string; // Human-readable message
  code?: string; // Machine-readable code
  details?: Record<string, string[]>; // Field-level errors (validation)
}
```

**Client-Side Error Handling**:
```typescript
async function saveQuestion() {
  try {
    setIsSaving(true);
    setError(null);

    const response = await fetch('/api/admin/prediction-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      const error = await response.json();

      if (error.code === 'DUPLICATE_KEY') {
        setFieldError('key', 'Deze key bestaat al');
      } else if (error.code === 'VALIDATION_ERROR') {
        setFieldErrors(error.details);
      } else {
        setError(error.error || 'Er ging iets mis');
      }

      return;
    }

    const { question } = await response.json();
    onSuccess(question);
  } catch (e) {
    setError('Netwerk fout. Probeer opnieuw.');
  } finally {
    setIsSaving(false);
  }
}
```

**User-Friendly Error Messages**:
```typescript
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'Je hebt geen toegang tot deze functie',
  FORBIDDEN: 'Deze actie is niet toegestaan',
  DUPLICATE_KEY: 'Deze key bestaat al. Kies een andere.',
  INVALID_OPTIONS: 'De ingestelde opties zijn ongeldig',
  QUESTION_NOT_FOUND: 'Vraag niet gevonden',
  QUESTION_IN_USE: 'Deze vraag heeft al antwoorden en kan niet worden verwijderd',
  DATABASE_ERROR: 'Er ging iets mis met de database',
  SERVER_ERROR: 'Er is een fout opgetreden. Probeer het later opnieuw.',
};
```

---

## Security Considerations

### Authentication & Authorization

**Admin-Only Endpoints**:
- All `/api/admin/prediction-questions/*` endpoints require admin role
- JWT token validation on every request
- RLS policies enforce database-level access control

**Implementation**:
```typescript
const user = await getUserFromRequest(request);
if (!user || !isAdmin(user)) {
  return NextResponse.json(
    { error: 'Admin toegang vereist', code: 'UNAUTHORIZED' },
    { status: 403 }
  );
}
```

### Input Sanitization

**Key Validation**:
- Restrict to lowercase alphanumeric + underscore
- Prevent SQL injection through parameterized queries (Supabase)

**JSONB Validation**:
- Validate structure with Zod before storing
- Prevent arbitrary object injection

**XSS Prevention**:
- React automatically escapes output
- Emoji picker uses predefined safe values
- Label/hint text rendered as text nodes, not HTML

### Rate Limiting

**Admin Endpoints**:
- Consider adding rate limiting for create/update operations
- Prevent abuse of reorder endpoint (could be spammed)

**Implementation** (Optional):
```typescript
import { rateLimit } from '@/lib/auth/rate-limit';

export async function POST(request: NextRequest) {
  const identifier = await getClientIP(request);

  const { success } = await rateLimit.check(identifier, 'create-question', {
    limit: 10, // 10 requests
    window: 60, // per 60 seconds
  });

  if (!success) {
    return NextResponse.json(
      { error: 'Te veel verzoeken', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    );
  }

  // ... continue with request
}
```

### Database Security

**RLS Policies**:
- Public: Read active questions only
- Admin: Full CRUD access
- Authenticated users: No direct write access

**SQL Injection**:
- Supabase uses parameterized queries
- No raw SQL in application code

**Data Integrity**:
- `key` field has UNIQUE constraint
- Type checking on `type` and `category` columns
- JSONB validation on insert/update

---

## Migration Strategy

### Phase 1: Database & API (Backend)

**Steps**:
1. Run migration: `supabase migration up`
2. Verify seed data: Check that existing questions are in table
3. Deploy admin API endpoints
4. Deploy public API endpoint
5. Test endpoints with Postman/curl

**Validation**:
- Admin can list questions
- Admin can create new question
- Public endpoint returns active questions only

### Phase 2: Admin Interface (Admin UI)

**Steps**:
1. Create admin page `/admin/predictions/questions`
2. Implement QuestionList with drag & drop
3. Implement QuestionEditor sheet
4. Test CRUD operations
5. Test reordering

**Validation**:
- Admin can view all questions grouped by category
- Admin can create, edit, delete questions
- Drag & drop reordering works
- Preview shows correct question rendering

### Phase 3: User-Facing (Frontend)

**Steps**:
1. Create DynamicQuestion component
2. Update `/predictions` page to fetch and render dynamic questions
3. Update Zustand store to use dynamic keys
4. Test with existing localStorage data (backward compatibility)
5. Test with new dynamic questions

**Validation**:
- Existing predictions still work
- New questions render correctly
- All question types render properly
- Answers are stored with correct keys

### Phase 4: Admin Results (Admin Updates)

**Steps**:
1. Update `/admin/predictions` results form to be dynamic
2. Update points calculation to read from `prediction_questions` table
3. Add statistics (answer counts) to admin question list

**Validation**:
- Admin can enter results for dynamic questions
- Points calculation uses configured point values
- Statistics show correct answer counts

### Rollback Strategy

**If issues arise**:

1. **Revert Frontend**: Deploy previous version of predictions page
2. **Revert Admin**: Disable admin question management page
3. **Keep API**: Leave API in place (no harm if unused)
4. **Database**: Do NOT rollback migration (seeded questions match old hardcoded questions)

**Data Safety**:
- Existing user predictions remain untouched
- New questions created by admin won't affect existing data
- Worst case: Disable admin page and revert to hardcoded questions in frontend

### Backward Compatibility

**Guaranteed**:
- All existing prediction keys preserved in seed data
- Zustand store accepts dynamic keys (superset of old interface)
- `Predictions` interface kept as type alias for old code

**localStorage Migration**:
```typescript
// Old format (still works)
{
  "predictions": {
    "wineBottles": 15,
    "firstSleeper": "user-id-123",
    "somethingBurned": true
  }
}

// New format (same structure, just typed differently)
{
  "predictions": {
    "wineBottles": 15,
    "firstSleeper": "user-id-123",
    "somethingBurned": true,
    "newDynamicQuestion": "value" // New questions added seamlessly
  }
}
```

---

## Testing Strategy

### Unit Tests

**Components to Test**:

1. **QuestionList**: Drag & drop reordering logic
2. **QuestionEditor**: Form validation
3. **TypeSpecificFields**: Conditional rendering
4. **DynamicQuestion**: Correct component rendering per type
5. **Validation**: Zod schemas

**Example Test** (QuestionEditor validation):
```typescript
describe('QuestionEditor', () => {
  it('should validate key format', () => {
    const { result } = renderHook(() => useEditorState());

    result.current.setKey('InvalidKey'); // Uppercase not allowed
    expect(result.current.errors.key).toBeDefined();

    result.current.setKey('validKey');
    expect(result.current.errors.key).toBeUndefined();
  });
});
```

### Integration Tests

**API Endpoints**:

1. **POST /api/admin/prediction-questions**:
   - Creates question successfully
   - Rejects duplicate key
   - Validates required fields

2. **PATCH /api/admin/prediction-questions/[id]**:
   - Updates question
   - Returns 404 for non-existent ID

3. **POST /api/admin/prediction-questions/reorder**:
   - Updates sort_order correctly
   - Handles transaction errors

**Example Test**:
```typescript
describe('POST /api/admin/prediction-questions', () => {
  it('should create a new question', async () => {
    const response = await fetch('/api/admin/prediction-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        key: 'testQuestion',
        label: 'Test Question',
        type: 'slider',
        category: 'other',
        options: { type: 'slider', min: 1, max: 10, unit: '' },
      }),
    });

    expect(response.status).toBe(201);
    const { question } = await response.json();
    expect(question.key).toBe('testQuestion');
  });

  it('should reject duplicate key', async () => {
    // Create first
    await createQuestion({ key: 'duplicate' });

    // Attempt duplicate
    const response = await createQuestion({ key: 'duplicate' });
    expect(response.status).toBe(409);
    const error = await response.json();
    expect(error.code).toBe('DUPLICATE_KEY');
  });
});
```

### E2E Tests (Playwright)

**Critical User Flows**:

1. **Admin creates question → User sees it**:
   ```typescript
   test('admin creates question and user sees it', async ({ page, adminPage }) => {
     // Admin creates question
     await adminPage.goto('/admin/predictions/questions');
     await adminPage.click('button:has-text("+ Nieuw")');
     await adminPage.fill('input[name="key"]', 'e2eTestQuestion');
     await adminPage.fill('input[name="label"]', 'E2E Test Question');
     await adminPage.selectOption('select[name="type"]', 'boolean');
     await adminPage.click('button:has-text("Opslaan")');

     // User sees question
     await page.goto('/predictions');
     await expect(page.locator('text=E2E Test Question')).toBeVisible();
   });
   ```

2. **Admin reorders questions → User sees new order**
3. **Admin disables question → User doesn't see it**
4. **User submits predictions → Admin sees results**

---

## Deployment Considerations

### Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side)
- `JWT_SECRET`

### Database Migration

**Before Deployment**:
```bash
# Local development
supabase migration up

# Production (via Supabase Dashboard or CLI)
supabase db push
```

**Verify Migration**:
```sql
-- Check table exists
SELECT * FROM prediction_questions LIMIT 1;

-- Check seeded data
SELECT key, label, type FROM prediction_questions ORDER BY sort_order;
```

### Build & Deploy

**Installation**:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zod
```

**Build**:
```bash
npm run build
```

**Deploy to Netlify**:
- Automatic deployment on push to `main`
- No configuration changes needed

### Performance Optimization

**Client-Side Caching**:
```typescript
// Cache active questions for 5 minutes
const [questions, setQuestions] = useState<PredictionQuestion[]>([]);
const [cacheTime, setCacheTime] = useState<number>(0);

useEffect(() => {
  const now = Date.now();
  if (now - cacheTime < 5 * 60 * 1000 && questions.length > 0) {
    return; // Use cache
  }

  fetchQuestions().then((data) => {
    setQuestions(data);
    setCacheTime(Date.now());
  });
}, []);
```

**Database Indexes**:
- Already included in migration
- Ensures fast queries on `is_active`, `sort_order`, `category`

**Optimistic Updates**:
- Drag & drop reordering updates UI immediately
- Rollback on API error

### Monitoring

**Key Metrics**:
- Admin question creation rate
- API error rates (validation errors, database errors)
- User prediction submission rate
- Average time to create/edit question

**Logging**:
```typescript
// Log admin actions
console.log(`[ADMIN] User ${user.id} created question ${question.key}`);
console.log(`[ADMIN] User ${user.id} reordered ${count} questions`);

// Log errors
console.error('[API] Failed to create question:', error);
```

---

## Summary

This architecture provides a comprehensive blueprint for implementing US-019: Dynamische Prediction Vragen. Key highlights:

**Type Safety**: Full TypeScript coverage with Zod validation
**User Experience**: Drag & drop, real-time preview, inline editing
**Performance**: Optimistic updates, client-side caching, indexed queries
**Security**: Admin-only access, input validation, RLS policies
**Backward Compatibility**: Existing predictions continue to work
**Extensibility**: Easy to add new question types in the future

**Next Steps**: Implementation phase can begin with confidence using this architecture as the blueprint.

---

**Architecture Date**: 2026-01-28
**Architect**: PACT Architect Agent
**Status**: ✅ Complete - Ready for Code Phase
**Next Phase**: Code (Backend & Frontend Implementation)
