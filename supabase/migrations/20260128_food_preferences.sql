-- Migration: Add food preferences fields to registrations
-- Date: 2026-01-28
-- Purpose: Store food and drink preferences for BBQ planning

-- Add food_preferences JSONB column
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS food_preferences JSONB DEFAULT '{
  "pork": 3,
  "beef": 3,
  "chicken": 3,
  "game": 2,
  "fish": 2,
  "veggies": 3,
  "sauces": 3,
  "softDrinks": 2,
  "wine": 3,
  "beer": 3
}'::jsonb;

-- Add partner_dietary_requirements column (if not exists from earlier migration)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS partner_dietary_requirements TEXT DEFAULT '';

-- Comment for documentation
COMMENT ON COLUMN registrations.food_preferences IS 'JSONB with food/drink preferences (0-5 scale): pork, beef, chicken, game, fish, veggies, sauces, softDrinks, wine, beer';
COMMENT ON COLUMN registrations.partner_dietary_requirements IS 'Dietary requirements for partner (if bringing +1)';
