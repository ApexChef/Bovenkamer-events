-- Migration: Add missing profile fields to registrations table
-- Date: 2026-01-28
-- Purpose: Support progressive profile completion with additional data fields

-- Add birth_date column (full date, in addition to existing birth_year)
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add skills as JSONB (to store multiple skill selections per category)
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{}';

-- Add JKV Historie fields
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS jkv_join_year INTEGER;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS jkv_exit_year INTEGER;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS bovenkamer_join_year INTEGER;

-- Add Borrel statistics fields
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS borrel_count_2025 INTEGER DEFAULT 0;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS borrel_planning_2026 INTEGER DEFAULT 0;

-- Add attendance confirmation field
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS attendance_confirmed BOOLEAN;

-- Make birth_year nullable (since we now have birth_date as alternative)
ALTER TABLE registrations ALTER COLUMN birth_year DROP NOT NULL;

-- Make primary_skill nullable (since we now have skills JSONB)
ALTER TABLE registrations ALTER COLUMN primary_skill DROP NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN registrations.birth_date IS 'Full birth date (optional, for age calculation)';
COMMENT ON COLUMN registrations.skills IS 'JSONB object with skill selections per category (food_prep, bbq_grill, etc.)';
COMMENT ON COLUMN registrations.jkv_join_year IS 'Year user joined Junior Kamer Venray';
COMMENT ON COLUMN registrations.jkv_exit_year IS 'Year user left Junior Kamer Venray (or NULL if still active)';
COMMENT ON COLUMN registrations.bovenkamer_join_year IS 'Year user joined Bovenkamer';
COMMENT ON COLUMN registrations.borrel_count_2025 IS 'Number of borrels attended in 2025';
COMMENT ON COLUMN registrations.borrel_planning_2026 IS 'Planned number of borrels for 2026';
COMMENT ON COLUMN registrations.attendance_confirmed IS 'Whether user confirmed attendance for the event';
