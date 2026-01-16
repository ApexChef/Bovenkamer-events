-- Bovenkamer Winterproef Database Schema
-- Version 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'admin', 'quizmaster')),
  auth_code TEXT UNIQUE,
  total_points INTEGER DEFAULT 0,
  registration_points INTEGER DEFAULT 0,
  prediction_points INTEGER DEFAULT 0,
  quiz_points INTEGER DEFAULT 0,
  game_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Step 1: Personal details
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  has_partner BOOLEAN DEFAULT FALSE,
  partner_name TEXT,
  dietary_requirements TEXT,

  -- Step 2: Skills & preferences
  primary_skill TEXT NOT NULL,
  additional_skills TEXT,
  music_decade TEXT CHECK (music_decade IN ('80s', '90s', '00s', '10s')),
  music_genre TEXT,

  -- Step 3: Quiz answers (stored as JSONB)
  quiz_answers JSONB DEFAULT '{}',

  -- AI Assignment (stored as JSONB)
  ai_assignment JSONB,

  -- Predictions (stored as JSONB)
  predictions JSONB DEFAULT '{}',

  -- Status
  is_complete BOOLEAN DEFAULT FALSE,
  current_step INTEGER DEFAULT 1,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions table
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'ranking', 'estimate', 'true_false', 'open_voted')),
  category TEXT,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options JSONB,
  related_user_id UUID REFERENCES users(id),
  point_value INTEGER DEFAULT 100,
  time_limit INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Sessions table
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'paused', 'finished')),
  current_question_index INTEGER DEFAULT 0,
  question_ids UUID[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Quiz Players table
CREATE TABLE quiz_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  display_name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Answers table
CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES quiz_players(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id),
  answer TEXT,
  is_correct BOOLEAN,
  response_time_ms INTEGER,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions table (for tracking actual outcomes)
CREATE TABLE prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_type TEXT NOT NULL UNIQUE,
  actual_value TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points Ledger table
CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('registration', 'prediction', 'quiz', 'game', 'bonus')),
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boy Boom Ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
  hospitality_rating INTEGER CHECK (hospitality_rating BETWEEN 1 AND 5),
  fire_quality_rating INTEGER CHECK (fire_quality_rating BETWEEN 1 AND 5),
  parking_rating INTEGER CHECK (parking_rating BETWEEN 1 AND 5),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  best_aspect TEXT,
  improvement_suggestion TEXT,
  is_worthy BOOLEAN,
  worthy_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_quiz_players_session_id ON quiz_players(session_id);
CREATE INDEX idx_quiz_answers_player_id ON quiz_answers(player_id);
CREATE INDEX idx_points_ledger_user_id ON points_ledger(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate 6-digit auth code
CREATE OR REPLACE FUNCTION generate_auth_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM users WHERE auth_code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
