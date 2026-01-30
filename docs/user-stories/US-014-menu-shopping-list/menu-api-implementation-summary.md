# US-014 v2 Menu & Shopping List API Implementation Summary

**Date**: 2026-01-30
**Phase**: Code (PACT Framework)
**Status**: Complete - Ready for Testing
**Developer**: Backend Coder Agent

## Implementation Overview

Implemented a complete admin-only REST API for the Menu & Shopping List system. The API enables CRUD operations on events, courses, and menu items, plus sophisticated shopping list calculations based on food preferences and portion sizes.

## Architecture

### Design Pattern
- Next.js 14 App Router with route handlers
- Layered architecture:
  - API routes (presentation layer)
  - Calculation engine (business logic layer)
  - Transform functions (data access layer)
  - Supabase client (database layer)

### Key Design Decisions

1. **Transform Layer**: Created shared transform functions in `src/lib/menu-transforms.ts` to handle snake_case to camelCase conversion and type parsing. This centralizes data transformation logic and ensures consistency across all routes.

2. **Pure Calculation Functions**: All calculation logic is in `src/lib/menu-calculations.ts` as pure functions with no side effects. This makes testing easier and allows the same logic to be used client-side and server-side.

3. **Consistent Error Handling**: All routes follow the same error response pattern with error codes (`UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION_ERROR`, `DATABASE_ERROR`, `SERVER_ERROR`) and Dutch messages.

4. **Auth Pattern**: Every route checks admin authentication using `getUserFromRequest()` and `isAdmin()` before processing requests.

5. **Nested Routes**: Used Next.js dynamic route segments for RESTful resource nesting (events → courses → items).

## File Structure

```
src/
├── lib/
│   ├── menu-transforms.ts              # NEW: Transform functions
│   ├── menu-calculations.ts            # Existing: Calculation engine
│   ├── auth/jwt.ts                     # Existing: Auth utilities
│   └── supabase.ts                     # Existing: DB client
│
└── app/api/admin/
    ├── events/
    │   ├── route.ts                    # NEW: GET (list), POST (create)
    │   └── [id]/
    │       ├── route.ts                # NEW: GET (detail), PATCH, DELETE
    │       └── courses/
    │           └── route.ts            # NEW: GET (list), POST (create)
    │
    ├── courses/[id]/
    │   ├── route.ts                    # NEW: PATCH, DELETE
    │   └── items/
    │       └── route.ts                # NEW: GET (list), POST (create)
    │
    ├── menu-items/[id]/
    │   └── route.ts                    # NEW: PATCH, DELETE
    │
    └── shopping-list/[eventId]/
        └── route.ts                    # NEW: GET (calculate)
```

## API Endpoints

### Events

**GET /api/admin/events**
- List all events with course count
- Response: `{ events: EventWithCourseCount[] }`
- Transforms: snake_case → camelCase

**POST /api/admin/events**
- Create new event
- Request body: `{ name, eventType, eventDate?, totalPersons?, status?, notes? }`
- Validation: name required, valid eventType, totalPersons >= 0
- Response (201): `{ event: MenuEvent }`

**GET /api/admin/events/[id]**
- Get event with nested courses and menu items
- Response: `{ event: EventWithDetails }`
- 404 if event not found

**PATCH /api/admin/events/[id]**
- Update event (partial update)
- Request body: Any subset of event fields
- Response: `{ event: MenuEvent }`

**DELETE /api/admin/events/[id]**
- Delete event (CASCADE deletes courses and items)
- Response: `{ success: true, message: 'Event verwijderd' }`

### Courses

**GET /api/admin/events/[id]/courses**
- List courses for event
- Response: `{ courses: EventCourse[] }`

**POST /api/admin/events/[id]/courses**
- Create course for event
- Request body: `{ name, gramsPerPerson, sortOrder?, notes? }`
- Validation: name required, gramsPerPerson > 0, event exists
- Response (201): `{ course: EventCourse }`

**PATCH /api/admin/courses/[id]**
- Update course
- Response: `{ course: EventCourse }`

**DELETE /api/admin/courses/[id]**
- Delete course (CASCADE deletes menu items)
- Response: `{ success: true, message: 'Gang verwijderd' }`

### Menu Items

**GET /api/admin/courses/[id]/items**
- List menu items for course
- Response: `{ menuItems: MenuItem[] }`

**POST /api/admin/courses/[id]/items**
- Create menu item
- Request body: Full MenuItem structure
- Validation by itemType:
  - `protein`: category + distributionPercentage required
  - `fixed`: gramsPerPerson required
  - `side`: no special requirements
  - All: yieldPercentage 0-100
