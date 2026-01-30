# US-014 v2: Menu & Inkoopberekening - ARCHITECTURE

**Status:** Architecture Complete
**Date:** 2026-01-29
**Architect:** PACT Architect
**Related Documents:**
- User Story: `docs/user-stories/US-014-Admin-F&B/README.md`
- Preparation Research: `docs/user-stories/US-014-Admin-F&B/PREPARE.md`
- Design Document: `docs/user-stories/US-014-Admin-F&B/bbq_inkoop_berekening.md`
- v1 Architecture: `docs/user-stories/US-014-Admin-F&B/ARCHITECT.md` (F&B Rapport - Implemented)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Design](#api-design)
5. [Component Specifications](#component-specifications)
6. [Calculation Engine](#calculation-engine)
7. [TypeScript Interfaces](#typescript-interfaces)
8. [Integration Points](#integration-points)
9. [Security Architecture](#security-architecture)
10. [File Structure](#file-structure)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Risk Analysis](#risk-analysis)
13. [Architecture Decision Records](#architecture-decision-records)

---

## Executive Summary

### Architecture Goals

This architecture defines a **dynamic menu & shopping list calculation system** for administrators to plan events with custom menus and generate precise shopping lists based on participant food preferences. This is v2 of US-014, building on top of the fully implemented F&B preference report (v1).

**Key Architectural Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Admin UI Structure** | Single integrated page with nested sections | Better UX, less navigation, follows existing admin patterns |
| **Shopping List Placement** | Section within event detail view | Immediate context, no additional navigation required |
| **LLM Integration** | Optional endpoint, defer to Phase 2 | Core functionality doesn't depend on it, can be added later |
| **Persons Count** | Manual input with optional auto-calculate | Flexibility for planning, can calculate from approved registrations |
| **CRUD API Design** | RESTful routes per resource | Consistent with Next.js patterns, clear separation of concerns |
| **State Management** | Local state with React hooks | Suitable for admin-only feature, no cross-page persistence needed |
| **Calculation Engine** | Separate module `menu-calculations.ts` | Clean separation from v1, reusable, testable |

### Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with existing theme
- **Database:** Supabase (PostgreSQL)
- **Animations:** Framer Motion
- **Authentication:** Existing JWT-based admin auth
- **No New Dependencies:** All functionality uses existing libraries

### Constraints

**Technical:**
- Must integrate with existing `food_drink_preferences` table
- Must use existing `meat_distribution` JSONB field for category averages
- CASCADE DELETE for event hierarchy (event → courses → items)
- Admin-only functionality (no participant access)

**Business:**
- Three item types: protein, side, fixed (non-negotiable)
- Yield percentage per item for bruto/netto conversion
- Partners count in persons total
- Event-agnostic (works for BBQ, dinner, lunch, etc.)

**Quality Attributes:**
- **Performance:** Shopping list generation < 500ms for 50 persons
- **Usability:** Intuitive CRUD interface, clear calculation display
- **Maintainability:** Pure calculation functions, well-documented formulas
- **Accuracy:** Calculations match design document specifications exactly

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Admin Menu Management                      │
│                   /admin/menu (Client)                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Event List                                         │    │
│  │  • View all events                                 │    │
│  │  • Create new event                                │    │
│  │  • Edit/Delete event                               │    │
│  └────────────────────────────────────────────────────┘    │
│                         │                                    │
│                         v                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Event Detail (selected event)                      │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │ Event Info (name, date, persons, type)   │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │ Courses Section                          │     │    │
│  │  │  • Add course                            │     │    │
│  │  │  • Edit course (name, g/p.p., order)     │     │    │
│  │  │  • Delete course                         │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │ Menu Items per Course                    │     │    │
│  │  │  • Add menu item                         │     │    │
│  │  │  • Edit item (all properties)            │     │    │
│  │  │  • Delete item                           │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │ Shopping List Display                    │     │    │
│  │  │  • Calculations per course               │     │    │
│  │  │  • Subtotals per course                  │     │    │
│  │  │  • Grand total                           │     │    │
│  │  │  • Export button                         │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              v
┌─────────────────────────────────────────────────────────────┐
│                      API Routes (Server)                    │
│                                                              │
│  /api/admin/events                   [GET, POST]            │
│  /api/admin/events/[id]              [GET, PATCH, DELETE]   │
│  /api/admin/events/[id]/courses      [GET, POST]            │
│  /api/admin/courses/[id]             [PATCH, DELETE]        │
│  /api/admin/courses/[id]/items       [GET, POST]            │
│  /api/admin/menu-items/[id]          [PATCH, DELETE]        │
│  /api/admin/shopping-list/[eventId]  [GET]                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Database Queries
                              v
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│                                                              │
│  events                    (new)                            │
│  event_courses             (new)                            │
│  menu_items                (new)                            │
│  food_drink_preferences    (existing - for meat_distribution)│
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
src/app/admin/menu/
├── page.tsx                          [Main page - Event list + detail]
│   ├── EventList                     [List of all events]
│   ├── EventDetail                   [Selected event detail view]
│   │   ├── EventInfoCard             [Event metadata]
│   │   ├── CoursesSection            [Manage courses]
│   │   │   └── CourseCard            [Single course with items]
│   │   │       └── MenuItemCard      [Single menu item]
│   │   └── ShoppingListSection       [Calculated shopping list]
│   │       ├── CourseShoppingList    [Shopping list per course]
│   │       └── ShoppingListTotal     [Grand total]
│   └── Dialogs
│       ├── EventDialog               [Create/Edit event]
│       ├── CourseDialog              [Create/Edit course]
│       └── MenuItemDialog            [Create/Edit menu item]
│
src/lib/
├── menu-calculations.ts              [New calculation engine]
│   ├── calculateProteinItem()
│   ├── calculateSideItem()
│   ├── calculateFixedItem()
│   ├── calculateCourseTotal()
│   ├── calculateEventTotal()
│   ├── getAverageMeatDistribution()
│   └── Constants
│
src/types/index.ts                    [Add new types]
├── Event
├── EventCourse
├── MenuItem
├── ShoppingListItem
├── ShoppingListCourse
└── ShoppingList
```

### Data Flow Diagram

```
┌──────────────────────┐
│ food_drink_preferences│ (existing v1 data)
│ (meat_distribution)  │
└──────────────────────┘
          │
          │ Calculate average per category
          v
    ┌─────────────┐
    │ AVG meat_%  │ (pork, beef, chicken, game, fish, veg)
    └─────────────┘
          │
          │
          v
┌──────────────────────┐      ┌──────────────────────┐
│ events               │──┬──>│ event_courses        │
│ (config + persons)   │  │   │ (grams_per_person)   │
└──────────────────────┘  │   └──────────────────────┘
                          │              │
                          │              v
                          │   ┌──────────────────────┐
                          │   │ menu_items           │
                          │   │ (type, category,     │
                          │   │  yield, distribution)│
                          │   └──────────────────────┘
                          │              │
                          └──────────────┴───────────┐
                                         │
                                         v
                              ┌──────────────────────┐
                              │ CALCULATION ENGINE   │
                              │ (menu-calculations)  │
                              └──────────────────────┘
                                         │
                                         v
                              ┌──────────────────────┐
                              │ SHOPPING LIST        │
                              │ • Per course         │
                              │ • Per item           │
                              │ • Rounded quantities │
                              │ • Totals             │
                              └──────────────────────┘
```

---

## Database Schema

### Migration SQL

```sql
-- =============================================================================
-- US-014 v2: Menu & Shopping List Tables
-- Description: Event, course, and menu item management for shopping list generation
-- Created: 2026-01-29
-- =============================================================================

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS event_courses CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Events Table
-- -----------------------------------------------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('bbq', 'diner', 'lunch', 'borrel', 'receptie', 'overig')),
  event_date DATE,

  -- Persons calculation
  total_persons INT,  -- Manual input or auto-calculated

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),

  -- Additional info
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);

-- -----------------------------------------------------------------------------
-- 2. Event Courses Table
-- -----------------------------------------------------------------------------
CREATE TABLE event_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Course info
  name TEXT NOT NULL,  -- e.g., "Aperitief", "Hoofdgerecht", "Dessert"
  sort_order INT NOT NULL DEFAULT 0,

  -- Portion size
  grams_per_person INT NOT NULL,  -- Edible grams per person for this course

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique sort order per event
  UNIQUE(event_id, sort_order)
);

-- Index for common queries
CREATE INDEX idx_event_courses_event_id ON event_courses(event_id);
CREATE INDEX idx_event_courses_sort_order ON event_courses(event_id, sort_order);

-- -----------------------------------------------------------------------------
-- 3. Menu Items Table
-- -----------------------------------------------------------------------------
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  course_id UUID NOT NULL REFERENCES event_courses(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,  -- e.g., "Picanha", "Ananas van de grill"

  -- Calculation type
  item_type TEXT NOT NULL CHECK (item_type IN ('protein', 'side', 'fixed')),

  -- Category (for protein items: maps to meat_distribution keys)
  category TEXT CHECK (category IN (
    'pork', 'beef', 'chicken', 'game', 'fish', 'vegetarian',
    'fruit', 'vegetables', 'salad', 'bread', 'sauce', 'dairy', 'other'
  )),

  -- Purchase calculation
  yield_percentage NUMERIC(5,2) NOT NULL DEFAULT 100.00,  -- e.g., 85.00 (= 85% edible)
  waste_description TEXT,  -- e.g., "Schil en kern verwijderen"

  -- Rounding/unit
  unit_weight_grams INT,  -- e.g., 150 (per hamburger), NULL if continuous
  unit_label TEXT,  -- e.g., "stuk", "stokje", "fles"
  rounding_grams INT DEFAULT 100,  -- Rounding value if no fixed unit

  -- Distribution (type-specific)
  distribution_percentage NUMERIC(5,2),  -- % within category (protein only)
  grams_per_person INT,  -- Override grams (fixed items only)

  -- Display
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT protein_requires_category CHECK (
    item_type != 'protein' OR category IN ('pork', 'beef', 'chicken', 'game', 'fish', 'vegetarian')
  ),
  CONSTRAINT protein_requires_distribution CHECK (
    item_type != 'protein' OR distribution_percentage IS NOT NULL
  ),
  CONSTRAINT fixed_requires_grams_per_person CHECK (
    item_type != 'fixed' OR grams_per_person IS NOT NULL
  ),
  CONSTRAINT yield_positive CHECK (yield_percentage > 0 AND yield_percentage <= 100)
);

-- Index for common queries
CREATE INDEX idx_menu_items_course_id ON menu_items(course_id);
CREATE INDEX idx_menu_items_type ON menu_items(item_type);
CREATE INDEX idx_menu_items_category ON menu_items(category);

-- -----------------------------------------------------------------------------
-- Updated_at Triggers
-- -----------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_courses_updated_at
  BEFORE UPDATE ON event_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Sample Data (Optional - for testing)
-- -----------------------------------------------------------------------------

-- Sample event
INSERT INTO events (name, event_type, event_date, total_persons, status)
VALUES ('Nieuwjaars BBQ 2026', 'bbq', '2026-01-04', 18, 'draft');

-- Get the event ID for courses
DO $$
DECLARE
  v_event_id UUID;
  v_course_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE name = 'Nieuwjaars BBQ 2026';

  -- Sample course: Hoofdgerecht
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person)
  VALUES (v_event_id, 'Hoofdgerecht', 1, 450)
  RETURNING id INTO v_course_id;

  -- Sample menu items
  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, distribution_percentage, unit_label)
  VALUES
    (v_course_id, 'Picanha', 'protein', 'beef', 85.00, 50.00, 'kg'),
    (v_course_id, 'Hamburger', 'protein', 'beef', 95.00, 50.00, 'stuk'),
    (v_course_id, 'Kipsaté', 'protein', 'chicken', 95.00, 100.00, 'stokje'),
    (v_course_id, 'Hele zalm', 'protein', 'fish', 55.00, 100.00, 'kg'),
    (v_course_id, 'Courgette van de grill', 'side', 'vegetables', 90.00, NULL, 'kg'),
    (v_course_id, 'Stokbrood', 'fixed', 'bread', 100.00, NULL, 'stuk');

  -- Update fixed item with grams_per_person
  UPDATE menu_items
  SET grams_per_person = 80
  WHERE name = 'Stokbrood';
END $$;

-- -----------------------------------------------------------------------------
-- Verification Queries
-- -----------------------------------------------------------------------------

-- View event hierarchy
SELECT
  e.name AS event,
  ec.name AS course,
  ec.grams_per_person,
  mi.name AS item,
  mi.item_type,
  mi.category,
  mi.yield_percentage
FROM events e
LEFT JOIN event_courses ec ON e.id = ec.event_id
LEFT JOIN menu_items mi ON ec.id = mi.course_id
ORDER BY e.name, ec.sort_order, mi.sort_order;

-- Check CASCADE DELETE
-- DELETE FROM events WHERE name = 'Nieuwjaars BBQ 2026';
-- (Should cascade delete courses and menu items)

COMMIT;
```

### Table Relationships

```
events (1) ──< event_courses (N) ──< menu_items (N)
   │
   │ CASCADE DELETE
   └─> Delete event deletes all courses and items

food_drink_preferences (existing)
   │
   │ Used for calculation
   └─> AVG(meat_distribution) per category
```

---

## API Design

### REST Endpoints

All endpoints require admin authentication.

#### 1. Events API

**GET `/api/admin/events`**

List all events.

**Request:**
```
GET /api/admin/events HTTP/1.1
```

**Response (200):**
```json
{
  "events": [
    {
      "id": "uuid-123",
      "name": "Nieuwjaars BBQ 2026",
      "eventType": "bbq",
      "eventDate": "2026-01-04",
      "totalPersons": 18,
      "status": "draft",
      "notes": null,
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-20T10:00:00Z",
      "courseCount": 3
    }
  ]
}
```

---

**POST `/api/admin/events`**

Create new event.

**Request:**
```json
{
  "name": "Nieuwjaars BBQ 2026",
  "eventType": "bbq",
  "eventDate": "2026-01-04",
  "totalPersons": 18,
  "status": "draft",
  "notes": ""
}
```

**Response (201):**
```json
{
  "event": {
    "id": "uuid-123",
    "name": "Nieuwjaars BBQ 2026",
    "eventType": "bbq",
    "eventDate": "2026-01-04",
    "totalPersons": 18,
    "status": "draft",
    "notes": null,
    "createdAt": "2026-01-29T10:00:00Z",
    "updatedAt": "2026-01-29T10:00:00Z"
  }
}
```

---

**GET `/api/admin/events/[id]`**

Get single event with courses and menu items.

**Response (200):**
```json
{
  "event": {
    "id": "uuid-123",
    "name": "Nieuwjaars BBQ 2026",
    "eventType": "bbq",
    "eventDate": "2026-01-04",
    "totalPersons": 18,
    "status": "draft",
    "notes": null,
    "createdAt": "2026-01-29T10:00:00Z",
    "updatedAt": "2026-01-29T10:00:00Z",
    "courses": [
      {
        "id": "course-uuid-1",
        "eventId": "uuid-123",
        "name": "Hoofdgerecht",
        "sortOrder": 1,
        "gramsPerPerson": 450,
        "notes": null,
        "createdAt": "2026-01-29T10:00:00Z",
        "updatedAt": "2026-01-29T10:00:00Z",
        "menuItems": [
          {
            "id": "item-uuid-1",
            "courseId": "course-uuid-1",
            "name": "Picanha",
            "itemType": "protein",
            "category": "beef",
            "yieldPercentage": 85.00,
            "wasteDescription": "Vet en zwoerd",
            "unitWeightGrams": null,
            "unitLabel": "kg",
            "roundingGrams": 100,
            "distributionPercentage": 50.00,
            "gramsPerPerson": null,
            "sortOrder": 0,
            "isActive": true,
            "createdAt": "2026-01-29T10:00:00Z",
            "updatedAt": "2026-01-29T10:00:00Z"
          }
        ]
      }
    ]
  }
}
```

---

**PATCH `/api/admin/events/[id]`**

Update event.

**Request:**
```json
{
  "name": "Nieuwjaars BBQ 2026 (Updated)",
  "totalPersons": 20
}
```

**Response (200):**
```json
{
  "event": { /* updated event */ }
}
```

---

**DELETE `/api/admin/events/[id]`**

Delete event (cascades to courses and items).

**Response (200):**
```json
{
  "success": true,
  "message": "Event verwijderd"
}
```

---

#### 2. Courses API

**POST `/api/admin/events/[eventId]/courses`**

Create course for event.

**Request:**
```json
{
  "name": "Hoofdgerecht",
  "sortOrder": 1,
  "gramsPerPerson": 450,
  "notes": ""
}
```

**Response (201):**
```json
{
  "course": {
    "id": "course-uuid",
    "eventId": "event-uuid",
    "name": "Hoofdgerecht",
    "sortOrder": 1,
    "gramsPerPerson": 450,
    "notes": null,
    "createdAt": "2026-01-29T10:00:00Z",
    "updatedAt": "2026-01-29T10:00:00Z"
  }
}
```

---

**PATCH `/api/admin/courses/[id]`**

Update course.

**Request:**
```json
{
  "name": "Hoofdgerecht BBQ",
  "gramsPerPerson": 500
}
```

**Response (200):**
```json
{
  "course": { /* updated course */ }
}
```

---

**DELETE `/api/admin/courses/[id]`**

Delete course (cascades to menu items).

**Response (200):**
```json
{
  "success": true,
  "message": "Gang verwijderd"
}
```

---

#### 3. Menu Items API

**POST `/api/admin/courses/[courseId]/items`**

Create menu item for course.

**Request (Protein item):**
```json
{
  "name": "Picanha",
  "itemType": "protein",
  "category": "beef",
  "yieldPercentage": 85.00,
  "wasteDescription": "Vet en zwoerd",
  "unitWeightGrams": null,
  "unitLabel": "kg",
  "roundingGrams": 100,
  "distributionPercentage": 50.00,
  "gramsPerPerson": null,
  "sortOrder": 0,
  "isActive": true
}
```

**Request (Side item):**
```json
{
  "name": "Courgette van de grill",
  "itemType": "side",
  "category": "vegetables",
  "yieldPercentage": 90.00,
  "wasteDescription": "Uiteinden verwijderen",
  "unitWeightGrams": null,
  "unitLabel": "kg",
  "roundingGrams": 100,
  "distributionPercentage": null,
  "gramsPerPerson": null,
  "sortOrder": 0,
  "isActive": true
}
```

**Request (Fixed item):**
```json
{
  "name": "Stokbrood",
  "itemType": "fixed",
  "category": "bread",
  "yieldPercentage": 100.00,
  "wasteDescription": null,
  "unitWeightGrams": 250,
  "unitLabel": "stuk",
  "roundingGrams": null,
  "distributionPercentage": null,
  "gramsPerPerson": 80,
  "sortOrder": 0,
  "isActive": true
}
```

**Response (201):**
```json
{
  "menuItem": { /* created menu item */ }
}
```

---

**PATCH `/api/admin/menu-items/[id]`**

Update menu item.

**Request:**
```json
{
  "yieldPercentage": 87.00,
  "distributionPercentage": 60.00
}
```

**Response (200):**
```json
{
  "menuItem": { /* updated menu item */ }
}
```

---

**DELETE `/api/admin/menu-items/[id]`**

Delete menu item.

**Response (200):**
```json
{
  "success": true,
  "message": "Menu-item verwijderd"
}
```

---

#### 4. Shopping List API

**GET `/api/admin/shopping-list/[eventId]`**

Calculate shopping list for event.

**Response (200):**
```json
{
  "event": {
    "id": "uuid-123",
    "name": "Nieuwjaars BBQ 2026",
    "totalPersons": 18
  },
  "averageMeatDistribution": {
    "pork": 5.0,
    "beef": 45.0,
    "chicken": 28.0,
    "game": 3.0,
    "fish": 20.0,
    "vegetarian": 0.0
  },
  "courses": [
    {
      "courseId": "course-uuid-1",
      "courseName": "Hoofdgerecht",
      "gramsPerPerson": 450,
      "items": [
        {
          "menuItemId": "item-uuid-1",
          "name": "Picanha",
          "itemType": "protein",
          "category": "beef",
          "edibleGrams": 1822.5,
          "brutoGrams": 2144.12,
          "purchaseQuantity": 2200,
          "unit": "g",
          "unitLabel": "kg",
          "calculation": {
            "totalCourseGrams": 8100,
            "categoryPercentage": 45.0,
            "categoryGrams": 3645,
            "distributionPercentage": 50.0,
            "itemEdibleGrams": 1822.5,
            "yieldPercentage": 85.0,
            "brutograms": 2144.12,
            "roundingGrams": 100,
            "purchaseQuantity": 2200
          }
        },
        {
          "menuItemId": "item-uuid-2",
          "name": "Hamburger",
          "itemType": "protein",
          "category": "beef",
          "edibleGrams": 1822.5,
          "brutoGrams": 1918.42,
          "purchaseQuantity": 1950,
          "purchaseUnits": 13,
          "unit": "stuks",
          "unitLabel": "stuk",
          "calculation": {
            "totalCourseGrams": 8100,
            "categoryPercentage": 45.0,
            "categoryGrams": 3645,
            "distributionPercentage": 50.0,
            "itemEdibleGrams": 1822.5,
            "yieldPercentage": 95.0,
            "brutograms": 1918.42,
            "unitWeightGrams": 150,
            "purchaseUnits": 13,
            "purchaseQuantity": 1950
          }
        },
        {
          "menuItemId": "item-uuid-6",
          "name": "Stokbrood",
          "itemType": "fixed",
          "category": "bread",
          "edibleGrams": 1440,
          "brutoGrams": 1440,
          "purchaseQuantity": 1500,
          "purchaseUnits": 6,
          "unit": "stuks",
          "unitLabel": "stuk",
          "calculation": {
            "gramsPerPerson": 80,
            "totalPersons": 18,
            "itemEdibleGrams": 1440,
            "yieldPercentage": 100.0,
            "brutograms": 1440,
            "unitWeightGrams": 250,
            "purchaseUnits": 6,
            "purchaseQuantity": 1500
          }
        }
      ],
      "subtotal": {
        "totalEdibleGrams": 8100,
        "totalBrutoGrams": 9500,
        "totalPurchaseGrams": 9700
      }
    }
  ],
  "grandTotal": {
    "totalEdibleGrams": 8100,
    "totalBrutoGrams": 9500,
    "totalPurchaseGrams": 9700
  }
}
```

---

### Error Responses

All endpoints follow consistent error format:

**403 Unauthorized:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Admin toegang vereist"
}
```

**404 Not Found:**
```json
{
  "error": "NOT_FOUND",
  "message": "Event niet gevonden"
}
```

**400 Bad Request:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Ongeldige invoer",
  "details": {
    "gramsPerPerson": "Moet groter dan 0 zijn"
  }
}
```

**500 Server Error:**
```json
{
  "error": "SERVER_ERROR",
  "message": "Er ging iets mis"
}
```

---

## Component Specifications

### 1. Page Component: `/admin/menu/page.tsx`

**Responsibility:** Main menu management page with event list and detail view

**Type:** Client Component (`'use client'`)

**State:**
```typescript
interface PageState {
  events: Event[];
  selectedEventId: string | null;
  selectedEvent: EventWithDetails | null;
  isLoading: boolean;
  error: string | null;

  // Dialog states
  eventDialogOpen: boolean;
  courseDialogOpen: boolean;
  menuItemDialogOpen: boolean;

  // Edit states
  editingEvent: Event | null;
  editingCourse: EventCourse | null;
  editingMenuItem: MenuItem | null;
  editingCourseId: string | null; // For adding item to specific course
}
```

**Key Functions:**
- `fetchEvents()` - Load all events
- `fetchEventDetails(eventId)` - Load selected event with courses and items
- `handleCreateEvent(data)` - Create new event
- `handleUpdateEvent(id, data)` - Update event
- `handleDeleteEvent(id)` - Delete event
- `handleCreateCourse(eventId, data)` - Create course
- `handleUpdateCourse(id, data)` - Update course
- `handleDeleteCourse(id)` - Delete course
- `handleCreateMenuItem(courseId, data)` - Create menu item
- `handleUpdateMenuItem(id, data)` - Update menu item
- `handleDeleteMenuItem(id)` - Delete menu item
- `handleSelectEvent(eventId)` - Switch to event detail view

**Layout:**
```tsx
<AuthGuard requireAdmin requireApproved>
  <DashboardLayout>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Event List */}
      <div className="lg:col-span-1">
        <EventList
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
          onCreateEvent={() => setEventDialogOpen(true)}
        />
      </div>

      {/* Right: Event Detail */}
      <div className="lg:col-span-2">
        {selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onCreateCourse={handleCreateCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onCreateMenuItem={handleCreateMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        ) : (
          <EmptyState message="Selecteer een event" />
        )}
      </div>
    </div>

    {/* Dialogs */}
    <EventDialog
      open={eventDialogOpen}
      event={editingEvent}
      onClose={() => setEventDialogOpen(false)}
      onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
    />

    <CourseDialog
      open={courseDialogOpen}
      course={editingCourse}
      onClose={() => setCourseDialogOpen(false)}
      onSave={editingCourse ? handleUpdateCourse : handleCreateCourse}
    />

    <MenuItemDialog
      open={menuItemDialogOpen}
      menuItem={editingMenuItem}
      courseId={editingCourseId}
      onClose={() => setMenuItemDialogOpen(false)}
      onSave={editingMenuItem ? handleUpdateMenuItem : handleCreateMenuItem}
    />
  </DashboardLayout>
</AuthGuard>
```

---

### 2. EventList Component

**Props:**
```typescript
interface EventListProps {
  events: Event[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onCreateEvent: () => void;
}
```

**Display:**
- List of event cards
- Highlight selected event
- Show event name, date, type, persons
- "Create Event" button at top

---

### 3. EventDetail Component

**Props:**
```typescript
interface EventDetailProps {
  event: EventWithDetails;
  onUpdateEvent: (id: string, data: Partial<Event>) => void;
  onDeleteEvent: (id: string) => void;
  onCreateCourse: (eventId: string, data: CreateCourseData) => void;
  onUpdateCourse: (id: string, data: Partial<EventCourse>) => void;
  onDeleteCourse: (id: string) => void;
  onCreateMenuItem: (courseId: string, data: CreateMenuItemData) => void;
  onUpdateMenuItem: (id: string, data: Partial<MenuItem>) => void;
  onDeleteMenuItem: (id: string) => void;
}
```

**Sections:**
1. Event info card (editable)
2. Courses section with nested menu items
3. Shopping list section (read-only, calculated)

---

### 4. CourseCard Component

**Props:**
```typescript
interface CourseCardProps {
  course: EventCourseWithItems;
  onUpdate: (data: Partial<EventCourse>) => void;
  onDelete: () => void;
  onCreateItem: (data: CreateMenuItemData) => void;
  onUpdateItem: (itemId: string, data: Partial<MenuItem>) => void;
  onDeleteItem: (itemId: string) => void;
}
```

**Display:**
- Course name, grams per person
- Edit/delete buttons
- List of menu items
- "Add Menu Item" button

---

### 5. MenuItemCard Component

**Props:**
```typescript
interface MenuItemCardProps {
  menuItem: MenuItem;
  onUpdate: (data: Partial<MenuItem>) => void;
  onDelete: () => void;
}
```

**Display:**
- Item name, type badge, category
- Yield percentage
- Type-specific properties (distribution %, g/p.p.)
- Edit/delete buttons
- Compact, list-item style

---

### 6. ShoppingListSection Component

**Props:**
```typescript
interface ShoppingListSectionProps {
  event: EventWithDetails;
  persons: number;
  averageMeatDistribution: MeatDistribution;
}
```

**Features:**
- Real-time calculation using `menu-calculations.ts`
- Display per course with subtotals
- Grand total at bottom
- Export button (print or Excel)
- Visual breakdown of calculations (optional tooltip/expand)

**Calculation:**
```tsx
const shoppingList = useMemo(() => {
  return calculateShoppingList(
    event.courses,
    persons,
    averageMeatDistribution
  );
}, [event.courses, persons, averageMeatDistribution]);
```

---

### 7. EventDialog Component

**Props:**
```typescript
interface EventDialogProps {
  open: boolean;
  event: Event | null; // null = create mode
  onClose: () => void;
  onSave: (data: CreateEventData | UpdateEventData) => void;
}
```

**Form Fields:**
- Name (text)
- Event type (select: bbq, diner, lunch, borrel, receptie, overig)
- Event date (date picker)
- Total persons (number)
- Status (select: draft, active, completed, cancelled)
- Notes (textarea)

---

### 8. CourseDialog Component

**Props:**
```typescript
interface CourseDialogProps {
  open: boolean;
  course: EventCourse | null;
  onClose: () => void;
  onSave: (data: CreateCourseData | UpdateCourseData) => void;
}
```

**Form Fields:**
- Name (text)
- Grams per person (number)
- Sort order (number)
- Notes (textarea)

---

### 9. MenuItemDialog Component

**Props:**
```typescript
interface MenuItemDialogProps {
  open: boolean;
  menuItem: MenuItem | null;
  courseId: string | null; // For create mode
  onClose: () => void;
  onSave: (data: CreateMenuItemData | UpdateMenuItemData) => void;
}
```

**Form Fields (Dynamic based on item type):**

**Common:**
- Name (text)
- Item type (select: protein, side, fixed)
- Category (select, filtered by type)
- Yield percentage (number, 0-100)
- Waste description (textarea)
- Unit label (text)
- Sort order (number)

**Type: Protein:**
- Distribution percentage (number, 0-100)
- Rounding grams (number)

**Type: Side:**
- Rounding grams (number)

**Type: Fixed:**
- Grams per person (number)
- Unit weight grams (number, optional)

**Validation:**
- Protein requires category in meat categories
- Protein requires distribution percentage
- Fixed requires grams per person
- Yield percentage must be > 0 and <= 100

---

## Calculation Engine

### File: `src/lib/menu-calculations.ts`

**Purpose:** Pure calculation functions for shopping list generation

#### Constants

```typescript
/**
 * Default rounding value for continuous items (grams)
 */
export const DEFAULT_ROUNDING_GRAMS = 100;

/**
 * Meat/protein category mapping
 * Maps to existing meat_distribution keys from food_drink_preferences
 */
export const PROTEIN_CATEGORIES = [
  'pork',
  'beef',
  'chicken',
  'game',
  'fish',
  'vegetarian',
] as const;

/**
 * All valid categories for menu items
 */
export const MENU_ITEM_CATEGORIES = [
  // Protein categories (maps to meat_distribution)
  'pork',
  'beef',
  'chicken',
  'game',
  'fish',
  'vegetarian',
  // Other categories
  'fruit',
  'vegetables',
  'salad',
  'bread',
  'sauce',
  'dairy',
  'other',
] as const;
```

#### Core Functions

**1. Get Average Meat Distribution**

```typescript
/**
 * Calculates average meat distribution from food preferences
 * Uses existing v1 data from food_drink_preferences table
 *
 * @param persons - Array of person preferences (from v1 API)
 * @returns Average percentage per category
 */
export function getAverageMeatDistribution(
  persons: PersonPreference[]
): MeatDistribution {
  if (persons.length === 0) {
    // Default distribution if no data
    return {
      pork: 20,
      beef: 20,
      chicken: 20,
      game: 10,
      fish: 15,
      vegetarian: 15,
    };
  }

  const totals: MeatDistribution = {
    pork: 0,
    beef: 0,
    chicken: 0,
    game: 0,
    fish: 0,
    vegetarian: 0,
  };

  // Sum all distributions
  persons.forEach((person) => {
    totals.pork += person.meatDistribution.pork;
    totals.beef += person.meatDistribution.beef;
    totals.chicken += person.meatDistribution.chicken;
    totals.game += person.meatDistribution.game;
    totals.fish += person.meatDistribution.fish;
    totals.vegetarian += person.meatDistribution.vegetarian;
  });

  // Calculate averages
  const count = persons.length;
  return {
    pork: totals.pork / count,
    beef: totals.beef / count,
    chicken: totals.chicken / count,
    game: totals.game / count,
    fish: totals.fish / count,
    vegetarian: totals.vegetarian / count,
  };
}
```

---

**2. Calculate Protein Item**

```typescript
/**
 * Calculates purchase quantity for a protein menu item
 *
 * Algorithm:
 * 1. Calculate total edible grams for the course: persons × course.gramsPerPerson
 * 2. Calculate category budget: total × avgDistribution[category] / 100
 * 3. Calculate item share: categoryBudget × item.distributionPercentage / 100
 * 4. Calculate bruto: itemEdible / (item.yieldPercentage / 100)
 * 5. Round to purchase quantity:
 *    - If unitWeightGrams: ceil(bruto / unitWeight) × unitWeight
 *    - Else: ceil(bruto / roundingGrams) × roundingGrams
 *
 * Example:
 * - Course: 450g per person, 18 persons = 8100g total
 * - Category: beef, avg 45% = 3645g beef budget
 * - Item: Picanha, 50% of beef = 1822.5g edible
 * - Yield: 85% → 1822.5 / 0.85 = 2144g bruto
 * - Rounding: 100g → ceil(2144 / 100) × 100 = 2200g purchase
 *
 * @param menuItem - The protein menu item
 * @param totalCourseGrams - Total edible grams for the course
 * @param avgMeatDistribution - Average meat distribution percentages
 * @returns Shopping list item with calculations
 */
export function calculateProteinItem(
  menuItem: MenuItem,
  totalCourseGrams: number,
  avgMeatDistribution: MeatDistribution
): ShoppingListItem {
  // Validate input
  if (menuItem.itemType !== 'protein') {
    throw new Error('Item type must be protein');
  }
  if (!menuItem.category || !PROTEIN_CATEGORIES.includes(menuItem.category as any)) {
    throw new Error('Invalid protein category');
  }
  if (menuItem.distributionPercentage === null) {
    throw new Error('Distribution percentage required for protein items');
  }

  // Step 1: Get category percentage
  const categoryPct = avgMeatDistribution[menuItem.category as keyof MeatDistribution];

  // Step 2: Calculate category budget (grams)
  const categoryGrams = totalCourseGrams * (categoryPct / 100);

  // Step 3: Calculate item's share of category
  const itemEdibleGrams = categoryGrams * (menuItem.distributionPercentage / 100);

  // Step 4: Calculate bruto (account for waste/yield)
  const brutoGrams = itemEdibleGrams / (menuItem.yieldPercentage / 100);

  // Step 5: Round to purchase quantity
  let purchaseQuantity: number;
  let purchaseUnits: number | null = null;

  if (menuItem.unitWeightGrams) {
    // Fixed unit (e.g., hamburgers)
    purchaseUnits = Math.ceil(brutoGrams / menuItem.unitWeightGrams);
    purchaseQuantity = purchaseUnits * menuItem.unitWeightGrams;
  } else {
    // Continuous (e.g., meat by weight)
    const rounding = menuItem.roundingGrams || DEFAULT_ROUNDING_GRAMS;
    purchaseQuantity = Math.ceil(brutoGrams / rounding) * rounding;
  }

  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    itemType: 'protein',
    category: menuItem.category,
    edibleGrams: itemEdibleGrams,
    brutoGrams,
    purchaseQuantity,
    purchaseUnits,
    unit: menuItem.unitWeightGrams ? menuItem.unitLabel || 'stuks' : 'g',
    unitLabel: menuItem.unitLabel,
    calculation: {
      totalCourseGrams,
      categoryPercentage: categoryPct,
      categoryGrams,
      distributionPercentage: menuItem.distributionPercentage,
      itemEdibleGrams,
      yieldPercentage: menuItem.yieldPercentage,
      brutoGrams,
      unitWeightGrams: menuItem.unitWeightGrams,
      roundingGrams: menuItem.roundingGrams,
      purchaseUnits,
      purchaseQuantity,
    },
  };
}
```

---

**3. Calculate Side Item**

```typescript
/**
 * Calculates purchase quantity for a side menu item
 *
 * Algorithm:
 * 1. Count number of side items in the course
 * 2. Divide total course grams evenly: total / numberOfSides
 * 3. Calculate bruto: edible / (yieldPercentage / 100)
 * 4. Round to purchase quantity
 *
 * Example:
 * - Course: 450g per person, 18 persons = 8100g total
 * - Number of sides: 2 (courgette, salad)
 * - Per item: 8100 / 2 = 4050g edible
 * - Yield: 90% → 4050 / 0.90 = 4500g bruto
 * - Rounding: 100g → ceil(4500 / 100) × 100 = 4500g purchase
 *
 * @param menuItem - The side menu item
 * @param totalCourseGrams - Total edible grams for the course
 * @param numberOfSides - Number of side items in the course
 * @returns Shopping list item with calculations
 */
export function calculateSideItem(
  menuItem: MenuItem,
  totalCourseGrams: number,
  numberOfSides: number
): ShoppingListItem {
  // Validate input
  if (menuItem.itemType !== 'side') {
    throw new Error('Item type must be side');
  }
  if (numberOfSides === 0) {
    throw new Error('Number of sides must be greater than 0');
  }

  // Step 1: Divide course total evenly
  const itemEdibleGrams = totalCourseGrams / numberOfSides;

  // Step 2: Calculate bruto
  const brutoGrams = itemEdibleGrams / (menuItem.yieldPercentage / 100);

  // Step 3: Round to purchase quantity
  let purchaseQuantity: number;
  let purchaseUnits: number | null = null;

  if (menuItem.unitWeightGrams) {
    purchaseUnits = Math.ceil(brutoGrams / menuItem.unitWeightGrams);
    purchaseQuantity = purchaseUnits * menuItem.unitWeightGrams;
  } else {
    const rounding = menuItem.roundingGrams || DEFAULT_ROUNDING_GRAMS;
    purchaseQuantity = Math.ceil(brutoGrams / rounding) * rounding;
  }

  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    itemType: 'side',
    category: menuItem.category,
    edibleGrams: itemEdibleGrams,
    brutoGrams,
    purchaseQuantity,
    purchaseUnits,
    unit: menuItem.unitWeightGrams ? menuItem.unitLabel || 'stuks' : 'g',
    unitLabel: menuItem.unitLabel,
    calculation: {
      totalCourseGrams,
      numberOfSides,
      perItemGrams: itemEdibleGrams,
      yieldPercentage: menuItem.yieldPercentage,
      brutoGrams,
      unitWeightGrams: menuItem.unitWeightGrams,
      roundingGrams: menuItem.roundingGrams,
      purchaseUnits,
      purchaseQuantity,
    },
  };
}
```

---

**4. Calculate Fixed Item**

```typescript
/**
 * Calculates purchase quantity for a fixed menu item
 *
 * Algorithm:
 * 1. Calculate total edible: persons × item.gramsPerPerson
 * 2. Calculate bruto: edible / (yieldPercentage / 100)
 * 3. Round to purchase quantity
 *
 * Example:
 * - Item: Stokbrood, 80g per person
 * - Persons: 18 → 18 × 80 = 1440g edible
 * - Yield: 100% → 1440 / 1.00 = 1440g bruto
 * - Unit: 250g per stuk → ceil(1440 / 250) = 6 stuks = 1500g purchase
 *
 * @param menuItem - The fixed menu item
 * @param totalPersons - Total number of persons
 * @returns Shopping list item with calculations
 */
