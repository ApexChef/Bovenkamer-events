# US-014 v2: Types & Calculation Engine - Implementation Summary

**Status:** Complete
**Date:** 2026-01-30
**Developer:** PACT Backend Coder
**Related Documents:**
- Architecture: `docs/user-stories/US-014-Admin-F&B/ARCHITECT-v2.md`
- User Story: `docs/user-stories/US-014-Admin-F&B/README.md`

---

## Implementation Overview

This implementation adds the complete TypeScript type system and calculation engine for the Menu & Shopping List feature (US-014 v2). All code is production-ready and follows the exact specifications from the architecture document.

---

## Deliverables

### 1. TypeScript Types (`src/types/index.ts`)

**Location:** Lines 1056-1241

**Added Types:**

#### Core Entity Types
- `MenuEvent` - Event entity (renamed from `Event` to avoid DOM conflict)
- `EventWithCourseCount` - Event with course count for list views
- `EventCourse` - Course entity
- `MenuItem` - Menu item entity with type-specific fields
- `EventCourseWithItems` - Course with nested menu items
- `EventWithDetails` - Event with full course hierarchy

#### Shopping List Types
- `ShoppingListItem` - Calculated shopping list item with purchase quantities
- `ShoppingListCourse` - Shopping list for a single course
- `ShoppingList` - Complete shopping list with grand totals
- `ShoppingListResponse` - API response format

#### Form Data Types
- `CreateEventData` - Event creation form data
- `CreateCourseData` - Course creation form data
- `CreateMenuItemData` - Menu item creation form data

**Note:** `MeatDistribution` interface already exists (lines 257-264) and is used by both v1 and v2.

---

### 2. Calculation Engine (`src/lib/menu-calculations.ts`)

**Location:** New file created

**Exported Constants:**

```typescript
DEFAULT_ROUNDING_GRAMS = 100
PROTEIN_CATEGORIES = ['pork', 'beef', 'chicken', 'game', 'fish', 'vegetarian']
MENU_ITEM_CATEGORIES = [...PROTEIN_CATEGORIES, 'fruit', 'vegetables', 'salad', 'bread', 'sauce', 'dairy', 'other']
```

**Core Functions:**

#### 1. `getAverageMeatDistribution(persons: PersonPreference[]): MeatDistribution`
- Calculates average meat distribution percentages from user preferences
- Returns default distribution (20/20/20/10/15/15) if no data
- Used to integrate with v1 F&B preference data

#### 2. `calculateProteinItem(menuItem, totalCourseGrams, avgMeatDistribution): ShoppingListItem`
- Calculates purchase quantity for protein items
- Algorithm:
  1. Get category budget from total grams × avg percentage
  2. Calculate item share from category budget × distribution %
  3. Convert edible to bruto using yield percentage
  4. Round to purchase quantity (fixed units or continuous)
- Handles both fixed units (hamburgers) and continuous (meat by weight)

#### 3. `calculateSideItem(menuItem, totalCourseGrams, numberOfSides): ShoppingListItem`
- Calculates purchase quantity for side items
- Algorithm:
  1. Divide course total evenly among all sides
  2. Convert edible to bruto using yield percentage
  3. Round to purchase quantity
- Simple even distribution

#### 4. `calculateFixedItem(menuItem, totalPersons): ShoppingListItem`
- Calculates purchase quantity for fixed items
- Algorithm:
  1. Multiply persons × grams per person
  2. Convert edible to bruto using yield percentage
  3. Round to purchase quantity
- Independent of course totals

#### 5. `calculateCourseShoppingList(course, totalPersons, avgMeatDistribution): ShoppingListCourse`
- Aggregates all menu items for a course
- Calculates subtotals (edible, bruto, purchase)
- Handles mixed item types in single course

#### 6. `calculateShoppingList(courses, totalPersons, avgMeatDistribution): ShoppingList`
- Top-level function for complete shopping list
- Aggregates all courses
- Calculates grand totals

---

## Implementation Details

### Code Quality Standards

**Structure:**
- Pure functions (no side effects)
- Comprehensive JSDoc comments
- Type-safe with TypeScript strict mode
- Error handling with descriptive messages

**Naming:**
- Consistent with existing codebase patterns
- Self-documenting function names
- Clear variable names (no abbreviations)

**Documentation:**
- File-level documentation header
- Function-level JSDoc with examples
- Algorithm descriptions in comments
- Inline comments for complex logic

### Validation

**Input Validation:**
- Item type validation (protein/side/fixed)
- Category validation for protein items
- Required field validation per item type
- Division by zero protection (numberOfSides)

**Constraints Enforced:**
- Protein items require category + distribution %
- Fixed items require grams per person
- Yield percentage must be > 0 and ≤ 100
- Category must be valid protein category for protein items

### Design Decisions

**1. Separate File from v1 (`fb-calculations.ts`)**
- Rationale: Clean separation of concerns
- v1 handles preference aggregation
- v2 handles menu/shopping list calculations
- No code duplication

**2. Pure Functions**
- Rationale: Testable, predictable, reusable
- No side effects
- Same inputs always produce same outputs
- Easy to unit test

**3. Comprehensive Calculation Objects**
- Rationale: Debugging and transparency
- Each `ShoppingListItem` includes full calculation breakdown
- Admins can see how quantities were derived
- Useful for troubleshooting

**4. Named Export `MenuEvent` instead of `Event`**
- Rationale: Avoid conflict with DOM `Event` type
- TypeScript best practice
- Makes imports more explicit

---

## File Structure

