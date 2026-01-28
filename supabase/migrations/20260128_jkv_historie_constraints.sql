-- Migration: Update JKV historie constraints
-- Date: 2026-01-28
-- Purpose: All Bovenkamer members are ex-JKV members (no "nog actief" option)
--          Exit year must be >= 2023 (Bovenkamer founding year)
--          Exit year must be >= join year

-- Clean up any 'nog_actief' string values that might exist
-- Convert them to 2023 (Bovenkamer founding year)
UPDATE registrations
SET jkv_exit_year = 2023
WHERE jkv_exit_year IS NULL AND jkv_join_year IS NOT NULL;

-- Add check constraint: exit year must be between 2000 and 2023
-- (Bovenkamer exists since 2023, so no one can exit JKV after that to join Bovenkamer)
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS chk_jkv_exit_year_range;

ALTER TABLE registrations
ADD CONSTRAINT chk_jkv_exit_year_range
CHECK (jkv_exit_year IS NULL OR (jkv_exit_year >= 2000 AND jkv_exit_year <= 2023));

-- Add check constraint: exit year must be >= join year
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS chk_jkv_exit_after_join;

ALTER TABLE registrations
ADD CONSTRAINT chk_jkv_exit_after_join
CHECK (jkv_exit_year IS NULL OR jkv_join_year IS NULL OR jkv_exit_year >= jkv_join_year);

-- Add check constraint: join year must be realistic (1980-2023)
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS chk_jkv_join_year_range;

ALTER TABLE registrations
ADD CONSTRAINT chk_jkv_join_year_range
CHECK (jkv_join_year IS NULL OR (jkv_join_year >= 1980 AND jkv_join_year <= 2023));

-- Comments for documentation
COMMENT ON CONSTRAINT chk_jkv_exit_year_range ON registrations IS 'JKV exit year must be between 2000 and 2023 (Bovenkamer founding year)';
COMMENT ON CONSTRAINT chk_jkv_exit_after_join ON registrations IS 'JKV exit year must be >= join year';
COMMENT ON CONSTRAINT chk_jkv_join_year_range ON registrations IS 'JKV join year must be between 1980 and 2023';
