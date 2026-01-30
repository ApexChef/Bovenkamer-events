-- =============================================================================
-- RPC: set_game_points — atomically set game_points and recalculate total
-- =============================================================================
-- Game points come from game_scores (best score), not from points_ledger.
-- When game_points changes we must also recalculate total_points to stay in
-- sync with the other category columns.

CREATE OR REPLACE FUNCTION set_game_points(
  p_user_id UUID,
  p_score INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET
    game_points  = p_score,
    total_points = registration_points
                 + prediction_points
                 + quiz_points
                 + bonus_points
                 + p_score
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_game_points(UUID, INTEGER) IS
  'Atomically set game_points to a new best score and recalculate total_points from all category columns.';
