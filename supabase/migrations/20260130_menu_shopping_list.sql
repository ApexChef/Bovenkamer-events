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
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

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
CREATE INDEX IF NOT EXISTS idx_event_courses_event_id ON event_courses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_courses_sort_order ON event_courses(event_id, sort_order);

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

  -- Purchased (actual invoice data)
  purchased_quantity NUMERIC(10,2),  -- Actually purchased amount (grams)

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
COMMENT ON COLUMN menu_items.purchased_quantity IS 'Actually purchased amount in grams (from invoice)';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_menu_items_course_id ON menu_items(course_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_type ON menu_items(item_type);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active);

-- =============================================================================
-- Updated_at Triggers
-- =============================================================================

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_courses_updated_at ON event_courses;
CREATE TRIGGER update_event_courses_updated_at
  BEFORE UPDATE ON event_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Add purchased_quantity column if table already existed without it
-- =============================================================================
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS purchased_quantity NUMERIC(10,2);

-- =============================================================================
-- Sample Data has been moved to 20260130_replace_sample_data.sql
-- Run that migration separately to insert event data.
-- =============================================================================
