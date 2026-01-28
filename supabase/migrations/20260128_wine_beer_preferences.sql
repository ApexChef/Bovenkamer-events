-- Migration: Add wine and beer preference fields
-- Date: 2026-01-28
-- Purpose: Support red/white wine slider and pils/speciaal beer choice
-- Related: US-015 Food & Beverage Preferences

-- Add wine preference column (0-100, where 0=red, 100=white)
ALTER TABLE food_drink_preferences
ADD COLUMN wine_preference INT DEFAULT NULL
CHECK (wine_preference >= 0 AND wine_preference <= 100);

-- Add beer type column
ALTER TABLE food_drink_preferences
ADD COLUMN beer_type TEXT DEFAULT NULL
CHECK (beer_type IN ('pils', 'speciaal'));

-- Update default drink distribution to start at 0
ALTER TABLE food_drink_preferences
ALTER COLUMN drink_distribution SET DEFAULT '{
  "softDrinks": 0,
  "wine": 0,
  "beer": 0
}'::jsonb;

-- Comments for documentation
COMMENT ON COLUMN food_drink_preferences.wine_preference IS
  'Wine color preference: 0 = 100% red, 50 = mix, 100 = 100% white. NULL if wine <= 10%.';

COMMENT ON COLUMN food_drink_preferences.beer_type IS
  'Beer type preference: pils or speciaal. NULL if beer = 0%.';

COMMENT ON COLUMN food_drink_preferences.drink_distribution IS
  'Percentage distribution across drink types (total 100%). Default 0/0/0 to track user input.';
