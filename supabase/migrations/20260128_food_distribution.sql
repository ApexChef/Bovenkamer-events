-- Migration: Add meat and drink distribution columns
-- Date: 2026-01-28
-- Purpose: Store percentage-based distribution for protein and drink preferences

-- Add meat_distribution JSONB column (includes meat, fish, and vegetarian options)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS meat_distribution JSONB DEFAULT '{
  "pork": 20,
  "beef": 20,
  "chicken": 20,
  "game": 10,
  "fish": 15,
  "vegetarian": 15
}'::jsonb;

-- Add drink_distribution JSONB column
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS drink_distribution JSONB DEFAULT '{
  "softDrinks": 20,
  "wine": 40,
  "beer": 40
}'::jsonb;

-- Update food_preferences to only contain veggies and sauces (remove old meat/drink values)
-- Note: This preserves existing data, just adds new distribution columns

-- Add comments for documentation
COMMENT ON COLUMN registrations.meat_distribution IS 'JSONB with percentage distribution for protein preferences (pork, beef, chicken, game, fish, vegetarian) - total 100%';
COMMENT ON COLUMN registrations.drink_distribution IS 'JSONB with percentage distribution for drink preferences (softDrinks, wine, beer) - total 100%';
