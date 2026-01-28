-- Migration: Create food_drink_preferences table
-- Date: 2026-01-28
-- Purpose: Separate table for food and drink preferences (for user and partner)

CREATE TABLE IF NOT EXISTS food_drink_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_type TEXT NOT NULL CHECK (person_type IN ('self', 'partner')),

  -- Food preferences
  dietary_requirements TEXT,
  meat_distribution JSONB DEFAULT '{
    "pork": 20,
    "beef": 20,
    "chicken": 20,
    "game": 10,
    "fish": 15,
    "vegetarian": 15
  }'::jsonb,
  veggies_preference INT DEFAULT 3 CHECK (veggies_preference >= 0 AND veggies_preference <= 5),
  sauces_preference INT DEFAULT 3 CHECK (sauces_preference >= 0 AND sauces_preference <= 5),

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

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user per person_type
  UNIQUE(user_id, person_type)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_food_drink_user ON food_drink_preferences(user_id);

-- Comments
COMMENT ON TABLE food_drink_preferences IS 'Food and drink preferences for users and their partners';
COMMENT ON COLUMN food_drink_preferences.person_type IS 'self = user themselves, partner = their plus one';
COMMENT ON COLUMN food_drink_preferences.meat_distribution IS 'Percentage distribution across meat types (total 100%)';
COMMENT ON COLUMN food_drink_preferences.drink_distribution IS 'Percentage distribution across drink types (total 100%)';
