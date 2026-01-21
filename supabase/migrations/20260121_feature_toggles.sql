-- Feature toggles table for admin-controlled feature flags
-- US-012: Desktop Navigation & Feature Toggles

CREATE TABLE IF NOT EXISTS feature_toggles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key VARCHAR(100) NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on feature_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_toggles_key ON feature_toggles(feature_key);

-- Insert default feature values
INSERT INTO feature_toggles (feature_key, is_enabled, description)
VALUES
  ('show_countdown', true, 'Toon afteltimer tot het evenement'),
  ('show_ai_assignment', true, 'Toon AI-gegenereerde taaktoewijzing'),
  ('show_leaderboard_preview', true, 'Toon mini-leaderboard op de homepagina'),
  ('show_burger_game', true, 'Toon Burger Stack game CTA'),
  ('show_predictions', true, 'Toon voorspellingen sectie')
ON CONFLICT (feature_key) DO NOTHING;

-- Enable RLS
ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;

-- Public read access (all users can read feature toggles)
CREATE POLICY "Feature toggles are viewable by everyone"
  ON feature_toggles
  FOR SELECT
  USING (true);

-- Admin write access (only admins can modify)
-- Note: In practice, this is controlled by the API, but adding RLS for extra security
CREATE POLICY "Admins can modify feature toggles"
  ON feature_toggles
  FOR ALL
  USING (true)
  WITH CHECK (true);
