-- Migration: Replace sample data with actual HANOS invoice items
-- Date: 2026-01-30
-- Source: HANOS factuur 925956726, 29 januari 2026
--
-- Replaces sample menu items with actual purchase data for Nieuwjaars BBQ 2026
-- Organized into 5 courses:
--   1. Aperitief & Hapjes (charcuterie, snacks, graved lachs, tête de moine)
--   2. Vis & Zeevruchten (vis van de grill)
--   3. BBQ Vlees (protein items, meat distribution based)
--   4. Groenten & Bijgerechten (side items, evenly distributed)
--   5. Kaasplank (kazen + fruit)
--
-- Items NOT included (per afspraak):
--   - Sauzen (BBQ sauce, pepersaus, béarnaise, ponzu, chimichurri)
--   - Kruiden & basics (bieslook, dille, peterselie, roomboter, crème fraîche)
--   - Dranken (wijn, champagne, alcoholvrij)
--   - Non-food (servetten, borden, houtskool)

-- =============================================================================
-- 0. Ensure purchased_quantity column exists (idempotent)
-- =============================================================================
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS purchased_quantity NUMERIC(10,2);

-- =============================================================================
-- 0b. Update event total_persons to 19
-- =============================================================================
UPDATE events SET total_persons = 19 WHERE name = 'Nieuwjaars BBQ 2026';

-- =============================================================================
-- 1. Clear existing courses and items for the event
-- =============================================================================
DELETE FROM event_courses WHERE event_id = (
  SELECT id FROM events WHERE name = 'Nieuwjaars BBQ 2026' LIMIT 1
);