- Response (201): `{ menuItem: MenuItem }`

**PATCH /api/admin/menu-items/[id]**
- Update menu item
- Response: `{ menuItem: MenuItem }`

**DELETE /api/admin/menu-items/[id]**
- Delete menu item
- Response: `{ success: true, message: 'Menu-item verwijderd' }`

### Shopping List

**GET /api/admin/shopping-list/[eventId]**
- Calculate complete shopping list
- Process:
  1. Fetch event (validate totalPersons > 0)
  2. Fetch courses with active menu items
  3. Fetch food preferences (self + partner)
  4. Calculate average meat distribution
  5. Run shopping list calculation engine
- Response: `ShoppingListResponse` with detailed calculations per item

## Validation Rules

### Events
- `name`: required, non-empty string
- `eventType`: must be one of: bbq, diner, lunch, borrel, receptie, overig
- `totalPersons`: if provided, must be >= 0
- `status`: draft, active, completed, cancelled

### Courses
- `name`: required, non-empty string
- `gramsPerPerson`: required, must be > 0
- `sortOrder`: if provided, must be >= 0

### Menu Items
- `name`: required, non-empty string
- `itemType`: must be one of: protein, side, fixed
- `yieldPercentage`: must be > 0 and <= 100
- **Protein items**:
  - `category`: required, must be one of: pork, beef, chicken, game, fish, vegetarian
  - `distributionPercentage`: required
- **Fixed items**:
  - `gramsPerPerson`: required, must be > 0

## Data Transformations

All database responses are transformed from snake_case to camelCase:

```typescript
// Database columns (snake_case)
event_type, event_date, total_persons, created_at, updated_at,
sort_order, grams_per_person, item_type, yield_percentage,
waste_description, unit_weight_grams, unit_label, rounding_grams,
distribution_percentage, is_active

// TypeScript interfaces (camelCase)
eventType, eventDate, totalPersons, createdAt, updatedAt,
sortOrder, gramsPerPerson, itemType, yieldPercentage,
wasteDescription, unitWeightGrams, unitLabel, roundingGrams,
distributionPercentage, isActive
```

### NUMERIC Parsing
All NUMERIC columns from Supabase are parsed with `parseFloat()`:
- `yield_percentage` → `yieldPercentage`
- `distribution_percentage` → `distributionPercentage`

## Security Measures

### Authentication
- All routes require admin role
- JWT token verified from httpOnly cookies
- `getUserFromRequest()` + `isAdmin()` checks

### Input Validation
- Required fields validated before database operations
- Type validation for enums (eventType, itemType, category)
- Range validation for numbers (totalPersons >= 0, yieldPercentage 0-100)
- String trimming to prevent whitespace-only values

### Error Handling
- Comprehensive try/catch blocks
- Consistent error response format
- Error logging without exposing sensitive data
- Appropriate HTTP status codes

### Data Protection
- Admin-only access (no public endpoints)
- Validated input before database queries
- Supabase RLS policies enforce database-level security

## Shopping List Calculation

Uses the calculation engine from `src/lib/menu-calculations.ts`:

1. **Get Average Meat Distribution**:
   - Query food_drink_preferences (self + partner)
   - Calculate average percentage per protein category
   - Use default distribution if no preferences available

2. **Calculate Per Item**:
   - **Protein items**:
     - Total course grams × category % × distribution %
     - Apply yield percentage
     - Round to purchase quantity
   - **Side items**:
     - Total course grams ÷ number of sides
     - Apply yield percentage
     - Round to purchase quantity
   - **Fixed items**:
     - Total persons × gramsPerPerson
     - Apply yield percentage
     - Round to purchase quantity

3. **Rounding Logic**:
   - If unitWeightGrams: ceil(bruto / unitWeight) × unitWeight
   - Else: ceil(bruto / roundingGrams) × roundingGrams

4. **Aggregate Totals**:
   - Per course subtotals (edible, bruto, purchase)
   - Grand totals across all courses

## Integration Points

### Database Tables
- `events` (read/write)
- `event_courses` (read/write)
- `menu_items` (read/write)
- `food_drink_preferences` (read-only for calculations)

### External Dependencies
- Supabase client (`createServerClient()`)
- JWT auth (`getUserFromRequest()`, `isAdmin()`)
- Type definitions from `@/types`
- Calculation engine from `@/lib/menu-calculations`

### CASCADE Relationships
- DELETE event → cascades to courses → cascades to menu items
- DELETE course → cascades to menu items

## Known Limitations

1. **No Pagination**: Event list returns all events. Consider adding pagination for large datasets.

