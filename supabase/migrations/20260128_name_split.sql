-- Migration: Split name into first_name and last_name
-- Date: 2026-01-28
-- Purpose: Store first and last names separately for better display and personalization

-- Add first_name and last_name columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add first_name and last_name columns to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS partner_first_name TEXT,
ADD COLUMN IF NOT EXISTS partner_last_name TEXT;

-- Populate first_name and last_name from existing name field in users table
UPDATE users
SET
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
WHERE name IS NOT NULL AND name != '' AND first_name IS NULL;

-- Populate first_name and last_name in registrations from users table (via user_id join)
-- This handles cases where registrations.name doesn't exist
UPDATE registrations r
SET
  first_name = SPLIT_PART(u.name, ' ', 1),
  last_name = TRIM(SUBSTRING(u.name FROM POSITION(' ' IN u.name) + 1))
FROM users u
WHERE r.user_id = u.id
  AND u.name IS NOT NULL
  AND u.name != ''
  AND r.first_name IS NULL;

-- Populate partner first/last name from partner_name (if that column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'partner_name'
  ) THEN
    EXECUTE '
      UPDATE registrations
      SET
        partner_first_name = SPLIT_PART(partner_name, '' '', 1),
        partner_last_name = TRIM(SUBSTRING(partner_name FROM POSITION('' '' IN partner_name) + 1))
      WHERE partner_name IS NOT NULL AND partner_name != '''' AND partner_first_name IS NULL
    ';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN users.first_name IS 'First name of the user';
COMMENT ON COLUMN users.last_name IS 'Last name of the user';
COMMENT ON COLUMN registrations.first_name IS 'First name of the registrant';
COMMENT ON COLUMN registrations.last_name IS 'Last name of the registrant';
COMMENT ON COLUMN registrations.partner_first_name IS 'First name of partner (if bringing +1)';
COMMENT ON COLUMN registrations.partner_last_name IS 'Last name of partner (if bringing +1)';