-- =============================================================================
-- 2. Insert 5 courses with all menu items + purchased_quantity from invoice
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
  -- Gang 1: Aperitief & Hapjes (125g p.p.)
  -- Charcuterie, edamame, gyoza, bouillabaisse + graved lachs + tête de moine
  -- All fixed items — specific portions per person
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Aperitief & Hapjes', 1, 125, 'Charcuterie, borrelhapjes, warme snacks, graved lachs en tête de moine')
  RETURNING id INTO v_course_id;

  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, grams_per_person, unit_weight_grams, unit_label, waste_description, sort_order, purchased_quantity) VALUES
    (v_course_id, 'Pancetta Gesneden',          'fixed', 'pork',       100.00,  6, 100, 'pakje',  NULL, 1, 100),
    (v_course_id, 'Ham Bellota Gesneden',        'fixed', 'pork',       100.00,  5,  80, 'pakje',  NULL, 2, 80),
    (v_course_id, 'Prosciutto Crudo',            'fixed', 'pork',       100.00,  6, 100, 'pakje',  NULL, 3, 100),
    (v_course_id, 'Edamame Sojabonen',           'fixed', 'vegetables',  55.00, 25, 400, 'zak',    'Peulen verwijderen', 4, 800),
    (v_course_id, 'Gyoza Garnaal',               'fixed', 'fish',       100.00, 33, 600, 'zak',    NULL, 5, 600),
    (v_course_id, 'Bouillabaisse',               'fixed', 'fish',       100.00, 50, 900, 'emmer',  NULL, 6, 900),
    (v_course_id, 'Graved Lachs',                'fixed', 'fish',        90.00, 50, NULL, 'kg',    'Vel en graatjes verwijderen', 7, 1601),
    (v_course_id, 'Tête de Moine',               'fixed', 'dairy',       80.00, 14, NULL, 'kg',    'Korst verwijderen, geschaafd', 8, 450);

  -- =========================================================================
  -- Gang 2: Vis & Zeevruchten (200g p.p.)
  -- All fixed items — dedicated fish course, bypasses meat distribution
  -- Zalmfilet halved: 100g → 50g (other half = Graved Lachs in Gang 1)
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Vis & Zeevruchten', 2, 200, 'Verse vis en schaaldieren van de grill')
  RETURNING id INTO v_course_id;

  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, grams_per_person, unit_label, waste_description, sort_order, purchased_quantity) VALUES
    (v_course_id, 'Zalmfilet Trim D',            'fixed', 'fish',  90.00,  50, 'kg',  'Vel en graatjes verwijderen', 1, 1601),
    (v_course_id, 'Tonijn Yellowfin Saku',        'fixed', 'fish',  95.00,  35, 'kg',  'Saku blokken, minimaal verlies', 2, 638),
    (v_course_id, 'Black Tiger Garnaal Gepeld',   'fixed', 'fish',  95.00,  30, 'kg',  'Reeds gepeld', 3, 800),
    (v_course_id, 'Coquillevlees 10/20',          'fixed', 'fish',  90.00,  25, 'kg',  'Schoongemaakt vlees', 4, 800),
    (v_course_id, 'Inktvis Tubes',                'fixed', 'fish',  85.00,  25, 'kg',  'Kop en tentakels scheiden', 5, 800);

  -- =========================================================================
  -- Gang 3: BBQ Vlees (450g p.p.)
  -- Protein items — distributed via meat_distribution preferences
  -- Distribution percentages sum to 100% within each category:
  --   beef:    Picanha 41% + Diamanthaas 38% + Beef Ribs 21% = 100%
  --   pork:    Spare Rib 50% + Ibérico Nek 32% + Saucisses 18% = 100%
  --   chicken: Kipsaté 100%
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'BBQ Vlees', 3, 450, 'Vlees van de BBQ — verdeeld op basis van vleesvoorkeuren')
  RETURNING id INTO v_course_id;

  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, distribution_percentage, unit_weight_grams, unit_label, waste_description, rounding_grams, sort_order, purchased_quantity) VALUES
    (v_course_id, 'Picanha Regio Rund',           'protein', 'beef',    85.00,  41.00, NULL,  'kg',     'Vetrand trimmen',                     100, 1, 2140),
    (v_course_id, 'Runderdiamanthaas Norland',     'protein', 'beef',    90.00,  38.00, NULL,  'kg',     'Minimaal verlies, premium stuk',      100, 2, 1945),
    (v_course_id, 'Boneless Beef Ribs Sousvide',   'protein', 'beef',    95.00,  21.00, NULL,  'kg',     'Sousvide gegaard, minimaal verlies',  100, 3, 1074),
    (v_course_id, 'Varkens Spare Rib',             'protein', 'pork',    65.00,  50.00, NULL,  'kg',     'Ribben en beentjes',                  100, 4, 2959),
    (v_course_id, 'Varkensnek Ibérico',            'protein', 'pork',    85.00,  32.00, NULL,  'kg',     'Minimaal verlies',                    100, 5, 1905),
    (v_course_id, 'Saucisses Zwijn Appel/Calvados','protein', 'pork',    90.00,  18.00,  150,  'stuk',   'Natuurdarm, eetbaar',                NULL, 6, 1114),
    (v_course_id, 'Kipsaté Gemarineerd',           'protein', 'chicken', 95.00, 100.00,  100,  'stokje', 'Stokjes, reeds gemarineerd',         NULL, 7, 1000);

  -- =========================================================================
  -- Gang 4: Groenten & Bijgerechten (250g p.p.)
  -- Side items — evenly distributed across all sides
  -- 11 sides → 250g × 19 persons / 11 = ~432g per side item
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Groenten & Bijgerechten', 4, 250, 'Bijgerechten van de grill en verse salades')
  RETURNING id INTO v_course_id;

  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, unit_label, waste_description, rounding_grams, sort_order, purchased_quantity) VALUES
    (v_course_id, 'Courgette Groen',              'side', 'vegetables', 90.00, 'kg',    'Uiteinden verwijderen',       100,  1, NULL),
    (v_course_id, 'Asperge Punt Groen',            'side', 'vegetables', 80.00, 'kg',    'Houtige onderkant afsnijden', 100,  2, 400),
    (v_course_id, 'Bospeen Regenboog',             'side', 'vegetables', 80.00, 'kg',    'Loof verwijderen',            100,  3, 1200),
    (v_course_id, 'Paprika Rood',                  'side', 'vegetables', 85.00, 'kg',    'Zaadlijsten verwijderen',     100,  4, NULL),
    (v_course_id, 'Paprika Geel',                  'side', 'vegetables', 85.00, 'kg',    'Zaadlijsten verwijderen',     100,  5, 474),
    (v_course_id, 'Champignons Kastanje',          'side', 'vegetables', 90.00, 'kg',    'Voetjes afsnijden',           100,  6, 250),
    (v_course_id, 'Portabella',                    'side', 'vegetables', 85.00, 'kg',    'Steel verwijderen',           100,  7, 696),
    (v_course_id, 'Sugar Snaps',                   'side', 'vegetables', 95.00, 'kg',    'Draden verwijderen',          100,  8, 516),
    (v_course_id, 'Haricots Verts',                'side', 'vegetables', 95.00, 'kg',    'Topjes afsnijden',            100,  9, 250),
    (v_course_id, 'Pofaardappelen',                'side', 'vegetables', 95.00, 'stuk',  'Schil is eetbaar',            NULL, 10, NULL),
    (v_course_id, 'Gemengde Salade',               'side', 'salad',     95.00, 'kg',    'Suikersla, veldsla, mesclun — gewassen', 100, 11, NULL);

  -- =========================================================================
  -- Gang 5: Kaasplank (106g p.p.)
  -- All fixed items — 7 kazen + ananas (Tête de Moine verplaatst naar Gang 1)
  -- 120g - 14g (Tête de Moine) = 106g p.p.
  -- =========================================================================
  INSERT INTO event_courses (event_id, name, sort_order, grams_per_person, notes)
  VALUES (v_event_id, 'Kaasplank', 5, 106, '7 kazen met gegrilde ananas')
  RETURNING id INTO v_course_id;

  INSERT INTO menu_items (course_id, name, item_type, category, yield_percentage, grams_per_person, unit_label, waste_description, sort_order, purchased_quantity) VALUES
    (v_course_id, 'Kaas 18 Maand Gerijpt Old Holland', 'fixed', 'dairy', 95.00, 20, 'kg',  'Korst verwijderen',           1, 350),
    (v_course_id, 'Buffelkaas met Truffel',              'fixed', 'dairy', 95.00, 12, 'kg',  'Korst verwijderen',           2, 220),
    (v_course_id, 'Zoete Ambacht Gerijpt',               'fixed', 'dairy', 95.00, 18, 'kg',  'Korst verwijderen',           3, 322),
    (v_course_id, 'Geitenkaas Zacht',                    'fixed', 'dairy', 95.00, 15, 'rol', 'Geen afval',                  4, 500),
    (v_course_id, 'Brie de Meaux Hennart AOP',           'fixed', 'dairy', 90.00, 12, 'kg',  'Korst deels eetbaar',         5, 212),
    (v_course_id, 'Délice de Bourgogne',                 'fixed', 'dairy', 95.00,  9, 'kg',  'Geen afval',                  6, 154),
    (v_course_id, 'Reblochon Savoie Bouchet',            'fixed', 'dairy', 90.00, 13, 'kg',  'Korst deels eetbaar',         7, 228),
    (v_course_id, 'Ananas van de BBQ',                   'fixed', 'fruit', 55.00, 20, 'stuk','Schil en kern verwijderen',   8, NULL);

END $$;

-- =============================================================================
-- Verification: Show the full event hierarchy
-- =============================================================================
SELECT
  e.name AS event,
  e.total_persons AS personen,
  ec.sort_order AS gang_nr,
  ec.name AS gang,
  ec.grams_per_person AS "g/p.p.",
  mi.sort_order AS item_nr,
  mi.name AS item,
  mi.item_type AS type,
  mi.category AS categorie,
  mi.yield_percentage AS "rendement%",
  mi.distribution_percentage AS "distributie%",
  mi.grams_per_person AS "g/p.p. (fixed)",
  mi.purchased_quantity AS "ingekocht (g)"
FROM events e
JOIN event_courses ec ON e.id = ec.event_id
JOIN menu_items mi ON ec.id = mi.course_id
WHERE e.name = 'Nieuwjaars BBQ 2026'
ORDER BY ec.sort_order, mi.sort_order;
