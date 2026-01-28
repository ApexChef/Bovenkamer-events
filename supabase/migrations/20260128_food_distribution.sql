-- Migration: Add meat and drink distribution columns
-- Date: 2026-01-28
-- Purpose: Store percentage-based distribution for meat and drink preferences

-- Add meat_distribution JSONB column
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS meat_distribution JSONB DEFAULT '{
  "pork": 25,
  "beef": 25,
  "chicken": 25,
  "game": 15,
  "fish": 10
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
COMMENT ON COLUMN registrations.meat_distribution IS 'JSONB with percentage distribution for meat preferences (pork, beef, chicken, game, fish) - total 100%';
COMMENT ON COLUMN registrations.drink_distribution IS 'JSONB with percentage distribution for drink preferences (softDrinks, wine, beer) - total 100%';
