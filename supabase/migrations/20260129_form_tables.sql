-- Migration: Create dynamic form tables
-- Date: 2026-01-29
-- US-020: Dynamische Formulierelementen
--
-- Tables: form_definition, form_version, form_section, form_field,
--         form_response, form_field_response
--
-- Based on Salesforce WebForm pattern:
--   WebFormDefinition  → form_definition
--   WebFormVersion     → form_version
--   WebFormStep        → form_section
--   WebFormField       → form_field
--   WebFormResponse    → form_response
--   WebFormFieldResp   → form_field_response

-- =============================================================================
-- 1. form_definition
-- =============================================================================
CREATE TABLE IF NOT EXISTS form_definition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active_version_id UUID,               -- FK added after form_version exists
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE form_definition IS 'Master form definitions (e.g., predictions, ratings, registration_quiz)';
COMMENT ON COLUMN form_definition.key IS 'Unique identifier for the form, used in API routes';
COMMENT ON COLUMN form_definition.active_version_id IS 'FK to form_version - the currently active/published version';

-- =============================================================================
-- 2. form_version
-- =============================================================================
CREATE TABLE IF NOT EXISTS form_version (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_definition_id UUID NOT NULL REFERENCES form_definition(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(form_definition_id, version_number)
);

-- Now add FK for active_version_id
ALTER TABLE form_definition
  ADD CONSTRAINT fk_form_definition_active_version
  FOREIGN KEY (active_version_id)
  REFERENCES form_version(id);

COMMENT ON TABLE form_version IS 'Versioned snapshots of form structure';
COMMENT ON COLUMN form_version.version_number IS 'Sequential version number per form';
COMMENT ON COLUMN form_version.is_published IS 'Published versions can receive responses';

CREATE INDEX idx_form_version_definition ON form_version(form_definition_id);

-- =============================================================================
-- 3. form_section
-- =============================================================================
CREATE TABLE IF NOT EXISTS form_section (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_version_id UUID NOT NULL REFERENCES form_version(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  type TEXT NOT NULL DEFAULT 'section'
    CHECK (type IN ('step', 'section')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(form_version_id, key)
);

COMMENT ON TABLE form_section IS 'Groups of fields within a version. Type step = wizard step, section = visual grouping';
COMMENT ON COLUMN form_section.type IS 'step = wizard step, section = visual grouping on a page';
COMMENT ON COLUMN form_section.icon IS 'Optional emoji or icon identifier';

CREATE INDEX idx_form_section_version ON form_section(form_version_id);
CREATE INDEX idx_form_section_sort ON form_section(form_version_id, sort_order);

-- =============================================================================
-- 4. form_field
-- =============================================================================
CREATE TABLE IF NOT EXISTS form_field (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_section_id UUID NOT NULL REFERENCES form_section(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  placeholder TEXT,
  field_type TEXT NOT NULL
    CHECK (field_type IN (
      'slider', 'star_rating',
      'text_short', 'text_long',
      'select_options', 'select_participant', 'boolean',
      'time', 'checkbox_group', 'radio_group'
    )),
  options JSONB DEFAULT '{}',
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(form_section_id, key)
);

COMMENT ON TABLE form_field IS 'Individual fields/questions within a section';
COMMENT ON COLUMN form_field.field_type IS 'Determines how the field is rendered and what answer column is used';
COMMENT ON COLUMN form_field.options IS 'Type-specific config: slider ranges, select choices, boolean labels, etc.';

CREATE INDEX idx_form_field_section ON form_field(form_section_id);
CREATE INDEX idx_form_field_sort ON form_field(form_section_id, sort_order);

-- =============================================================================
-- 5. form_response
-- =============================================================================
CREATE TABLE IF NOT EXISTS form_response (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_version_id UUID NOT NULL REFERENCES form_version(id),
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, form_version_id)
);

COMMENT ON TABLE form_response IS 'One submission per user per form version';
COMMENT ON COLUMN form_response.status IS 'draft = in progress, submitted = final, scored = points calculated';

CREATE INDEX idx_form_response_user ON form_response(user_id);
CREATE INDEX idx_form_response_version ON form_response(form_version_id);
CREATE INDEX idx_form_response_status ON form_response(status);

-- =============================================================================
-- 6. form_field_response
-- =============================================================================
CREATE TABLE IF NOT EXISTS form_field_response (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_response_id UUID NOT NULL REFERENCES form_response(id) ON DELETE CASCADE,
  form_field_id UUID NOT NULL REFERENCES form_field(id),

  -- Flexible answer storage (one column per type)
  text TEXT,
  number NUMERIC,
  boolean BOOLEAN,
  json JSONB,
  participant_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(form_response_id, form_field_id)
);

COMMENT ON TABLE form_field_response IS 'Individual answer to a field. Uses typed columns for different answer types';
COMMENT ON COLUMN form_field_response.text IS 'For text_short, text_long, select_options';
COMMENT ON COLUMN form_field_response.number IS 'For slider, star_rating, time';
COMMENT ON COLUMN form_field_response.boolean IS 'For boolean fields';
COMMENT ON COLUMN form_field_response.json IS 'For checkbox_group and complex answers';
COMMENT ON COLUMN form_field_response.participant_id IS 'For select_participant fields';

CREATE INDEX idx_form_field_response_response ON form_field_response(form_response_id);
CREATE INDEX idx_form_field_response_field ON form_field_response(form_field_id);

-- =============================================================================
-- updated_at triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_form_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_definition_updated_at
  BEFORE UPDATE ON form_definition
  FOR EACH ROW EXECUTE FUNCTION update_form_updated_at();

CREATE TRIGGER form_version_updated_at
  BEFORE UPDATE ON form_version
  FOR EACH ROW EXECUTE FUNCTION update_form_updated_at();

CREATE TRIGGER form_section_updated_at
  BEFORE UPDATE ON form_section
  FOR EACH ROW EXECUTE FUNCTION update_form_updated_at();

CREATE TRIGGER form_field_updated_at
  BEFORE UPDATE ON form_field
  FOR EACH ROW EXECUTE FUNCTION update_form_updated_at();

CREATE TRIGGER form_response_updated_at
  BEFORE UPDATE ON form_response
  FOR EACH ROW EXECUTE FUNCTION update_form_updated_at();

CREATE TRIGGER form_field_response_updated_at
  BEFORE UPDATE ON form_field_response
  FOR EACH ROW EXECUTE FUNCTION update_form_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- form_definition: everyone can read, admins can write
ALTER TABLE form_definition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_definition_read" ON form_definition
  FOR SELECT USING (true);

CREATE POLICY "form_definition_admin_write" ON form_definition
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
  );

-- form_version: everyone can read published, admins can write
ALTER TABLE form_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_version_read" ON form_version
  FOR SELECT USING (true);

CREATE POLICY "form_version_admin_write" ON form_version
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
  );

-- form_section: everyone can read active, admins can write
ALTER TABLE form_section ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_section_read" ON form_section
  FOR SELECT USING (true);

CREATE POLICY "form_section_admin_write" ON form_section
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
  );