export function calculateFixedItem(
  menuItem: MenuItem,
  totalPersons: number
): ShoppingListItem {
  // Validate input
  if (menuItem.itemType !== 'fixed') {
    throw new Error('Item type must be fixed');
  }
  if (menuItem.gramsPerPerson === null) {
    throw new Error('Grams per person required for fixed items');
  }

  // Step 1: Calculate total edible
  const itemEdibleGrams = totalPersons * menuItem.gramsPerPerson;

  // Step 2: Calculate bruto
  const brutoGrams = itemEdibleGrams / (menuItem.yieldPercentage / 100);

  // Step 3: Round to purchase quantity
  let purchaseQuantity: number;
  let purchaseUnits: number | null = null;

  if (menuItem.unitWeightGrams) {
    purchaseUnits = Math.ceil(brutoGrams / menuItem.unitWeightGrams);
    purchaseQuantity = purchaseUnits * menuItem.unitWeightGrams;
  } else {
    const rounding = menuItem.roundingGrams || DEFAULT_ROUNDING_GRAMS;
    purchaseQuantity = Math.ceil(brutoGrams / rounding) * rounding;
  }

  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    itemType: 'fixed',
    category: menuItem.category,
    edibleGrams: itemEdibleGrams,
    brutoGrams,
    purchaseQuantity,
    purchaseUnits,
    unit: menuItem.unitWeightGrams ? menuItem.unitLabel || 'stuks' : 'g',
    unitLabel: menuItem.unitLabel,
    calculation: {
      gramsPerPerson: menuItem.gramsPerPerson,
      totalPersons,
      itemEdibleGrams,
      yieldPercentage: menuItem.yieldPercentage,
      brutoGrams,
      unitWeightGrams: menuItem.unitWeightGrams,
      roundingGrams: menuItem.roundingGrams,
      purchaseUnits,
      purchaseQuantity,
    },
  };
}
```

---

**5. Calculate Course Shopping List**

```typescript
/**
 * Calculates shopping list for a single course
 *
 * @param course - The course with menu items
 * @param totalPersons - Total number of persons
 * @param avgMeatDistribution - Average meat distribution
 * @returns Shopping list for the course
 */
