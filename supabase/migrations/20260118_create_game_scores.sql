-- Migration: Create game_scores table for Burger Stack game
-- Date: 2026-01-18

-- Create game_scores table
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL DEFAULT 'burger_stack',
  score INTEGER NOT NULL DEFAULT 0,
  layers INTEGER DEFAULT 0,
  max_combo INTEGER DEFAULT 0,
  perfect_drops INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard ON game_scores(game_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at DESC);

-- Enable Row Level Security
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read all scores (for leaderboard)
CREATE POLICY "game_scores_read_all" ON game_scores
  FOR SELECT USING (true);

-- Users can only insert their own scores
CREATE POLICY "game_scores_insert_own" ON game_scores
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users cannot update or delete scores (immutable)
-- No UPDATE or DELETE policies = no one can modify scores

-- Grant permissions
GRANT SELECT ON game_scores TO authenticated;
GRANT INSERT ON game_scores TO authenticated;

-- Comment on table
COMMENT ON TABLE game_scores IS 'Stores game scores for the Burger Stack mini-game';
COMMENT ON COLUMN game_scores.game_type IS 'Type of game (burger_stack, future games)';
COMMENT ON COLUMN game_scores.layers IS 'Number of ingredients stacked';
COMMENT ON COLUMN game_scores.max_combo IS 'Highest combo achieved in the game';
COMMENT ON COLUMN game_scores.perfect_drops IS 'Number of perfect drops (100% overlap)';
COMMENT ON COLUMN game_scores.duration_seconds IS 'Total game duration in seconds';
