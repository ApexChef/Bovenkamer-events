-- =============================================================================
-- Authentication System Migration
-- =============================================================================
-- File: supabase/migrations/20260117_auth_system.sql
-- Purpose: Complete authentication system with PIN-based auth, email verification,
--          and admin approval workflow
-- Dependencies: Requires existing 'users' and 'registrations' tables
--
-- Tables Created:
-- - auth_pins: Stores hashed PINs for user authentication
-- - email_verifications: Email verification tokens and status
-- - expected_participants: Pre-approved participants list
-- - rate_limits: Rate limiting tracking for security
--
-- Extends existing tables:
-- - users: Adds email_verified, registration_status, approval fields
-- - registrations: Adds status and cancellation fields
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- NEW AUTHENTICATION TABLES
-- =============================================================================

-- Auth PINs table - stores hashed PINs with security features
CREATE TABLE IF NOT EXISTS auth_pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT pin_hash_not_empty CHECK (LENGTH(pin_hash) > 0),
  CONSTRAINT pin_salt_not_empty CHECK (LENGTH(pin_salt) > 0),
  CONSTRAINT failed_attempts_non_negative CHECK (failed_attempts >= 0)
);

COMMENT ON TABLE auth_pins IS 'Stores hashed PINs for user authentication with security tracking';
COMMENT ON COLUMN auth_pins.pin_hash IS 'bcrypt hash of the PIN (format: XX##)';
COMMENT ON COLUMN auth_pins.pin_salt IS 'Salt used for hashing (bcrypt includes salt in hash, this is for verification)';
COMMENT ON COLUMN auth_pins.failed_attempts IS 'Counter for failed login attempts, reset on successful login';
COMMENT ON COLUMN auth_pins.locked_until IS 'Account lockout timestamp after too many failed attempts';

-- Email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT token_not_empty CHECK (LENGTH(token) > 0),
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

COMMENT ON TABLE email_verifications IS 'Email verification tokens for new registrations';
COMMENT ON COLUMN email_verifications.token IS 'Unique verification token sent via email';
COMMENT ON COLUMN email_verifications.expires_at IS 'Token expiration timestamp (typically 24-48 hours)';
COMMENT ON COLUMN email_verifications.verified_at IS 'Timestamp when email was verified, NULL if not verified';

-- Expected participants table
CREATE TABLE IF NOT EXISTS expected_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  email_hint TEXT,
  is_registered BOOLEAN DEFAULT FALSE,
  registered_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_admin_id UUID REFERENCES users(id),
  notes TEXT,

  -- Constraints
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

COMMENT ON TABLE expected_participants IS 'Pre-approved participants list for streamlined registration';
COMMENT ON COLUMN expected_participants.name IS 'Expected participant full name';
COMMENT ON COLUMN expected_participants.email_hint IS 'Optional email hint for participant (e.g., j.***@gmail.com)';
COMMENT ON COLUMN expected_participants.is_registered IS 'Flag indicating if this participant has registered';
COMMENT ON COLUMN expected_participants.registered_by_user_id IS 'User ID who registered with this name';

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'email')),
  endpoint TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique constraint
  CONSTRAINT unique_rate_limit UNIQUE (identifier, identifier_type, endpoint)
);

COMMENT ON TABLE rate_limits IS 'Rate limiting tracking for API endpoints';
COMMENT ON COLUMN rate_limits.identifier IS 'IP address or email being rate limited';
COMMENT ON COLUMN rate_limits.identifier_type IS 'Type of identifier: ip or email';
COMMENT ON COLUMN rate_limits.endpoint IS 'API endpoint path being rate limited';
COMMENT ON COLUMN rate_limits.window_start IS 'Start of current rate limit window';

-- =============================================================================
-- EXTEND EXISTING TABLES
-- =============================================================================

