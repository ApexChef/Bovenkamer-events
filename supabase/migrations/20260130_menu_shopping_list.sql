-- Migration: Menu & Shopping List Tables
-- Date: 2026-01-30
-- US-014: Admin - Menu & Inkoopberekening
--
-- Tables: events, event_courses, menu_items
--
-- Description: Event, course, and menu item management for shopping list generation
--              Supports meat distribution calculation with yield percentages

-- =============================================================================
-- Helper Function: update_updated_at_column
-- =============================================================================
-- This function may already exist from other migrations, so we use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. events Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('bbq', 'diner', 'lunch', 'borrel', 'receptie', 'overig')),
  event_date DATE,

  -- Persons calculation
  total_persons INT,  -- Manual input or auto-calculated from registrations

  -- Status
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),

  -- Additional info
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE events IS 'Events that require F&B preparation (e.g., Nieuwjaars BBQ)';
COMMENT ON COLUMN events.event_type IS 'Type of event: bbq, diner, lunch, borrel, receptie, overig';
COMMENT ON COLUMN events.total_persons IS 'Total number of persons attending (manual or calculated)';
COMMENT ON COLUMN events.status IS 'draft, active, completed, or cancelled';

-- Indexes for common queries
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);

-- =============================================================================
-- 2. event_courses Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS event_courses (
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

COMMENT ON TABLE event_courses IS 'Courses within an event (e.g., appetizer, main course, dessert)';
COMMENT ON COLUMN event_courses.grams_per_person IS 'Target edible grams per person for this course';
COMMENT ON COLUMN event_courses.sort_order IS 'Display order within the event';

-- Indexes for common queries
CREATE INDEX idx_event_courses_event_id ON event_courses(event_id);
CREATE INDEX idx_event_courses_sort_order ON event_courses(event_id, sort_order);

-- =============================================================================
-- 3. menu_items Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  course_id UUID NOT NULL REFERENCES event_courses(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,  -- e.g., "Picanha", "Ananas van de grill"

  -- Calculation type
  item_type TEXT NOT NULL
    CHECK (item_type IN ('protein', 'side', 'fixed')),

  -- Category (for protein items: maps to meat_distribution keys)
  category TEXT
    CHECK (category IN (
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

  -- Business logic constraints
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

COMMENT ON TABLE menu_items IS 'Individual menu items within a course with purchase calculation parameters';
COMMENT ON COLUMN menu_items.item_type IS 'protein = distributed by meat preferences, side = shared, fixed = fixed grams per person';
COMMENT ON COLUMN menu_items.category IS 'Category for filtering and protein distribution (pork, beef, chicken, etc.)';
COMMENT ON COLUMN menu_items.yield_percentage IS 'Percentage of purchased weight that is edible (e.g., 85% after removing bones/skin)';
COMMENT ON COLUMN menu_items.waste_description IS 'Description of waste/prep (e.g., "Remove shell and core")';
COMMENT ON COLUMN menu_items.unit_weight_grams IS 'Weight of a single unit (e.g., 150g per hamburger) - NULL if continuous';
COMMENT ON COLUMN menu_items.unit_label IS 'Label for the unit (e.g., "stuk", "stokje", "fles")';
COMMENT ON COLUMN menu_items.rounding_grams IS 'Round purchase weight to this value (e.g., 100g increments)';
COMMENT ON COLUMN menu_items.distribution_percentage IS 'Percentage of protein budget for this item (protein type only)';
COMMENT ON COLUMN menu_items.grams_per_person IS 'Fixed grams per person (fixed type only)';

-- Indexes for common queries
CREATE INDEX idx_menu_items_course_id ON menu_items(course_id);
CREATE INDEX idx_menu_items_type ON menu_items(item_type);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_active ON menu_items(is_active);

-- =============================================================================
-- Updated_at Triggers
-- =============================================================================

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

-- =============================================================================
-- Sample Data - Nieuwjaars BBQ 2026
-- =============================================================================

-- Sample event
INSERT INTO events (name, event_type, event_date, total_persons, status, notes)
VALUES (
  'Nieuwjaars BBQ 2026',
  'bbq',
  '2026-01-04',
  18,
  'draft',
  'Jaarvergadering op locatie Boy Boom'
)
ON CONFLICT DO NOTHING;

-- Insert sample courses and menu items
DO $$
DECLARE
  v_event_id UUID;
  v_course_hoofdgerecht UUID;
  v_course_dessert UUID;
BEGIN
  -- Get the event ID
  SELECT id INTO v_event_id
  FROM events
  WHERE name = 'Nieuwjaars BBQ 2026';

  -- Course 1: Hoofdgerecht
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Hoofdgerecht', 1, 450, 'Inclusief vlees, groente en bijgerechten')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_course_hoofdgerecht;

  -- Get course ID if it already existed
  IF v_course_hoofdgerecht IS NULL THEN
    SELECT id INTO v_course_hoofdgerecht
    FROM event_courses
    WHERE event_id = v_event_id AND name = 'Hoofdgerecht';
  END IF;

  -- Menu items for Hoofdgerecht
  INSERT INTO menu_items (
    course_id, name, item_type, category,
    yield_percentage, waste_description,
    distribution_percentage, unit_weight_grams, unit_label,
    sort_order
  ) VALUES
    -- Protein items
    (
      v_course_hoofdgerecht, 'Picanha', 'protein', 'beef',
      85.00, 'Vet afsnijden',
      50.00, NULL, 'kg',
      1
    ),
    (
      v_course_hoofdgerecht, 'Hamburger', 'protein', 'beef',
      95.00, 'Minimaal verlies',
      50.00, 150, 'stuk',
      2
    ),
    (
      v_course_hoofdgerecht, 'Kipsaté', 'protein', 'chicken',
      95.00, 'Voorgebakken, minimaal verlies',
      100.00, 40, 'stokje',
      3
    ),
    (
      v_course_hoofdgerecht, 'Hele zalm', 'protein', 'fish',
      55.00, 'Kop, staart en graat verwijderen',

        100.00, NULL, 'kg',
      4
    )
  ON CONFLICT DO NOTHING;

  -- Side dishes
  INSERT INTO menu_items (
    course_id, name, item_type, category,
    yield_percentage, waste_description,
    unit_label, rounding_grams,
    sort_order
  ) VALUES
    (
      v_course_hoofdgerecht, 'Courgette van de grill', 'side', 'vegetables',
      90.00, 'Uiteinden verwijderen',
      'kg', 100,
      10
    ),
    (
      v_course_hoofdgerecht, 'Ananas van de grill', 'side', 'fruit',
      75.00, 'Schil en kern verwijderen',
      'stuk', 1,
      11
    ),
    (
      v_course_hoofdgerecht, 'Groene salade', 'side', 'salad',
      85.00, 'Buitenbladen verwijderen',
      'krop', 1,
      12
    )
  ON CONFLICT DO NOTHING;

  -- Fixed items
  INSERT INTO menu_items (
    course_id, name, item_type, category,
    yield_percentage, grams_per_person,
    unit_weight_grams, unit_label,
    sort_order
  ) VALUES
    (
      v_course_hoofdgerecht, 'Stokbrood', 'fixed', 'bread',
      100.00, 80,
      400, 'stuk',
      20
    ),
    (
      v_course_hoofdgerecht, 'Kruidenboter', 'fixed', 'dairy',
      100.00, 15,
      250, 'pakje',
      21
    )
  ON CONFLICT DO NOTHING;

  -- Course 2: Dessert
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Dessert', 2, 150, 'Lichte afsluiting')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_course_dessert;

  -- Get course ID if it already existed
  IF v_course_dessert IS NULL THEN
    SELECT id INTO v_course_dessert
    FROM event_courses
    WHERE event_id = v_event_id AND name = 'Dessert';
  END IF;

  -- Menu items for Dessert
  INSERT INTO menu_items (
    course_id, name, item_type, category,
    yield_percentage, grams_per_person,
    unit_weight_grams, unit_label,
    sort_order
  ) VALUES
    (
      v_course_dessert, 'Tiramisu', 'fixed', 'other',
      100.00, 150,
      NULL, 'portie',
      1
    )
  ON CONFLICT DO NOTHING;

END $$;

-- =============================================================================
-- Verification Queries (commented out - uncomment to test)
-- =============================================================================

-- View complete event hierarchy with menu items
/*
SELECT
  e.name AS event,
  e.event_type,
  e.event_date,
  e.total_persons,
  ec.name AS course,
  ec.grams_per_person AS course_grams_pp,
  mi.name AS item,
  mi.item_type,
  mi.category,
  mi.yield_percentage,
  mi.distribution_percentage,
  mi.grams_per_person AS item_grams_pp,
  mi.unit_weight_grams,
  mi.unit_label
FROM events e
LEFT JOIN event_courses ec ON e.id = ec.event_id
LEFT JOIN menu_items mi ON ec.id = mi.course_id
WHERE e.name = 'Nieuwjaars BBQ 2026'
ORDER BY ec.sort_order, mi.sort_order;
*/

-- Test CASCADE DELETE behavior
/*
-- This should cascade delete all courses and menu items
DELETE FROM events WHERE name = 'Nieuwjaars BBQ 2026';

-- Verify cascade worked
SELECT
  (SELECT COUNT(*) FROM events WHERE name = 'Nieuwjaars BBQ 2026') AS events_count,
  (SELECT COUNT(*) FROM event_courses ec
   JOIN events e ON e.id = ec.event_id
   WHERE e.name = 'Nieuwjaars BBQ 2026') AS courses_count,
  (SELECT COUNT(*) FROM menu_items mi
   JOIN event_courses ec ON ec.id = mi.course_id
   JOIN events e ON e.id = ec.event_id
   WHERE e.name = 'Nieuwjaars BBQ 2026') AS menu_items_count;
*/

-- Check constraints
/*
-- This should fail: protein without category
INSERT INTO menu_items (course_id, name, item_type, yield_percentage)
SELECT id, 'Test Item', 'protein', 100.00
FROM event_courses LIMIT 1;

-- This should fail: protein without distribution_percentage
INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage)
SELECT id, 'Test Item', 'protein', 'beef', 100.00
FROM event_courses LIMIT 1;

-- This should fail: fixed without grams_per_person
INSERT INTO menu_items (course_id, name, item_type, yield_percentage)
SELECT id, 'Test Item', 'fixed', 100.00
FROM event_courses LIMIT 1;

-- This should fail: yield_percentage > 100
INSERT INTO menu_items (course_id, name, item_type, yield_percentage)
SELECT id, 'Test Item', 'side', 150.00
FROM event_courses LIMIT 1;
*/

-- View sample data summary
/*
SELECT
  e.name AS event,
  e.total_persons,
  COUNT(DISTINCT ec.id) AS num_courses,
  COUNT(mi.id) AS num_items,
  SUM(CASE WHEN mi.item_type = 'protein' THEN 1 ELSE 0 END) AS num_protein,
  SUM(CASE WHEN mi.item_type = 'side' THEN 1 ELSE 0 END) AS num_sides,
  SUM(CASE WHEN mi.item_type = 'fixed' THEN 1 ELSE 0 END) AS num_fixed
FROM events e
LEFT JOIN event_courses ec ON e.id = ec.event_id
LEFT JOIN menu_items mi ON ec.id = mi.course_id
WHERE e.name = 'Nieuwjaars BBQ 2026'
GROUP BY e.id, e.name, e.total_persons;
*/
