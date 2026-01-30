-- User Evaluations table
-- Stores AI-generated evaluations per user per type (e.g. prediction evaluation)

CREATE TABLE IF NOT EXISTS user_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  evaluation JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_evaluations_user_id ON user_evaluations(user_id);

-- Feature toggle for prediction evaluation visibility on dashboard
INSERT INTO feature_toggles (feature_key, is_enabled, description)
VALUES (
  'show_prediction_evaluation',
  false,
  'Toon de AI-gegenereerde evaluatie van voorspellingen op het dashboard'
)
ON CONFLICT (feature_key) DO NOTHING;