export function calculateCourseShoppingList(
  course: EventCourseWithItems,
  totalPersons: number,
  avgMeatDistribution: MeatDistribution
): ShoppingListCourse {
  const totalCourseGrams = totalPersons * course.gramsPerPerson;

  // Count side items for even distribution
  const numberOfSides = course.menuItems.filter(
    (item) => item.itemType === 'side'
  ).length;

  // Calculate each menu item
  const items: ShoppingListItem[] = course.menuItems.map((menuItem) => {
    switch (menuItem.itemType) {
      case 'protein':
        return calculateProteinItem(
          menuItem,
          totalCourseGrams,
          avgMeatDistribution
        );

      case 'side':
        return calculateSideItem(
          menuItem,
          totalCourseGrams,
          numberOfSides
        );

      case 'fixed':
        return calculateFixedItem(menuItem, totalPersons);

      default:
        throw new Error(`Unknown item type: ${menuItem.itemType}`);
    }
  });

  // Calculate subtotals
  const subtotal = {
    totalEdibleGrams: items.reduce((sum, item) => sum + item.edibleGrams, 0),
    totalBrutoGrams: items.reduce((sum, item) => sum + item.brutoGrams, 0),
    totalPurchaseGrams: items.reduce((sum, item) => sum + item.purchaseQuantity, 0),
  };

  return {
    courseId: course.id,
    courseName: course.name,
    gramsPerPerson: course.gramsPerPerson,
    items,
    subtotal,
  };
}
```

---

**6. Calculate Complete Shopping List**

```typescript
/**
 * Calculates complete shopping list for an event
 *
 * @param event - Event with courses and menu items
 * @param totalPersons - Total number of persons
 * @param avgMeatDistribution - Average meat distribution
 * @returns Complete shopping list with all courses
 */
