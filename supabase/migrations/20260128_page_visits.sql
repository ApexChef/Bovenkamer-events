-- Migration: Create page_visits table for tracking page access
-- Date: 2026-01-28
-- Purpose: Track when users access specific pages (e.g., /predictions)

CREATE TABLE IF NOT EXISTS page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  user_email TEXT,
  referrer TEXT,
  user_agent TEXT,
  is_registered BOOLEAN DEFAULT FALSE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by page
CREATE INDEX IF NOT EXISTS idx_page_visits_page ON page_visits(page);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_page_visits_user_email ON page_visits(user_email);

-- Index for querying by time
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at DESC);

-- Comment
COMMENT ON TABLE page_visits IS 'Tracks page visits for analytics and monitoring';