```
src/
├── types/
│   └── index.ts                    [UPDATED: +186 lines]
│       └── Menu & Shopping List Types (lines 1056-1241)
│
└── lib/
    └── menu-calculations.ts        [NEW: 456 lines]
        ├── Constants
        ├── getAverageMeatDistribution()
        ├── calculateProteinItem()
        ├── calculateSideItem()
        ├── calculateFixedItem()
        ├── calculateCourseShoppingList()
        └── calculateShoppingList()
```

---

## Integration Points

### With v1 F&B Report

**Data Source:**
```typescript
// v1 API provides PersonPreference[] with meat_distribution
const { data: reportData } = await fetch('/api/admin/fb-report');

// v2 uses this to calculate averages
const avgMeatDistribution = getAverageMeatDistribution(reportData.persons);
```

**Shared Types:**
- `PersonPreference` (v1)
- `MeatDistribution` (both)

### With Future Components

**Client-Side Usage:**
```typescript
import { calculateShoppingList } from '@/lib/menu-calculations';

const shoppingList = useMemo(() => {
  return calculateShoppingList(
    event.courses,
    event.totalPersons,
    avgMeatDistribution
  );
}, [event.courses, event.totalPersons, avgMeatDistribution]);
```

**Server-Side Usage:**
```typescript
import { calculateShoppingList } from '@/lib/menu-calculations';

// In API route
const shoppingList = calculateShoppingList(
  courses,
  eventPersons,
  avgMeatDistribution
);

return NextResponse.json({ ...shoppingList });
```

---

## Testing Recommendations

### Unit Tests Needed

**Test File:** `src/lib/menu-calculations.test.ts`

#### 1. `getAverageMeatDistribution()`
- Empty array returns defaults
- Single person returns their distribution
- Multiple persons returns correct averages
- Edge case: All zeros

#### 2. `calculateProteinItem()`
- Standard case (Picanha example from architecture)
- Fixed unit case (Hamburger example)
- Edge cases:
  - 0% category percentage
  - 100% distribution
  - Very low yield percentage (waste-heavy items)
- Error cases:
  - Wrong item type
  - Invalid category
  - Missing distribution percentage

#### 3. `calculateSideItem()`
- Single side item
- Multiple side items (even distribution)
- Fixed units vs continuous
- Error cases:
  - Wrong item type
  - Zero sides

#### 4. `calculateFixedItem()`
- Standard case (Stokbrood example)
- Fixed units
- Continuous
- Error cases:
  - Wrong item type
  - Missing grams per person

#### 5. `calculateCourseShoppingList()`
- Mixed item types in one course
- Protein-only course
- Sides-only course
- Empty course
- Subtotal calculations

#### 6. `calculateShoppingList()`
- Multiple courses
- Single course
- Empty courses array
- Grand total calculations

### Integration Tests

**Test File:** Future API route tests

- Shopping list API endpoint integration
- F&B report data integration
- Database query integration

### Performance Benchmarks

**Target:** < 500ms for 50 persons, 5 courses, 30 items

**Test Scenarios:**
- Small event (10 persons, 2 courses, 10 items)
- Medium event (25 persons, 3 courses, 20 items)
- Large event (50 persons, 5 courses, 30 items)

---

## Security Considerations

### No Security Concerns

**Rationale:**
- Pure calculation functions
- No sensitive data
- No database access
- No external API calls
- No user input directly processed

**Usage Context:**
- Admin-only feature
- Authentication enforced at API/page level
- Calculations use validated data from database

---

## Next Steps for Orchestrator

This implementation completes Phase 1 (Database & Types) of US-014 v2. The following steps remain:

### Immediate Next Steps

**Phase 2: Database Migration**
- Create migration SQL (see ARCHITECT-v2.md lines 242-462)
- Run migration on dev environment
- Verify CASCADE DELETE behavior
- Add sample data for testing

**Phase 3: API Routes**
- Events CRUD API (`/api/admin/events/...`)
- Courses CRUD API (`/api/admin/courses/...`)
- Menu Items CRUD API (`/api/admin/menu-items/...`)
- Shopping List API (`/api/admin/shopping-list/[eventId]`)

**Phase 4: UI Components**
- Page component (`/admin/menu/page.tsx`)
- Dialog components (Event, Course, MenuItem)
- List/Card components (Event list, Course cards, Item cards)
- Shopping list display components

### Test Engineer Tasks

**Before API Implementation:**
1. Review type definitions for completeness
2. Create unit test suite for `menu-calculations.ts`
3. Validate calculation algorithms against architecture examples
4. Prepare integration test scenarios

**After API Implementation:**
1. API endpoint integration tests
2. E2E test scenarios for CRUD flows
3. Performance benchmarks
4. Edge case validation

---

## Quality Assurance Checklist

- [x] All architectural specifications correctly implemented
- [x] TypeScript types match architecture document exactly
- [x] Calculation algorithms follow ARCHITECT-v2.md specifications
- [x] Code follows language/platform style guides
- [x] Pure functions (no side effects)
- [x] Comprehensive JSDoc documentation
- [x] File headers with purpose and relationships
- [x] Error handling with meaningful messages
- [x] Input validation
- [x] Constants exported for configuration
- [x] No external dependencies added
- [x] TypeScript compiles without errors
- [x] Integration with v1 types verified
- [x] Naming conventions followed

---

## Known Limitations

None. Implementation is complete and production-ready.

---

## File Paths (for reference)

**Types:**
- `/Users/alwinvandijken/Projects/github.com/ApexChef/Bovenkamer-events/src/types/index.ts` (lines 1056-1241)

**Calculation Engine:**
- `/Users/alwinvandijken/Projects/github.com/ApexChef/Bovenkamer-events/src/lib/menu-calculations.ts` (complete file)

---

**Document Status:** Implementation Complete - Ready for Phase 2 (Database Migration)
**Last Updated:** 2026-01-30
**Developer:** PACT Backend Coder