export function calculateShoppingList(
  courses: EventCourseWithItems[],
  totalPersons: number,
  avgMeatDistribution: MeatDistribution
): ShoppingList {
  // Calculate each course
  const courseShoppingLists = courses.map((course) =>
    calculateCourseShoppingList(course, totalPersons, avgMeatDistribution)
  );

  // Calculate grand total
  const grandTotal = {
    totalEdibleGrams: courseShoppingLists.reduce(
      (sum, course) => sum + course.subtotal.totalEdibleGrams,
      0
    ),
    totalBrutoGrams: courseShoppingLists.reduce(
      (sum, course) => sum + course.subtotal.totalBrutoGrams,
      0
    ),
    totalPurchaseGrams: courseShoppingLists.reduce(
      (sum, course) => sum + course.subtotal.totalPurchaseGrams,
      0
    ),
  };

  return {
    courses: courseShoppingLists,
    grandTotal,
  };
}
```

---

## TypeScript Interfaces

### Add to `src/types/index.ts`

```typescript
// =============================================================================
// MENU & SHOPPING LIST TYPES (US-014 v2)
// =============================================================================

/**
 * Meat distribution percentages
 * Used for calculating protein item quantities
 */
export interface MeatDistribution {
  pork: number;
  beef: number;
  chicken: number;
  game: number;
  fish: number;
  vegetarian: number;
}