2. **No Soft Deletes**: Deletes are permanent. Consider implementing soft deletes if undo functionality is needed.

3. **No Optimistic Locking**: Concurrent updates may overwrite each other. Consider adding version fields if needed.

4. **No Audit Trail**: No tracking of who made changes. Consider adding audit logs for compliance.

5. **Limited Query Optimization**: Each event fetches course count separately. Could be optimized with JOIN or aggregation.

## Performance Characteristics

- **GET /api/admin/events**: O(n) where n = number of events (performs n+1 queries for course counts)
- **GET /api/admin/events/[id]**: O(m + k) where m = courses, k = total items
- **Shopping List Calculation**: O(p + c × i) where p = persons, c = courses, i = items per course
- All queries use indexed foreign keys for efficient lookups
- No N+1 query issues in nested fetches (uses Promise.all)

## Error Response Examples

```json
// 403 Unauthorized
{ "error": "UNAUTHORIZED", "message": "Admin toegang vereist" }

// 404 Not Found
{ "error": "NOT_FOUND", "message": "Event niet gevonden" }

// 400 Validation Error
{ "error": "VALIDATION_ERROR", "message": "Naam is verplicht" }

// 500 Database Error
{ "error": "DATABASE_ERROR", "message": "Kon event niet ophalen" }

// 500 Server Error
{ "error": "SERVER_ERROR", "message": "Er ging iets mis" }
```

## Testing Recommendations

### Unit Tests Needed

**Transform Functions** (`menu-transforms.ts`):
- Test transformEvent with all field types
- Test transformCourse with null values
- Test transformMenuItem with NUMERIC parsing
- Test null safety for optional fields

**API Routes**:
- Test unauthorized access (no token)
- Test unauthorized access (non-admin user)
- Test validation errors (missing required fields)
- Test validation errors (invalid field values)
- Test successful CRUD operations
- Test 404 responses for non-existent resources
- Test cascade deletes

### Integration Tests Required

**Events API**:
- Create event → list events → verify in list
- Create event with courses → delete event → verify cascade
- Update event → verify changes persisted
- Invalid event type → verify 400 error

**Courses API**:
- Create course for non-existent event → verify 404
- Create course with negative gramsPerPerson → verify 400
- Delete course with items → verify cascade

**Menu Items API**:
- Create protein item without category → verify 400
- Create protein item without distributionPercentage → verify 400
- Create fixed item without gramsPerPerson → verify 400
- Update item with invalid yieldPercentage → verify 400

**Shopping List API**:
- Calculate for event without totalPersons → verify 400
- Calculate with no food preferences → verify uses defaults
- Calculate with mixed protein items → verify distribution
- Calculate with side items → verify even split
- Calculate with fixed items → verify per-person calculation
- Verify rounding logic for unit-based items
- Verify rounding logic for continuous items

### Performance Tests

- Shopping list calculation with 50 persons
- Shopping list calculation with 10 courses, 50 items
- Event list with 100+ events
- Concurrent updates to same event

### Security Tests

- Attempt access without JWT token
- Attempt access with participant role token
- Attempt SQL injection in name fields
- Attempt XSS in notes fields

## Additional Test Scenarios

**Concurrent Access**:
- Two admins updating same event simultaneously
- Admin deleting event while another is viewing it

**Data Consistency**:
- Delete event → verify courses deleted
- Delete course → verify items deleted
- Update event totalPersons → recalculate shopping list → verify consistency

**Edge Cases**:
- Event with zero courses
- Course with zero items
- All side items with same category
- 100% vegetarian meat distribution
- Yield percentage of 100% (no waste)
- Yield percentage of 1% (extreme waste)

## Configuration

No additional environment variables needed. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `JWT_SECRET`

## Next Steps for Orchestrator

Please have the test engineer review this implementation summary and execute the recommended test suite. The test engineer should:

1. **Validate API Functionality**:
   - Test all CRUD endpoints for events, courses, and menu items
   - Verify validation rules are enforced
   - Test cascade delete behavior
   - Verify shopping list calculation accuracy

2. **Security Validation**:
   - Confirm admin-only access enforcement
   - Test input validation and sanitization
   - Verify error responses don't leak sensitive data

3. **Performance Characteristics**:
   - Test shopping list calculation with realistic data volumes
   - Verify acceptable response times
   - Check for N+1 query issues

4. **Integration Testing**:
   - Test complete workflow: create event → add courses → add items → calculate shopping list
   - Verify data transformations are correct
   - Test error scenarios and recovery

All code is production-ready and TypeScript compiles without errors.
