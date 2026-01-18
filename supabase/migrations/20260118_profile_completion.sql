-- Migration: Add profile_completion column to users table
-- Date: 2026-01-18
-- Purpose: Track progressive registration profile completion percentage

-- Add profile_completion column
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN users.profile_completion IS 'Profile completion percentage (0-100) for progressive registration';

-- Create index for leaderboard queries that might filter by completion
CREATE INDEX IF NOT EXISTS idx_users_profile_completion ON users(profile_completion);
