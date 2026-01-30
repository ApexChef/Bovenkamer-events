-- Migration: Seed predictions form definition
-- Date: 2026-01-29
-- US-020: Dynamische Formulierelementen - Fase 2 (Predictions)
--
-- Creates: form_definition (predictions) → form_version (v1)
--          → 3 form_sections → 12 form_fields
--
-- Mirrors existing prediction_questions data into the dynamic form system.
-- Scoring (points_exact, points_close, points_direction) remains in prediction_questions.

-- =============================================================================
-- 1. Form Definition
-- =============================================================================
INSERT INTO form_definition (id, key, name, description)
VALUES (
  'b0000000-0020-0000-0000-000000000001',
  'predictions',
  'Voorspellingen',
  'Voorspellingen voor de Bovenkamer Winterproef'
);

-- =============================================================================
-- 2. Form Version (v1)
-- =============================================================================
INSERT INTO form_version (id, form_definition_id, version_number, is_published, published_at)
VALUES (
  'b0000000-0020-0001-0000-000000000001',
  'b0000000-0020-0000-0000-000000000001',
  1,
  true,
  NOW()
);

-- Set active version
UPDATE form_definition
SET active_version_id = 'b0000000-0020-0001-0000-000000000001'
WHERE key = 'predictions';

-- =============================================================================
-- 3. Form Sections (3 categories from prediction_questions)
-- =============================================================================
INSERT INTO form_section (id, form_version_id, key, label, description, type, sort_order) VALUES
  (
    'b0000000-0020-0002-0001-000000000001',
    'b0000000-0020-0001-0000-000000000001',
    'social',
    'Sociale Voorspellingen',
    'Wie doet wat tijdens het feest?',
    'section',
    1
  ),
  (
    'b0000000-0020-0002-0002-000000000001',
    'b0000000-0020-0001-0000-000000000001',
    'other',
    'Overige Voorspellingen',
    'Wat gaat er verder gebeuren?',
    'section',
    2
  ),
  (
    'b0000000-0020-0002-0003-000000000001',
    'b0000000-0020-0001-0000-000000000001',
    'consumption',
    'Consumptie Voorspellingen',
    'Hoeveel wordt er geconsumeerd?',
    'section',
    3
  );

-- =============================================================================
-- 4. Form Fields
-- =============================================================================

-- Section: social (6 select_participant fields)
-- Note: firstSleeper is_active=false (disabled in original)
INSERT INTO form_field (form_section_id, key, label, field_type, options, is_required, is_active, sort_order) VALUES
  (
    'b0000000-0020-0002-0001-000000000001',
    'firstSleeper',
    'Wie valt als eerste in slaap?',
    'select_participant',
    '{"type": "select_participant"}',
    true,
    false,
    1
  ),
  (
    'b0000000-0020-0002-0001-000000000001',
    'spontaneousSinger',
    'Wie begint spontaan te zingen?',
    'select_participant',
    '{"type": "select_participant"}',
    true,
    true,
    2
  ),
  (
    'b0000000-0020-0002-0001-000000000001',
    'firstToLeave',
    'Wie vertrekt als eerste?',
    'select_participant',
    '{"type": "select_participant"}',
    true,
    true,
    3
  ),
  (
    'b0000000-0020-0002-0001-000000000001',
    'lastToLeave',
    'Wie gaat als laatste naar huis?',
    'select_participant',
    '{"type": "select_participant"}',
    true,
    true,
    4
  ),
  (
    'b0000000-0020-0002-0001-000000000001',
    'loudestLaugher',
    'Wie is de luidste lacher?',
    'select_participant',
    '{"type": "select_participant"}',
    true,
    true,
    5
  ),
  (
    'b0000000-0020-0002-0001-000000000001',
    'longestStoryTeller',
    'Wie vertelt het langste verhaal?',
    'select_participant',
    '{"type": "select_participant"}',
    true,
    true,
    6
  );

-- Section: other (3 mixed-type fields)
INSERT INTO form_field (form_section_id, key, label, field_type, options, is_required, sort_order) VALUES
  (
    'b0000000-0020-0002-0002-000000000001',
    'somethingBurned',
    'Wordt er iets aangebrand?',
    'boolean',
    '{"type": "boolean", "trueLabel": "Ja", "falseLabel": "Nee"}',
    true,
    1
  ),
  (
    'b0000000-0020-0002-0002-000000000001',
    'outsideTemp',
    'Hoe koud wordt het buiten?',
    'slider',
    '{"type": "slider", "min": -10, "max": 10, "unit": "°C", "default": 0}',
    true,
    2
  ),
  (
    'b0000000-0020-0002-0002-000000000001',
    'lastGuestTime',
    'Hoe laat vertrekt de laatste gast?',
    'time',
    '{"type": "time", "minHour": 19, "maxHour": 6, "default": 10}',
    true,
    3
  );

-- Section: consumption (3 slider fields)
INSERT INTO form_field (form_section_id, key, label, field_type, options, is_required, sort_order) VALUES
  (
    'b0000000-0020-0002-0003-000000000001',
    'wineBottles',
    'Flessen wijn rood & wit',
    'slider',
    '{"type": "slider", "min": 5, "max": 30, "unit": " flessen", "default": 15}',
    true,
    1
  ),
  (
    'b0000000-0020-0002-0003-000000000001',
    'meatKilos',
    'Totaal gewicht aan eten',
    'slider',
    '{"type": "slider", "min": 2, "max": 8, "unit": " kg", "default": 4}',
    true,
    2
  ),
  (
    'b0000000-0020-0002-0003-000000000001',
    'beerCrates',
    'Kratten bier',
    'slider',
    '{"type": "slider", "min": 2, "max": 10, "unit": " kratten", "default": 5}',
    true,
    3
  );