/**
 * Event entity
 */
export interface Event {
  id: string;
  name: string;
  eventType: 'bbq' | 'diner' | 'lunch' | 'borrel' | 'receptie' | 'overig';
  eventDate: string | null; // ISO date string
  totalPersons: number | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  notes: string | null;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Event with course count (for list view)
 */
export interface EventWithCourseCount extends Event {
  courseCount: number;
}

/**
 * Event course entity
 */
export interface EventCourse {
  id: string;
  eventId: string;
  name: string;
  sortOrder: number;
  gramsPerPerson: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Menu item entity
 */
export interface MenuItem {
  id: string;
  courseId: string;
  name: string;
  itemType: 'protein' | 'side' | 'fixed';
  category: string | null;
  yieldPercentage: number; // 0-100
  wasteDescription: string | null;
  unitWeightGrams: number | null;
  unitLabel: string | null;
  roundingGrams: number | null;
  distributionPercentage: number | null; // Protein only
  gramsPerPerson: number | null; // Fixed only
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Event course with menu items
 */
export interface EventCourseWithItems extends EventCourse {
  menuItems: MenuItem[];
}

/**
 * Event with full details (courses and items)
 */
export interface EventWithDetails extends Event {
  courses: EventCourseWithItems[];
}

/**
 * Shopping list item (calculated result)
 */
export interface ShoppingListItem {
  menuItemId: string;
  name: string;
  itemType: 'protein' | 'side' | 'fixed';
  category: string | null;
  edibleGrams: number;
  brutoGrams: number;
  purchaseQuantity: number;
  purchaseUnits: number | null; // For fixed units (e.g., 13 hamburgers)
  unit: string; // 'g', 'kg', 'stuks', etc.
  unitLabel: string | null;
  calculation: {
    // Common fields
    yieldPercentage: number;
    brutoGrams: number;
    purchaseQuantity: number;

    // Protein-specific
    totalCourseGrams?: number;
    categoryPercentage?: number;
    categoryGrams?: number;
    distributionPercentage?: number;
    itemEdibleGrams?: number;

    // Side-specific
    numberOfSides?: number;
    perItemGrams?: number;

    // Fixed-specific
    gramsPerPerson?: number;
    totalPersons?: number;

    // Unit-specific
    unitWeightGrams?: number | null;
    roundingGrams?: number | null;
    purchaseUnits?: number | null;
  };
}

/**
 * Shopping list for a single course
 */
export interface ShoppingListCourse {
  courseId: string;
  courseName: string;
  gramsPerPerson: number;
  items: ShoppingListItem[];
  subtotal: {
    totalEdibleGrams: number;
    totalBrutoGrams: number;
    totalPurchaseGrams: number;
  };
}

/**
 * Complete shopping list for an event
 */
export interface ShoppingList {
  courses: ShoppingListCourse[];
  grandTotal: {
    totalEdibleGrams: number;
    totalBrutoGrams: number;
    totalPurchaseGrams: number;
  };
}

/**
 * Shopping list API response
 */
export interface ShoppingListResponse {
  event: {
    id: string;
    name: string;
    totalPersons: number;
  };
  averageMeatDistribution: MeatDistribution;
  courses: ShoppingListCourse[];
  grandTotal: {
    totalEdibleGrams: number;
    totalBrutoGrams: number;
    totalPurchaseGrams: number;
  };
}

/**
 * Form data for creating event
 */
export interface CreateEventData {
  name: string;
  eventType: Event['eventType'];
  eventDate: string | null;
  totalPersons: number | null;
  status: Event['status'];
  notes: string;
}

/**
 * Form data for creating course
 */
export interface CreateCourseData {
  name: string;
  sortOrder: number;
  gramsPerPerson: number;
  notes: string;
}

/**
 * Form data for creating menu item
 */
export interface CreateMenuItemData {
  name: string;
  itemType: MenuItem['itemType'];
  category: string | null;
  yieldPercentage: number;
  wasteDescription: string;
  unitWeightGrams: number | null;
  unitLabel: string;
  roundingGrams: number | null;
  distributionPercentage: number | null;
  gramsPerPerson: number | null;
  sortOrder: number;
  isActive: boolean;
}
```

---

## Integration Points

### Integration with v1 F&B Report

**Data Source:**
```typescript
// v2 uses the same data source as v1 for meat distribution
const { data: reportData } = await fetch('/api/admin/fb-report');

// Extract average meat distribution
const avgMeatDistribution = getAverageMeatDistribution(reportData.persons);

// Use for shopping list calculation
const shoppingList = calculateShoppingList(
  event.courses,
  event.totalPersons,
  avgMeatDistribution
);
```

**Shared Types:**
- `PersonPreference` (v1)
- `MeatDistribution` (used by both)
- `FBReportData` (v1)

**Shared Functions:**
- `getAverageMeatDistribution()` can reuse v1's `calculateMeatStats()` logic

---

### Integration with Existing Admin Patterns

**Authentication:**
```typescript
// Same pattern as v1
import { getUserFromRequest, isAdmin } from '@/lib/auth/jwt';

const adminUser = await getUserFromRequest(request);
if (!adminUser || !isAdmin(adminUser)) {
  return NextResponse.json(
    { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
    { status: 403 }
  );
}
```

**Page Layout:**
```typescript
// Same pattern as v1
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function MenuPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <DashboardLayout>
        {/* Content */}
      </DashboardLayout>
    </AuthGuard>
  );
}
```

**Database Client:**
```typescript
// Same pattern as v1
import { createServerClient } from '@/lib/supabase';

const supabase = createServerClient();
const { data, error } = await supabase
  .from('events')
  .select('*');
```

---

## Security Architecture

### Authentication & Authorization

**All v2 endpoints require:**
1. Valid JWT token (same as v1)
2. Admin role check (same as v1)
3. No participant access to menu management

**API Route Pattern:**
```typescript
export async function GET(request: NextRequest) {
  // 1. Authenticate
  const adminUser = await getUserFromRequest(request);
  if (!adminUser || !isAdmin(adminUser)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Admin toegang vereist' },
      { status: 403 }
    );
  }

