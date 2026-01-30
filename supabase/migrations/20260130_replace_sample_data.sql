-- Migration: Replace sample data with actual HANOS invoice items
-- Date: 2026-01-30
-- Source: HANOS factuur 29 januari 2026 (Apex Chef, Bosserheide 35)
--
-- Replaces sample menu items with actual purchase data for Nieuwjaars BBQ 2026
-- Organized into 5 courses based on the actual BBQ menu

-- =============================================================================
-- 1. Clear existing courses and items for the event
-- =============================================================================
DELETE FROM menu_items WHERE course_id IN (
  SELECT id FROM event_courses WHERE event_id = (
    SELECT id FROM events WHERE name = 'Nieuwjaars BBQ 2026' LIMIT 1
  )
);

DELETE FROM event_courses WHERE event_id = (
  SELECT id FROM events WHERE name = 'Nieuwjaars BBQ 2026' LIMIT 1
);

-- =============================================================================
-- 2. Insert 5 courses with all menu items
-- =============================================================================
DO $$
DECLARE
  v_event_id UUID;
  v_course_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE name = 'Nieuwjaars BBQ 2026' LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Event "Nieuwjaars BBQ 2026" niet gevonden';
  END IF;

  -- =========================================================================
  -- Gang 1: Aperitief (charcuterie & hapjes)
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Aperitief', 1, 100, 'Charcuterie & borrelhapjes')
  RETURNING id INTO v_course_id;

  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, grams_per_person, unit_label, waste_description, sort_order) VALUES
    (v_course_id, 'Pancetta Gesneden',           'fixed', 'other',      100.00, 15, 'gr',   NULL, 1),
    (v_course_id, 'Ham Bellotto Crudo',           'fixed', 'other',      100.00, 15, 'gr',   NULL, 2),
    (v_course_id, 'Prosciutto Crudo Gemarineerd', 'fixed', 'other',      100.00, 15, 'gr',   NULL, 3),
    (v_course_id, 'Salcicces',                    'fixed', 'pork',        95.00, 25, 'gr',   NULL, 4),
    (v_course_id, 'Saucisses Zwijn met Appel',    'fixed', 'pork',        95.00, 30, 'gr',   NULL, 5),
    (v_course_id, 'Edamame Sojabonen in Peulen',  'fixed', 'vegetables',  55.00, 25, 'gr',   'Peulen verwijderen', 6),
    (v_course_id, 'Gyoza Garnaal',                'fixed', 'fish',       100.00, 25, 'stuk', NULL, 7);

  -- =========================================================================
  -- Gang 2: Vis & Zeevruchten
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Vis & Zeevruchten', 2, 200, 'Verse vis en schaaldieren van de grill')
  RETURNING id INTO v_course_id;

  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, grams_per_person, unit_label, waste_description, sort_order) VALUES
    (v_course_id, 'Zalmfilet',                    'fixed', 'fish', 95.00, 100, 'gr',   'Reeds gefileerd en getrimd', 1),
    (v_course_id, 'Tonijn Yellowfin Saku',         'fixed', 'fish', 98.00,  35, 'gr',   'Saku blokken, minimaal verlies', 2),
    (v_course_id, 'Black Tiger Garnaal Gepeld',    'fixed', 'fish', 100.00, 30, 'gr',   'Reeds gepeld', 3),
    (v_course_id, 'Coquilles 10/20',               'fixed', 'fish', 100.00, 25, 'gr',   'Reeds schoongemaakt', 4),
    (v_course_id, 'Inktvis Tubes',                 'fixed', 'fish',  85.00, 25, 'gr',   'Kop en tentakels scheiden', 5),
    (v_course_id, 'Bouillabaise',                  'fixed', 'fish', 100.00, 50, 'ml',   'Saus/bouillon basis', 6);

  -- =========================================================================
  -- Gang 3: BBQ Hoofdgerecht (vlees + bijgerechten)
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'BBQ Hoofdgerecht', 3, 450, 'Vlees van de BBQ met bijgerechten')
  RETURNING id INTO v_course_id;

  -- Protein items: distributed via meat_distribution preferences
  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, distribution_percentage, unit_label, waste_description, sort_order) VALUES
    (v_course_id, 'Picanha',                      'protein', 'beef',    85.00, 42.00, 'kg', 'Vetrand trimmen', 1),
    (v_course_id, 'Runderdiamanthaas',             'protein', 'beef',    90.00, 38.00, 'kg', 'Minimaal verlies, premium stuk', 2),
    (v_course_id, 'Boneless Beef Ribs Sousvide',   'protein', 'beef',    70.00, 20.00, 'kg', 'Sousvide, vet en bindweefsel', 3),
    (v_course_id, 'Varkens Spare Rib',             'protein', 'pork',    60.00, 61.00, 'kg', 'Ribben en beentjes', 4),
    (v_course_id, 'Varkensnek Ibérico',            'protein', 'pork',    90.00, 39.00, 'kg', 'Minimaal verlies', 5),
    (v_course_id, 'Kipsaté met Appel',             'protein', 'chicken', 95.00, 100.00, 'stokje', 'Stokjes, minimaal verlies', 6);

  -- Side items: evenly distributed across sides
  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, unit_label, waste_description, rounding_grams, sort_order) VALUES
    (v_course_id, 'Courgette Groen',               'side', 'vegetables', 90.00, 'kg', 'Uiteinden verwijderen', 100, 7),
    (v_course_id, 'Asperge Punt Groen',            'side', 'vegetables', 80.00, 'kg', 'Onderkant afsnijden', 100, 8),
    (v_course_id, 'Bospeen Regenboog',             'side', 'vegetables', 85.00, 'kg', 'Loof verwijderen', 100, 9),
    (v_course_id, 'Paprika Rood',                  'side', 'vegetables', 85.00, 'kg', 'Zaadlijsten verwijderen', 100, 10),
    (v_course_id, 'Paprika Geel',                  'side', 'vegetables', 85.00, 'kg', 'Zaadlijsten verwijderen', 100, 11),
    (v_course_id, 'Champignons & Portabella',      'side', 'vegetables', 90.00, 'kg', 'Voetjes afsnijden', 100, 12),
    (v_course_id, 'Sugar Snaps',                   'side', 'vegetables', 95.00, 'kg', 'Draden verwijderen', 100, 13),
    (v_course_id, 'Haricots Verts',                'side', 'vegetables', 95.00, 'kg', 'Topjes afsnijden', 100, 14),
    (v_course_id, 'Mesclun Salade met Kruiden',    'side', 'salad',      95.00, 'kg', 'Gewassen, gebruiksklaar', 100, 15);

  -- =========================================================================
  -- Gang 4: Kaasplank
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Kaasplank', 4, 100, '8 kazen')
  RETURNING id INTO v_course_id;

  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, grams_per_person, unit_label, sort_order) VALUES
    (v_course_id, 'Kaas 18 Maand Gerijpt Old Holland', 'fixed', 'dairy', 95.00, 15, 'gr', 1),
    (v_course_id, 'Buffelkaas met Truffel',             'fixed', 'dairy', 95.00, 15, 'gr', 2),
    (v_course_id, 'Zoete Ambacht Gerijpt',              'fixed', 'dairy', 95.00, 12, 'gr', 3),
    (v_course_id, 'Geiten Kaas Zacht',                  'fixed', 'dairy', 95.00, 12, 'gr', 4),
    (v_course_id, 'Brie de Meaux Hennart AOP',          'fixed', 'dairy', 90.00, 15, 'gr', 5),
    (v_course_id, 'Délice de Bourgogne',                'fixed', 'dairy', 95.00, 12, 'gr', 6),
    (v_course_id, 'Tête de Moine',                      'fixed', 'dairy', 80.00, 12, 'gr', 7),
    (v_course_id, 'Reblochon Savoie Bouchet',           'fixed', 'dairy', 90.00, 12, 'gr', 8);

  -- =========================================================================
  -- Gang 5: Dessert
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Dessert', 5, 100, 'Fruit van de BBQ')
  RETURNING id INTO v_course_id;

  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, grams_per_person, unit_label, waste_description, sort_order) VALUES
    (v_course_id, 'Ananas van de BBQ', 'fixed', 'fruit', 55.00, 80, 'gr', 'Schil en kern verwijderen', 1);

END $$;