-- Migration: Seed ratings form definition
-- Date: 2026-01-29
-- US-020: Dynamische Formulierelementen - Fase 1 (Ratings)
--
-- Creates: form_definition (ratings) → form_version (v1)
--          → 3 form_sections → 9 form_fields

-- =============================================================================
-- 1. Form Definition
-- =============================================================================
INSERT INTO form_definition (id, key, name, description)
VALUES (
  'a0000000-0020-0000-0000-000000000001',
  'ratings',
  'Boy Boom Beoordeling',
  'Beoordeling van de locatie en gastheer van de Bovenkamer Winterproef'
);

-- =============================================================================
-- 2. Form Version (v1)
-- =============================================================================
INSERT INTO form_version (id, form_definition_id, version_number, is_published, published_at)
VALUES (
  'a0000000-0020-0001-0000-000000000001',
  'a0000000-0020-0000-0000-000000000001',
  1,
  true,
  NOW()
);

-- Set active version
UPDATE form_definition
SET active_version_id = 'a0000000-0020-0001-0000-000000000001'
WHERE key = 'ratings';

-- =============================================================================
-- 3. Form Sections
-- =============================================================================
INSERT INTO form_section (id, form_version_id, key, label, description, type, sort_order) VALUES
  (
    'a0000000-0020-0002-0001-000000000001',
    'a0000000-0020-0001-0000-000000000001',
    'criteria',
    'Beoordelingscriteria',
    'Geef een score van 1-5 sterren',
    'section',
    1
  ),
  (
    'a0000000-0020-0002-0002-000000000001',
    'a0000000-0020-0001-0000-000000000001',
    'feedback',
    'Open Vragen',
    'Optioneel maar gewaardeerd',
    'section',
    2
  ),
  (
    'a0000000-0020-0002-0003-000000000001',
    'a0000000-0020-0001-0000-000000000001',
    'verdict',
    'Het Eindoordeel',
    'De ultieme vraag',
    'section',
    3
  );

-- =============================================================================
-- 4. Form Fields
-- =============================================================================

-- Section: criteria (5 star_rating fields)
INSERT INTO form_field (form_section_id, key, label, description, field_type, options, is_required, sort_order) VALUES
  (
    'a0000000-0020-0002-0001-000000000001',
    'location',
    'Locatie',
    'Ruimte, sfeer, faciliteiten',
    'star_rating',
    '{"type": "star_rating", "maxStars": 5}',
    true,
    1
  ),
  (
    'a0000000-0020-0002-0001-000000000001',
    'hospitality',
    'Gastvrijheid',
    'Ontvangst, bediening, aandacht',
    'star_rating',
    '{"type": "star_rating", "maxStars": 5}',
    true,
    2
  ),
  (
    'a0000000-0020-0002-0001-000000000001',
    'fire_quality',
    'Kwaliteit Vuurvoorziening',
    'BBQ, vuurplaats, warmte',
    'star_rating',
    '{"type": "star_rating", "maxStars": 5}',
    true,
    3
  ),
  (
    'a0000000-0020-0002-0001-000000000001',
    'parking',
    'Parkeergelegenheid',
    'Ruimte, bereikbaarheid',
    'star_rating',
    '{"type": "star_rating", "maxStars": 5}',
    true,
    4
  ),
  (
    'a0000000-0020-0002-0001-000000000001',
    'overall',
    'Algemene Organisatie',
    'Totaalindruk van de avond',
    'star_rating',
    '{"type": "star_rating", "maxStars": 5}',
    true,
    5
  );

-- Section: feedback (2 text_long fields)
INSERT INTO form_field (form_section_id, key, label, description, placeholder, field_type, options, is_required, sort_order) VALUES
  (
    'a0000000-0020-0002-0002-000000000001',
    'best_aspect',
    'Wat was het beste aan de locatie?',
    NULL,
    'Bijv. de sfeer, het uitzicht, de ruimte...',
    'text_long',
    '{"type": "text_long", "rows": 3}',
    false,
    1
  ),
  (
    'a0000000-0020-0002-0002-000000000001',
    'improvement_suggestion',
    'Wat kan beter?',
    NULL,
    'Constructieve feedback voor de toekomst...',
    'text_long',
    '{"type": "text_long", "rows": 3}',
    false,
    2
  );

-- Section: verdict (1 boolean + 1 text_long)
INSERT INTO form_field (form_section_id, key, label, description, placeholder, field_type, options, is_required, sort_order) VALUES
  (
    'a0000000-0020-0002-0003-000000000001',
    'is_worthy',
    'Is Boy Boom waardig lid van de Bovenkamer?',
    NULL,
    NULL,
    'boolean',
    '{"type": "boolean", "trueLabel": "Ja, Waardig", "falseLabel": "Nee, Onwaardig", "trueEmoji": "✅", "falseEmoji": "❌"}',
    true,
    1
  ),
  (
    'a0000000-0020-0002-0003-000000000001',
    'worthy_explanation',
    'Toelichting',
    NULL,
    'Waarom wel of niet waardig?',
    'text_long',
    '{"type": "text_long", "rows": 3}',
    false,
    2
  );
