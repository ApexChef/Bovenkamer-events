-- Migration: Add drink preference columns
-- Date: 2026-01-28
-- Purpose: Store detailed drink preferences (bubbles, soft drinks, water)

-- Add starts_with_bubbles column (boolean: yes/no for starting with champagne/prosecco)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS starts_with_bubbles BOOLEAN DEFAULT NULL;

-- Add bubble_type column (champagne or prosecco/cava if starts_with_bubbles is true)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS bubble_type TEXT DEFAULT NULL;

-- Add soft_drink_preference column (cola, sinas, spa_rood, overige)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS soft_drink_preference TEXT DEFAULT NULL;

-- Add soft_drink_other column (free text if overige is selected)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS soft_drink_other TEXT DEFAULT NULL;

-- Add water_preference column (sparkling or flat)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS water_preference TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN registrations.starts_with_bubbles IS 'Whether user wants to start with champagne/prosecco';
COMMENT ON COLUMN registrations.bubble_type IS 'Type of bubbles: champagne or prosecco';
COMMENT ON COLUMN registrations.soft_drink_preference IS 'Preferred soft drink: cola, sinas, spa_rood, overige';
COMMENT ON COLUMN registrations.soft_drink_other IS 'Custom soft drink if overige selected';
COMMENT ON COLUMN registrations.water_preference IS 'Water preference: sparkling or flat';
