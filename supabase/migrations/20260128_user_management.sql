-- =============================================================================
-- User Management System Migration
-- =============================================================================
-- File: supabase/migrations/20260128_user_management.sql
-- Purpose: Add user management capabilities for admin panel (US-017)
--          Includes soft delete, role management, and point adjustment features
-- Dependencies: Requires existing 'users' and 'points_ledger' tables from
--               001_initial_schema.sql and 20260117_auth_system.sql
--
-- New Features:
-- - Soft delete mechanism (deactivate/reactivate users)
-- - User activity tracking (is_active flag)
-- - Deletion audit trail (deleted_at, deleted_by, deletion_reason)
-- - Atomic points adjustment function (add_user_points)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- EXTEND EXISTING USERS TABLE
-- =============================================================================

-- Add user management fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.is_active IS 'Flag indicating if user account is active (soft delete mechanism)';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was deactivated/soft deleted';
COMMENT ON COLUMN users.deleted_by IS 'Admin user ID who deactivated this user';
COMMENT ON COLUMN users.deletion_reason IS 'Admin-provided reason for user deactivation';

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for filtering active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Composite index for common admin queries (active users by role)
CREATE INDEX IF NOT EXISTS idx_users_active_role
  ON users(is_active, role)
  WHERE is_active = TRUE;

-- Index for audit trail queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Index for finding users by name (case-insensitive search)
CREATE INDEX IF NOT EXISTS idx_users_name_lower ON users(LOWER(name));

-- =============================================================================
-- FUNCTIONS FOR USER MANAGEMENT
-- =============================================================================

-- Function: Add or subtract points from user with automatic ledger entry
-- This ensures atomic updates to both users.total_points and points_ledger
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_source TEXT,
  p_points INTEGER,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_category_column TEXT;
  v_result BOOLEAN := FALSE;
BEGIN
  -- Validate source
  IF p_source NOT IN ('registration', 'prediction', 'quiz', 'game', 'bonus') THEN
    RAISE EXCEPTION 'Invalid source: %. Must be one of: registration, prediction, quiz, game, bonus', p_source;
  END IF;

  -- Determine category column based on source
  v_category_column := p_source || '_points';

  -- Update user points atomically
  -- Use dynamic SQL to update the correct category column
  EXECUTE format(
    'UPDATE users SET total_points = total_points + $1, %I = %I + $1 WHERE id = $2',
    v_category_column, v_category_column
  ) USING p_points, p_user_id;

  -- Check if user was found
  IF FOUND THEN
    -- Insert ledger entry
    INSERT INTO points_ledger (user_id, source, points, description)
    VALUES (p_user_id, p_source, p_points, p_description);

    v_result := TRUE;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_user_points(UUID, TEXT, INTEGER, TEXT) IS
  'Atomically add or subtract points from user account. Updates both total_points and category-specific points, and creates points_ledger entry. Returns TRUE on success, FALSE if user not found.';

-- Function: Get user statistics for admin overview
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  inactive_users BIGINT,
  pending_users BIGINT,
  approved_users BIGINT,
  admin_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE is_active = TRUE)::BIGINT AS active_users,
    COUNT(*) FILTER (WHERE is_active = FALSE)::BIGINT AS inactive_users,
    COUNT(*) FILTER (WHERE registration_status = 'pending')::BIGINT AS pending_users,
    COUNT(*) FILTER (WHERE registration_status = 'approved')::BIGINT AS approved_users,
    COUNT(*) FILTER (WHERE role = 'admin')::BIGINT AS admin_users
  FROM users;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_stats() IS
  'Returns aggregate statistics about users for admin dashboard overview';

-- Function: Deactivate user (soft delete)
CREATE OR REPLACE FUNCTION deactivate_user(
  p_user_id UUID,
  p_deleted_by UUID,
  p_deletion_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN := FALSE;
BEGIN
  UPDATE users
  SET
    is_active = FALSE,
    deleted_at = NOW(),
    deleted_by = p_deleted_by,
    deletion_reason = p_deletion_reason
  WHERE id = p_user_id
    AND is_active = TRUE; -- Only deactivate if currently active

  IF FOUND THEN
    v_result := TRUE;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION deactivate_user(UUID, UUID, TEXT) IS
  'Soft delete user by setting is_active=FALSE and recording audit trail. Returns TRUE on success, FALSE if user not found or already inactive.';

-- Function: Reactivate user
CREATE OR REPLACE FUNCTION reactivate_user(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN := FALSE;
BEGIN
  UPDATE users
  SET
    is_active = TRUE,
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL
  WHERE id = p_user_id
    AND is_active = FALSE; -- Only reactivate if currently inactive

  IF FOUND THEN
    v_result := TRUE;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reactivate_user(UUID) IS
  'Reactivate soft-deleted user by setting is_active=TRUE and clearing deletion metadata. Returns TRUE on success, FALSE if user not found or already active.';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Note: Using permissive development policies. Production policies should be
-- more restrictive and enforce admin-only access for sensitive operations.

-- Users table already has RLS enabled from previous migration
-- No additional policies needed for user management features

-- =============================================================================
-- VERIFICATION AND TESTING
-- =============================================================================

-- Run these queries to verify migration:
-- SELECT * FROM get_user_stats();
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('is_active', 'deleted_at', 'deleted_by', 'deletion_reason');
-- SELECT proname, pg_get_function_arguments(oid) FROM pg_proc WHERE proname LIKE '%user%';

-- Test add_user_points function:
-- SELECT add_user_points((SELECT id FROM users LIMIT 1), 'bonus', 10, 'Test bonus points');

-- Test deactivate_user function:
-- SELECT deactivate_user((SELECT id FROM users WHERE role = 'participant' LIMIT 1), (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'Test deactivation');

-- Test reactivate_user function:
-- SELECT reactivate_user((SELECT id FROM users WHERE is_active = FALSE LIMIT 1));