-- form_field: everyone can read active, admins can write
ALTER TABLE form_field ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_field_read" ON form_field
  FOR SELECT USING (true);

CREATE POLICY "form_field_admin_write" ON form_field
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
  );

-- form_response: users can read/write own, admins can read all
ALTER TABLE form_response ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_response_own_read" ON form_response
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "form_response_own_write" ON form_response
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "form_response_own_update" ON form_response
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "form_response_admin_read" ON form_response
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
  );

-- form_field_response: users can read/write own (via response), admins can read all
ALTER TABLE form_field_response ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_field_response_own_read" ON form_field_response
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM form_response WHERE form_response.id = form_field_response.form_response_id AND form_response.user_id::text = auth.uid()::text)
  );

CREATE POLICY "form_field_response_own_write" ON form_field_response
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM form_response WHERE form_response.id = form_field_response.form_response_id AND form_response.user_id::text = auth.uid()::text)
  );

CREATE POLICY "form_field_response_own_update" ON form_field_response
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM form_response WHERE form_response.id = form_field_response.form_response_id AND form_response.user_id::text = auth.uid()::text)
  );

CREATE POLICY "form_field_response_admin_read" ON form_field_response
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
  );

-- =============================================================================
-- Grants
-- =============================================================================
GRANT SELECT ON form_definition TO authenticated;
GRANT SELECT ON form_version TO authenticated;
GRANT SELECT ON form_section TO authenticated;
GRANT SELECT ON form_field TO authenticated;
GRANT SELECT, INSERT, UPDATE ON form_response TO authenticated;
GRANT SELECT, INSERT, UPDATE ON form_field_response TO authenticated;

-- Admin grants
GRANT INSERT, UPDATE, DELETE ON form_definition TO authenticated;
GRANT INSERT, UPDATE, DELETE ON form_version TO authenticated;
GRANT INSERT, UPDATE, DELETE ON form_section TO authenticated;
GRANT INSERT, UPDATE, DELETE ON form_field TO authenticated;
