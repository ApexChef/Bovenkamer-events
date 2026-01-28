-- Migration: Create prediction_questions table for dynamic predictions
-- Date: 2026-01-28
-- US-019: Dynamische Prediction Vragen

-- Create prediction_questions table
CREATE TABLE IF NOT EXISTS prediction_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Question configuration
  key TEXT UNIQUE NOT NULL,              -- 'wineBottles', 'firstSleeper', etc.
  label TEXT NOT NULL,                   -- "Hoeveel flessen wijn?"
  type TEXT NOT NULL CHECK (type IN ('slider', 'select_participant', 'boolean', 'time', 'select_options')),
  category TEXT NOT NULL CHECK (category IN ('consumption', 'social', 'other')),

  -- Type-specific options (JSONB)
  options JSONB DEFAULT '{}',
  -- For slider: { "min": 5, "max": 30, "unit": " flessen", "hint": "..." }
  -- For select_options: { "choices": ["varken", "rund", "kip"] }
  -- For time: { "minHour": 19, "maxHour": 6 }

  -- Points scoring
  points_exact INTEGER DEFAULT 50,       -- Points for exact match
  points_close INTEGER DEFAULT 25,       -- Points for close answer
  points_direction INTEGER DEFAULT 10,   -- Points for correct direction

  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prediction_questions_active ON prediction_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_prediction_questions_sort ON prediction_questions(sort_order);
CREATE INDEX IF NOT EXISTS idx_prediction_questions_category ON prediction_questions(category);
CREATE INDEX IF NOT EXISTS idx_prediction_questions_type ON prediction_questions(type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_prediction_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prediction_questions_updated_at
  BEFORE UPDATE ON prediction_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_prediction_questions_updated_at();

-- Enable Row Level Security
ALTER TABLE prediction_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read active questions
CREATE POLICY "prediction_questions_read_active" ON prediction_questions
  FOR SELECT USING (is_active = true);

-- Admins can read all questions (including inactive)
CREATE POLICY "prediction_questions_admin_read_all" ON prediction_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Admins can insert questions
CREATE POLICY "prediction_questions_admin_insert" ON prediction_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Admins can update questions
CREATE POLICY "prediction_questions_admin_update" ON prediction_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Admins can delete questions
CREATE POLICY "prediction_questions_admin_delete" ON prediction_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON prediction_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON prediction_questions TO authenticated;

-- Comments
COMMENT ON TABLE prediction_questions IS 'Dynamic configuration for prediction questions';
COMMENT ON COLUMN prediction_questions.key IS 'Unique identifier used to store answers (e.g., wineBottles)';
COMMENT ON COLUMN prediction_questions.type IS 'Question type: slider, select_participant, boolean, time, select_options';
COMMENT ON COLUMN prediction_questions.category IS 'Display category: consumption, social, other';
COMMENT ON COLUMN prediction_questions.options IS 'Type-specific configuration as JSONB';
COMMENT ON COLUMN prediction_questions.points_exact IS 'Points awarded for exact correct answer';
COMMENT ON COLUMN prediction_questions.points_close IS 'Points awarded for close answer (within threshold)';
COMMENT ON COLUMN prediction_questions.points_direction IS 'Points awarded for correct direction (over/under)';

-- Seed initial questions (converted from hardcoded values)
INSERT INTO prediction_questions (key, label, type, category, options, sort_order) VALUES
  -- Consumption
  ('wineBottles', 'Flessen wijn', 'slider', 'consumption', '{"min": 5, "max": 30, "unit": " flessen", "default": 15}', 10),
  ('beerCrates', 'Kratten bier', 'slider', 'consumption', '{"min": 2, "max": 10, "unit": " kratten", "default": 5}', 20),
  ('meatKilos', 'Kilo''s vlees', 'slider', 'consumption', '{"min": 2, "max": 8, "unit": " kg", "hint": "~20 personen × 200g = 4kg", "default": 4}', 30),

  -- Social
  ('firstSleeper', 'Wie valt als eerste in slaap?', 'select_participant', 'social', '{}', 100),
  ('spontaneousSinger', 'Wie begint spontaan te zingen?', 'select_participant', 'social', '{}', 110),
  ('firstToLeave', 'Wie vertrekt als eerste?', 'select_participant', 'social', '{}', 120),
  ('lastToLeave', 'Wie gaat als laatste naar huis?', 'select_participant', 'social', '{}', 130),
  ('loudestLaugher', 'Wie is de luidste lacher?', 'select_participant', 'social', '{}', 140),
  ('longestStoryTeller', 'Wie vertelt het langste verhaal?', 'select_participant', 'social', '{}', 150),

  -- Other
  ('somethingBurned', 'Wordt er iets aangebrand?', 'boolean', 'other', '{}', 200),
  ('outsideTemp', 'Hoe koud wordt het buiten?', 'slider', 'other', '{"min": -10, "max": 10, "unit": "°C", "default": 0}', 210),
  ('lastGuestTime', 'Hoe laat vertrekt de laatste gast?', 'time', 'other', '{"minHour": 19, "maxHour": 6, "default": 10}', 220)
ON CONFLICT (key) DO NOTHING;