-- Extend users table with authentication fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'pending'
  CHECK (registration_status IN ('pending', 'approved', 'rejected', 'cancelled'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_features TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN users.email_verified IS 'Flag indicating if email has been verified via token';
COMMENT ON COLUMN users.registration_status IS 'Current status: pending, approved, rejected, or cancelled';
COMMENT ON COLUMN users.rejection_reason IS 'Admin-provided reason for registration rejection';
COMMENT ON COLUMN users.approved_at IS 'Timestamp when registration was approved';
COMMENT ON COLUMN users.approved_by IS 'Admin user ID who approved the registration';
COMMENT ON COLUMN users.blocked_features IS 'Array of feature names blocked for this user';
COMMENT ON COLUMN users.last_login_at IS 'Last successful login timestamp';

-- Extend registrations table with status tracking
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

COMMENT ON COLUMN registrations.status IS 'Registration status matching user status';
COMMENT ON COLUMN registrations.cancelled_at IS 'Timestamp when user cancelled attendance';
COMMENT ON COLUMN registrations.cancellation_reason IS 'User-provided cancellation reason';

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_registration_status ON users(registration_status);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

-- Composite index for common auth queries
CREATE INDEX IF NOT EXISTS idx_users_auth_status
  ON users(email, email_verified, registration_status)
  WHERE registration_status != 'cancelled';

-- Auth PINs indexes
CREATE INDEX IF NOT EXISTS idx_auth_pins_user_id ON auth_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_pins_locked ON auth_pins(locked_until)
  WHERE locked_until IS NOT NULL;

-- Expected participants indexes
CREATE INDEX IF NOT EXISTS idx_expected_participants_name ON expected_participants(name);
CREATE INDEX IF NOT EXISTS idx_expected_participants_registered
  ON expected_participants(is_registered);

-- Email verifications indexes
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at
  ON email_verifications(expires_at)
  WHERE verified_at IS NULL;

-- Composite index for active verification lookup
-- Note: Cannot use NOW() in index predicate (not IMMUTABLE)
-- Instead, use a simple partial index for unverified tokens
CREATE INDEX IF NOT EXISTS idx_email_verifications_active
  ON email_verifications(user_id, expires_at)
  WHERE verified_at IS NULL;

-- Registrations indexes
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);

-- Rate limits indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier
  ON rate_limits(identifier, identifier_type, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON rate_limits(window_start DESC);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update auth_pins.updated_at on changes
CREATE TRIGGER update_auth_pins_updated_at
  BEFORE UPDATE ON auth_pins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-mark expected participant as registered
CREATE OR REPLACE FUNCTION mark_participant_registered()
RETURNS TRIGGER AS $$
BEGIN
  -- When user is approved, mark them in expected_participants
  IF NEW.registration_status = 'approved' AND OLD.registration_status != 'approved' THEN
    UPDATE expected_participants
    SET is_registered = TRUE,
        registered_by_user_id = NEW.id
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
      AND is_registered = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-mark participant when user approved
CREATE TRIGGER auto_mark_participant_registered
  AFTER UPDATE OF registration_status ON users
  FOR EACH ROW
  EXECUTE FUNCTION mark_participant_registered();

-- Function: Sync registration status with user status
CREATE OR REPLACE FUNCTION sync_registration_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync registration status when user status changes
  IF NEW.registration_status != OLD.registration_status THEN
    UPDATE registrations
    SET status = NEW.registration_status
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Keep registration and user status in sync
CREATE TRIGGER sync_registration_status_trigger
  AFTER UPDATE OF registration_status ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_registration_status();

-- Function: Cleanup expired verification tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verifications
  WHERE verified_at IS NULL
    AND expires_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_verifications() IS
  'Cleanup verification tokens expired more than 7 days ago. Returns count of deleted records.';

-- Function: Cleanup old rate limit entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_rate_limits() IS
  'Cleanup rate limit records older than 24 hours. Returns count of deleted records.';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Strategy: Start with permissive policies for development, tighten for production

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE expected_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Development policies (allow all for initial testing)
CREATE POLICY "dev_allow_all_users" ON users FOR ALL USING (true);
CREATE POLICY "dev_allow_all_auth_pins" ON auth_pins FOR ALL USING (true);
CREATE POLICY "dev_allow_all_expected" ON expected_participants FOR ALL USING (true);
CREATE POLICY "dev_allow_all_verifications" ON email_verifications FOR ALL USING (true);
CREATE POLICY "dev_allow_all_registrations" ON registrations FOR ALL USING (true);
CREATE POLICY "dev_allow_all_rate_limits" ON rate_limits FOR ALL USING (true);

-- Note: Production policies to be deployed in future migration
-- See architecture document for production RLS policy specifications

-- =============================================================================
-- INITIAL DATA (OPTIONAL)
-- =============================================================================

-- Uncomment to add initial expected participants
-- INSERT INTO expected_participants (name, email_hint, notes, created_by_admin_id)
-- VALUES
--   ('John Doe', 'j.***@example.com', 'Stammitglied', NULL),
--   ('Jane Smith', 'j.smith@***', 'Bestaand lid', NULL);

-- =============================================================================
-- VERIFICATION AND TESTING
-- =============================================================================

-- Run these queries to verify migration:
-- SELECT COUNT(*) FROM auth_pins;
-- SELECT COUNT(*) FROM email_verifications;
-- SELECT COUNT(*) FROM expected_participants;
-- SELECT COUNT(*) FROM rate_limits;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
