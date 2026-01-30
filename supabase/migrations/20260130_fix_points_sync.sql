-- =============================================================================
-- Fix: Points Synchronisation — users ↔ points_ledger
-- =============================================================================
-- File: supabase/migrations/20260130_fix_points_sync.sql
-- Problem: Most code paths INSERT into points_ledger but never update the
--          matching columns on the users table (registration_points,
--          prediction_points, quiz_points, total_points). Only the admin
--          add_user_points() RPC kept both in sync.
--
-- Solution:
--   A) Extend the source CHECK constraint to include 'prediction_results'
--   B) Create a trigger on points_ledger that auto-updates users on INSERT
--   C) Run a one-time reconciliation to fix existing data
-- =============================================================================

-- =============================================================================
-- STEP 0: Add missing bonus_points column to users
-- =============================================================================
-- The original schema has registration_points, prediction_points, quiz_points,
-- game_points but no bonus_points. The add_user_points() RPC already assumed
-- it existed (bonus → bonus_points). Add it now.

ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0;

COMMENT ON COLUMN users.bonus_points IS 'Points from bonus awards (e.g. payment completion)';

-- =============================================================================
-- STEP 1: Extend source CHECK constraint
-- =============================================================================
-- The prediction-results calculator uses source = 'prediction_results',
-- which is not in the current CHECK list. Add it.

ALTER TABLE points_ledger
  DROP CONSTRAINT IF EXISTS points_ledger_source_check;

ALTER TABLE points_ledger
  ADD CONSTRAINT points_ledger_source_check
  CHECK (source IN ('registration', 'prediction', 'prediction_results', 'quiz', 'game', 'bonus'));

-- =============================================================================
-- STEP 2: Trigger function — sync users on every points_ledger INSERT
-- =============================================================================
CREATE OR REPLACE FUNCTION sync_user_points_on_ledger_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_category_column TEXT;
BEGIN
  -- Map ledger source → users column
  CASE NEW.source
    WHEN 'registration' THEN
      v_category_column := 'registration_points';
    WHEN 'prediction' THEN
      v_category_column := 'prediction_points';
    WHEN 'prediction_results' THEN
      v_category_column := 'prediction_points';
    WHEN 'quiz' THEN
      v_category_column := 'quiz_points';
    WHEN 'game' THEN
      v_category_column := 'game_points';
    WHEN 'bonus' THEN
      v_category_column := 'bonus_points';
    ELSE
      -- Fallback: only update total_points
      UPDATE users
        SET total_points = total_points + NEW.points
      WHERE id = NEW.user_id;
      RETURN NEW;
  END CASE;

  -- Atomically update both the category column and total_points
  EXECUTE format(
    'UPDATE users SET %I = %I + $1, total_points = total_points + $1 WHERE id = $2',
    v_category_column, v_category_column
  ) USING NEW.points, NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_user_points_on_ledger_insert() IS
  'Trigger function: keeps users point columns in sync whenever a row is inserted into points_ledger.';

-- Attach the trigger (drop first to make migration re-runnable)
DROP TRIGGER IF EXISTS trg_sync_user_points ON points_ledger;

CREATE TRIGGER trg_sync_user_points
  AFTER INSERT ON points_ledger
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_points_on_ledger_insert();

-- =============================================================================
-- STEP 3: One-time reconciliation of existing data
-- =============================================================================
-- Recalculate category columns from the ledger.
-- game_points is intentionally LEFT UNTOUCHED — it is managed separately
-- by /api/game/scores (set to user's best burger_stack score).

UPDATE users u
SET
  registration_points = COALESCE(sub.reg, 0),
  prediction_points   = COALESCE(sub.pred, 0),
  quiz_points         = COALESCE(sub.qz, 0),
  bonus_points        = COALESCE(sub.bon, 0),
  total_points        = COALESCE(sub.reg, 0)
                      + COALESCE(sub.pred, 0)
                      + COALESCE(sub.qz, 0)
                      + COALESCE(sub.bon, 0)
                      + u.game_points          -- preserve existing game_points
FROM (
  SELECT
    pl.user_id,
    SUM(pl.points) FILTER (WHERE pl.source = 'registration')                              AS reg,
    SUM(pl.points) FILTER (WHERE pl.source IN ('prediction', 'prediction_results'))        AS pred,
    SUM(pl.points) FILTER (WHERE pl.source = 'quiz')                                       AS qz,
    SUM(pl.points) FILTER (WHERE pl.source = 'bonus')                                      AS bon
  FROM points_ledger pl
  GROUP BY pl.user_id
) sub
WHERE u.id = sub.user_id;

-- Also zero-out users who have NO ledger entries at all (except game_points)
UPDATE users
SET
  registration_points = 0,
  prediction_points   = 0,
  quiz_points         = 0,
  bonus_points        = 0,
  total_points        = game_points
WHERE id NOT IN (SELECT DISTINCT user_id FROM points_ledger WHERE user_id IS NOT NULL);

-- =============================================================================
-- STEP 4: Update add_user_points() to avoid double-counting
-- =============================================================================
-- The existing RPC manually updates users AND inserts into points_ledger.
-- With the trigger in place the INSERT would fire the trigger, causing a
-- double update on users. Rewrite so it only does the INSERT; the trigger
-- handles the rest.

CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_source TEXT,
  p_points INTEGER,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN := FALSE;
BEGIN
  -- Validate source
  IF p_source NOT IN ('registration', 'prediction', 'prediction_results', 'quiz', 'game', 'bonus') THEN
    RAISE EXCEPTION 'Invalid source: %. Must be one of: registration, prediction, prediction_results, quiz, game, bonus', p_source;
  END IF;

  -- Verify the user exists
  PERFORM 1 FROM users WHERE id = p_user_id;

  IF FOUND THEN
    -- Insert ledger entry — the trigger will update users automatically
    INSERT INTO points_ledger (user_id, source, points, description)
    VALUES (p_user_id, p_source, p_points, p_description);

    v_result := TRUE;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_user_points(UUID, TEXT, INTEGER, TEXT) IS
  'Add or subtract points for a user. Inserts into points_ledger; the trg_sync_user_points trigger keeps users columns in sync automatically. Returns TRUE on success, FALSE if user not found.';

-- =============================================================================
-- VERIFICATION QUERIES (run manually after applying migration)
-- =============================================================================
-- Compare users table with ledger totals:
--
--   SELECT u.name, u.total_points, u.registration_points,
--          u.prediction_points, u.quiz_points, u.game_points,
--          COALESCE(SUM(pl.points), 0) AS ledger_total
--   FROM users u
--   LEFT JOIN points_ledger pl ON pl.user_id = u.id
--   GROUP BY u.id
--   ORDER BY u.name;
--
-- Verify trigger fires on new insert:
--
--   INSERT INTO points_ledger (user_id, source, points, description)
--   VALUES ('<some-user-id>', 'bonus', 5, 'trigger test');
--
--   SELECT total_points, bonus_points FROM users WHERE id = '<some-user-id>';
