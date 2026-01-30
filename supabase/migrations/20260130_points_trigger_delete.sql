-- =============================================================================
-- Extend points_ledger trigger to handle DELETE
-- =============================================================================
-- The prediction recalculation flow does DELETE + INSERT to replace an entry.
-- The original trigger only fires on INSERT, so the DELETE would leave stale
-- points on the users table. This migration replaces the trigger function to
-- handle both INSERT (add points) and DELETE (subtract points).

CREATE OR REPLACE FUNCTION sync_user_points_on_ledger_change()
RETURNS TRIGGER AS $$
DECLARE
  v_category_column TEXT;
  v_source TEXT;
  v_points INTEGER;
  v_user_id UUID;
BEGIN
  -- Determine source, points, and user_id based on operation
  IF TG_OP = 'DELETE' THEN
    v_source  := OLD.source;
    v_points  := -OLD.points;   -- subtract
    v_user_id := OLD.user_id;
  ELSE
    -- INSERT
    v_source  := NEW.source;
    v_points  := NEW.points;    -- add
    v_user_id := NEW.user_id;
  END IF;

  -- Map source → users column
  CASE v_source
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
        SET total_points = total_points + v_points
      WHERE id = v_user_id;

      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      END IF;
      RETURN NEW;
  END CASE;

  -- Atomically update both the category column and total_points
  EXECUTE format(
    'UPDATE users SET %I = %I + $1, total_points = total_points + $1 WHERE id = $2',
    v_category_column, v_category_column
  ) USING v_points, v_user_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_user_points_on_ledger_change() IS
  'Trigger function: keeps users point columns in sync on INSERT (add) and DELETE (subtract) in points_ledger.';

-- Replace the old INSERT-only trigger with one that handles INSERT + DELETE
DROP TRIGGER IF EXISTS trg_sync_user_points ON points_ledger;

CREATE TRIGGER trg_sync_user_points
  AFTER INSERT OR DELETE ON points_ledger
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_points_on_ledger_change();