  // 2. Process request
  // ...
}
```

### Data Protection

**No Sensitive Data:**
- Menu items are not participant-sensitive
- Shopping lists are admin-only
- No GDPR concerns (no personal data)

**Database Security:**
- CASCADE DELETE ensures orphan prevention
- Foreign key constraints enforce referential integrity
- Supabase RLS policies (admin-only access)

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── menu/
│   │       └── page.tsx                    [Main menu management page]
│   │
│   └── api/
│       └── admin/
│           ├── events/
│           │   ├── route.ts                [GET, POST events]
│           │   └── [id]/
│           │       ├── route.ts            [GET, PATCH, DELETE event]
│           │       └── courses/
│           │           └── route.ts        [GET, POST courses for event]
│           │
│           ├── courses/
│           │   └── [id]/
│           │       ├── route.ts            [PATCH, DELETE course]
│           │       └── items/
│           │           └── route.ts        [GET, POST menu items for course]
│           │
│           ├── menu-items/
│           │   └── [id]/
│           │       └── route.ts            [PATCH, DELETE menu item]
│           │
│           └── shopping-list/
│               └── [eventId]/
│                   └── route.ts            [GET shopping list]
│
├── components/
│   └── menu/                               [Menu-specific components]
│       ├── EventList.tsx
│       ├── EventCard.tsx
│       ├── EventDetail.tsx
│       ├── EventInfoCard.tsx
│       ├── CoursesSection.tsx
│       ├── CourseCard.tsx
│       ├── MenuItemCard.tsx
│       ├── ShoppingListSection.tsx
│       ├── CourseShoppingList.tsx
│       ├── ShoppingListTotal.tsx
│       ├── dialogs/
│       │   ├── EventDialog.tsx
│       │   ├── CourseDialog.tsx
│       │   └── MenuItemDialog.tsx
│       └── index.ts                        [Barrel export]
│
├── lib/
│   └── menu-calculations.ts                [NEW: Calculation engine]
│       ├── getAverageMeatDistribution()
│       ├── calculateProteinItem()
│       ├── calculateSideItem()
│       ├── calculateFixedItem()
│       ├── calculateCourseShoppingList()
│       └── calculateShoppingList()
│
└── types/
    └── index.ts                            [Add new types]
        ├── Event
        ├── EventCourse
        ├── MenuItem
        ├── ShoppingListItem
        └── ... (see TypeScript Interfaces section)
```

**Estimated File Counts:**
- API routes: 7 files (~150-200 lines each)
- Page component: 1 file (~400-500 lines)
- UI components: 13 files (~100-200 lines each)
- Calculation library: 1 file (~400-500 lines)
- Types: Updates to existing file (~200 new lines)

**Total: ~22 new files, ~3500-4000 lines of code**

---

## Implementation Roadmap

### Phase 1: Database & Types (Days 1-2)

**Tasks:**
1. Create database migration SQL
2. Run migration on dev environment
3. Verify CASCADE DELETE behavior
4. Add TypeScript interfaces to `src/types/index.ts`
5. Create calculation library skeleton in `src/lib/menu-calculations.ts`

**Deliverables:**
- Database tables created and tested
- Type-safe interfaces
- Calculation constants defined

**Validation:**
- TypeScript compiles without errors
- Database queries work correctly
- CASCADE DELETE confirmed with test data

---

### Phase 2: API Routes (Days 3-5)

**Tasks:**
1. Implement events API (`/api/admin/events/...`)
2. Implement courses API (`/api/admin/courses/...`)
3. Implement menu items API (`/api/admin/menu-items/...`)
4. Test CRUD operations with Postman/curl

**Deliverables:**
- All CRUD endpoints working
- Error handling in place
- Admin authentication enforced

**Validation:**
- All endpoints return correct data structure
- Validation catches invalid input
- 403 for non-admin users

---

### Phase 3: Calculation Engine (Days 6-7)

**Tasks:**
1. Implement `getAverageMeatDistribution()`
2. Implement `calculateProteinItem()`
3. Implement `calculateSideItem()`
4. Implement `calculateFixedItem()`
5. Implement `calculateCourseShoppingList()`
6. Implement `calculateShoppingList()`
7. Write unit tests for all functions

**Deliverables:**
- All calculation functions working
- Pure functions (no side effects)
- Unit tests passing

**Validation:**
- Manual calculations match function output
- Edge cases handled (0 persons, no items, etc.)
- Unit tests cover all branches

---

### Phase 4: Shopping List API (Day 8)

**Tasks:**
1. Implement `/api/admin/shopping-list/[eventId]`
2. Integrate with v1 F&B report API for meat distribution
3. Test with various event configurations

**Deliverables:**
- Shopping list API endpoint working
- Integration with v1 data
- Response format matches specification

**Validation:**
- Shopping list calculations correct
- Handles events with no courses
- Handles events with no persons

---

### Phase 5: UI Components - Dialogs (Days 9-10)

**Tasks:**
1. Build `EventDialog` component
2. Build `CourseDialog` component
3. Build `MenuItemDialog` component (with dynamic fields)
4. Add form validation

**Deliverables:**
- All dialog components working
- Form validation
- Proper state management

**Validation:**
- Dialogs open/close correctly
- Form validation catches errors
- Create/edit modes work

---

### Phase 6: UI Components - Lists & Cards (Days 11-13)

**Tasks:**
1. Build `EventList` component
2. Build `EventCard` component
3. Build `EventDetail` component
4. Build `EventInfoCard` component
5. Build `CoursesSection` component
6. Build `CourseCard` component
7. Build `MenuItemCard` component
8. Wire up CRUD operations

**Deliverables:**
- All list/card components rendering
- CRUD operations working
- Framer Motion animations

**Validation:**
- Components render correctly
- CRUD operations update UI
- Animations smooth

---

### Phase 7: Shopping List Display (Days 14-15)

**Tasks:**
1. Build `ShoppingListSection` component
2. Build `CourseShoppingList` component
3. Build `ShoppingListTotal` component
4. Implement real-time calculations
5. Add export functionality (print/Excel)

**Deliverables:**
- Shopping list display working
- Real-time calculation updates
- Export functionality

**Validation:**
- Shopping list displays correctly
- Calculations update when menu changes
- Export generates correct file

---

### Phase 8: Main Page Integration (Days 16-17)

**Tasks:**
1. Build `/admin/menu/page.tsx`
2. Integrate all components
3. Wire up state management
4. Add loading/error states
5. Add empty states

**Deliverables:**
- Complete page working
- All components integrated
- State management robust

**Validation:**
- Page loads correctly
- All CRUD operations work end-to-end
- Loading/error states display properly

---

### Phase 9: Testing & Polish (Days 18-20)

**Tasks:**
1. Cross-browser testing (Chrome, Firefox, Safari)
2. Responsive design testing
3. Edge case testing (0 items, large numbers, etc.)
4. Performance testing
5. UI polish (spacing, colors, animations)
6. Accessibility audit

**Deliverables:**
- Cross-browser compatibility
- Responsive on mobile/tablet
- Edge cases handled
- Performance acceptable
- WCAG 2.1 AA compliance

**Validation:**
- Works on all browsers
- Mobile UX smooth
- No critical bugs
- Performance < 500ms for calculations

---

### Phase 10: Documentation & Deployment (Days 21-22)

**Tasks:**
1. Update CLAUDE.md
2. Write inline code comments
3. Create user guide for admins
4. Deployment checklist
5. Knowledge transfer

**Deliverables:**
- Updated documentation
- User guide
- Deployment ready

---

**Total Estimated Time: 22 days (4.5 weeks)**

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **CASCADE DELETE issues** | High | Low | Thorough testing with sample data; verify foreign key constraints |
| **Calculation accuracy** | High | Medium | Unit tests for all calculation functions; manual verification against design doc |
| **Complex form validation** | Medium | Medium | Use existing form patterns; validate on both client and server |
| **State management complexity** | Medium | Medium | Keep state local to page; use React hooks patterns |
| **Performance with many items** | Medium | Low | Test with 50+ items per course; optimize if needed |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **User confusion (3 item types)** | Medium | Medium | Clear UI labels; help text; tooltips explaining each type |
| **Incorrect yield percentages** | High | Medium | LLM suggestions (Phase 2); validation warnings for unusual values |
| **Missing persons count** | Medium | High | Require manual input; add auto-calculate button for approved registrations |
| **Shopping list inaccuracy** | High | Low | Extensive testing; comparison with manual calculations |

### Data Integrity Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Orphaned courses** | Medium | Low | CASCADE DELETE ensures cleanup |
| **Duplicate events** | Low | Medium | UI confirmation before creating similar events |
| **Invalid percentages** | Medium | Medium | Database CHECK constraints; form validation |
| **Distribution % not summing to 100** | Medium | High | UI warning if protein item distributions don't sum to 100% per category |

### Integration Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **v1 data changes** | High | Low | v1 is stable; meat_distribution field is core to system |
| **Average calculation mismatch** | Medium | Low | Use existing v1 calculation logic; unit tests |
| **No preference data available** | Medium | Medium | Default distribution fallback (20/20/20/10/15/15) |

---

## Architecture Decision Records

### ADR-001: Single Page UI vs Multi-Page

**Status:** Accepted

**Context:**
Admin UI could be split across multiple pages (events list, event detail, course detail) or integrated into a single page with nested views.

**Decision:**
Use single integrated page with event list on left, event detail on right.

**Rationale:**
- Faster navigation (no page reloads)
- Better context (see event list while editing)
- Follows existing admin patterns (side-by-side layouts)
- Simpler state management (all in one component tree)

**Consequences:**
- Positive: Better UX, faster interactions
- Positive: Less code (no separate pages)
- Negative: Initial page load slightly larger
- Mitigation: Use React.memo for expensive components

---

### ADR-002: Shopping List Placement

**Status:** Accepted

**Context:**
Shopping list could be separate page (`/admin/inkooplijst`) or section within event detail.

**Decision:**
Shopping list as section within event detail view.

**Rationale:**
- Immediate context (menu items visible above)
- No navigation required
- Real-time updates as menu changes
- Follows single-page design from ADR-001

**Consequences:**
- Positive: Better UX (all info in one place)
- Positive: Real-time calculation updates
- Negative: Page becomes longer
- Mitigation: Scroll-to buttons; sticky section headers

---

### ADR-003: LLM Integration Timing

**Status:** Accepted

**Context:**
LLM integration for yield percentage suggestions could be built in Phase 1 or deferred to Phase 2.

**Decision:**
Defer LLM integration to Phase 2 (separate iteration).

**Rationale:**
- Core functionality doesn't depend on it
- Reduces initial complexity
- API endpoint can be added later without breaking changes
- Focus on manual input workflow first

**Consequences:**
- Positive: Faster initial delivery
- Positive: Simpler Phase 1 implementation
- Negative: Manual entry of yield percentages initially
- Mitigation: Provide reference table of common yields in UI

---

### ADR-004: Persons Count Source

**Status:** Accepted

**Context:**
Persons count could be manual input, auto-calculated from approved registrations, or both.

**Decision:**
Manual input with optional auto-calculate button.

**Rationale:**
- Flexibility for planning before registrations
- Admin can plan for more/fewer persons than registered
- Auto-calculate useful but not required
- Simple implementation

**Consequences:**
- Positive: Flexible for all use cases
- Positive: Simple to implement
- Negative: Risk of forgetting to update persons count
- Mitigation: Show warning if persons count differs from approved registrations

---

### ADR-005: CRUD API Design

**Status:** Accepted

**Context:**
API could use RESTful routes per resource or consolidated endpoints with action parameters.

**Decision:**
RESTful routes per resource (events, courses, menu-items).

**Rationale:**
- Consistent with Next.js App Router patterns
- Clear separation of concerns
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Easy to understand and maintain

**Consequences:**
- Positive: Standard RESTful API
- Positive: Clear endpoint naming
- Negative: More endpoint files
- Mitigation: Use consistent patterns across all endpoints

---

### ADR-006: State Management Strategy

**Status:** Accepted

**Context:**
State could be managed with Zustand (global store), React hooks (local state), or React Query (server state).

**Decision:**
Local state with React hooks.

**Rationale:**
- Admin-only feature (no cross-page persistence needed)
- Single-page UI (all state in one component tree)
- Simpler than global store for this use case
- Follows existing admin page patterns

**Consequences:**
- Positive: Simple implementation
- Positive: No external dependencies
- Negative: State lost on page refresh
- Mitigation: Not an issue for admin workflow (refresh reloads fresh data)

---

### ADR-007: Calculation Engine Location

**Status:** Accepted

**Context:**
Calculations could be in API routes (server-side), client-side library, or both.

**Decision:**
Separate client-side calculation library (`menu-calculations.ts`).

**Rationale:**
- Real-time updates as menu changes
- No API call latency for calculations
- Calculations are pure math (no sensitive data)
- Reusable and testable
- Clean separation from v1 calculations

**Consequences:**
- Positive: Fast, responsive UI
- Positive: Offline-capable
- Positive: Easy to unit test
- Negative: Calculations run on every menu change
- Mitigation: Use useMemo to prevent unnecessary recalculations

---

## Appendix: Calculation Examples

### Example 1: Nieuwjaars BBQ 2026

**Event Details:**
- Name: Nieuwjaars BBQ 2026
- Type: BBQ
- Persons: 18 (15 participants + 3 partners)
- Average preferences: Beef 45%, Chicken 28%, Fish 20%, Pork 5%, Game 3%, Veg 0%

**Course: Hoofdgerecht (450g per person)**

**Menu Items:**

1. **Picanha (Protein, Beef, 50% of beef)**
   ```
   Total course grams: 18 × 450 = 8,100g
   Beef budget: 8,100 × 45% = 3,645g
   Picanha share: 3,645 × 50% = 1,822.5g edible
   Yield: 85% → 1,822.5 / 0.85 = 2,144g bruto
   Rounding: 100g → ceil(2,144 / 100) × 100 = 2,200g purchase
   ```

2. **Hamburger (Protein, Beef, 50% of beef, 150g per stuk)**
   ```
   Beef budget: 3,645g
   Hamburger share: 3,645 × 50% = 1,822.5g edible
   Yield: 95% → 1,822.5 / 0.95 = 1,918g bruto
   Unit: 150g per stuk → ceil(1,918 / 150) = 13 stuks
   Purchase: 13 × 150 = 1,950g
   ```

3. **Kipsaté (Protein, Chicken, 100%, 30g per stokje)**
   ```
   Chicken budget: 8,100 × 28% = 2,268g
   Kipsaté share: 2,268 × 100% = 2,268g edible
   Yield: 95% → 2,268 / 0.95 = 2,387g bruto
   Unit: 30g per stokje → ceil(2,387 / 30) = 80 stokjes
   Purchase: 80 × 30 = 2,400g
   ```

4. **Hele zalm (Protein, Fish, 100%)**
   ```
   Fish budget: 8,100 × 20% = 1,620g
   Zalm share: 1,620 × 100% = 1,620g edible
   Yield: 55% → 1,620 / 0.55 = 2,945g bruto
   Rounding: 500g → ceil(2,945 / 500) × 500 = 3,000g purchase
   ```

5. **Courgette (Side, 1 of 1 sides)**
   ```
   Course total: 8,100g
   Number of sides: 1
   Per side: 8,100 / 1 = 8,100g edible
   Yield: 90% → 8,100 / 0.90 = 9,000g bruto
   Rounding: 100g → ceil(9,000 / 100) × 100 = 9,000g purchase
   ```

6. **Stokbrood (Fixed, 80g per person, 250g per stuk)**
   ```
   Total: 18 × 80 = 1,440g edible
   Yield: 100% → 1,440 / 1.00 = 1,440g bruto
   Unit: 250g per stuk → ceil(1,440 / 250) = 6 stuks
   Purchase: 6 × 250 = 1,500g
   ```

**Shopping List Output:**
```
Hoofdgerecht (450g p.p.)
├─ Picanha: 2.2 kg
├─ Hamburger: 13 stuks (1.95 kg)
├─ Kipsaté: 80 stokjes (2.4 kg)
├─ Hele zalm: 3.0 kg
├─ Courgette: 9.0 kg
└─ Stokbrood: 6 stuks (1.5 kg)

Subtotaal: ~20.1 kg
```

---

## Next Steps: Handoff to Development Team

**Architect → Backend Coder:**

1. **Database Migration:** `docs/user-stories/US-014-Admin-F&B/ARCHITECT-v2.md#database-schema`
   - Create migration file
   - Test CASCADE DELETE
   - Verify constraints

2. **API Routes:** `docs/user-stories/US-014-Admin-F&B/ARCHITECT-v2.md#api-design`
   - Events CRUD API
   - Courses CRUD API
   - Menu Items CRUD API
   - Shopping List API

3. **Calculation Library:** `docs/user-stories/US-014-Admin-F&B/ARCHITECT-v2.md#calculation-engine`
   - Pure calculation functions
   - Unit tests for all functions

**Architect → Frontend Coder:**

4. **Page Component:** `docs/user-stories/US-014-Admin-F&B/ARCHITECT-v2.md#component-specifications`
   - Main menu management page
   - State management

5. **UI Components:** `docs/user-stories/US-014-Admin-F&B/ARCHITECT-v2.md#component-specifications`
   - Event list and cards
   - Course cards
   - Menu item cards
   - Shopping list display
   - Dialogs (Event, Course, MenuItem)

**Architect → Test Engineer:**

6. **Test Specifications:** (separate document)
   - Unit tests for calculations
   - Integration tests for API routes
   - E2E tests for CRUD flows
   - Performance benchmarks

**All questions and clarifications should reference this architecture document.**

---

**Document Status:** Architecture Complete - Ready for Implementation
**Last Updated:** 2026-01-29
**Version:** 2.0
**Approved By:** PACT Architect
