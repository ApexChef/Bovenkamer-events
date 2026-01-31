-- =============================================================================
-- Menu Card Courses: Guest-facing menu presentation
-- =============================================================================
-- Separate from menu_items (procurement data). This table holds the beautifully
-- formatted menu text that guests see on the /menu page.

CREATE TABLE IF NOT EXISTS menu_card_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  items TEXT NOT NULL,           -- Newline-separated menu items
  wine_red TEXT,                 -- Wine suggestion for red preference
  wine_white TEXT,               -- Wine suggestion for white preference
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_menu_card_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_menu_card_courses_updated_at
  BEFORE UPDATE ON menu_card_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_card_courses_updated_at();

-- =============================================================================
-- Seed data: populate with guest-friendly menu text for the active event
-- =============================================================================
DO $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Find the active event
  SELECT id INTO v_event_id
  FROM events
  WHERE status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE NOTICE 'No active event found — skipping menu card seed';
    RETURN;
  END IF;

  -- Aperitief & Hapjes
  INSERT INTO menu_card_courses (event_id, title, subtitle, items, wine_red, wine_white, sort_order)
  VALUES (
    v_event_id,
    'Aperitief & Hapjes',
    'Welkom — iets om het jaar mee te beginnen',
    E'Charcuterie van Ib\u00E9rische ham, pancetta & prosciutto crudo\nKrokante gyoza met gamba\nJapanse edamame met zeezout\nBouillabaisse op Proven\u00E7aalse wijze\nHuisgemarineerde graved lachs\nT\u00EAte de Moine \u2014 geschaafd aan tafel',
    'een glas ros\u00E9 champagne, perfect als aperitief',
    'een glas champagne, de ideale start van de avond',
    0
  );

  -- Vis & Zeevruchten van de Grill
  INSERT INTO menu_card_courses (event_id, title, subtitle, items, wine_red, wine_white, sort_order)
  VALUES (
    v_event_id,
    'Vis & Zeevruchten van de Grill',
    'Verse vangst, bereid op het vuur',
    E'Gegrilde zalmfilet met citrus\nYellowfin tonijn tataki\nBlack Tiger garnalen van het vuur\nGegrilde coquilles\nInktvisringen van de plancha',
    'een lichte Pinot Noir die verrassend goed samengaat met vis',
    'een frisse Sancerre met minerale tonen',
    1
  );

  -- BBQ Vlees
  INSERT INTO menu_card_courses (event_id, title, subtitle, items, wine_red, wine_white, sort_order)
  VALUES (
    v_event_id,
    'BBQ Vlees',
    'Van de grill — met geduld bereid',
    E'Picanha \u2014 Braziliaans gegrild\nDiamanthaas van Noors rund\nBoneless beef ribs \u2014 langzaam gegaard\nSpare ribs met huisglazuur\nIb\u00E9rico varkensnek van de grill\nWildworstje met appel & calvados\nKipsat\u00E9 met pindasaus',
    'een volle Malbec uit Mendoza',
    'een rijke Chardonnay met body die prima bij gegrild vlees past',
    2
  );

  -- Groenten & Bijgerechten
  INSERT INTO menu_card_courses (event_id, title, subtitle, items, wine_red, wine_white, sort_order)
  VALUES (
    v_event_id,
    'Groenten & Bijgerechten',
    'Seizoensgroenten van de grill en uit de oven',
    E'Gegrilde courgette & groene asperges\nRegenboogwortelen uit de oven\nGegrilde paprika in twee kleuren\nKastanjechampignons & portabella\nKnapperige sugar snaps & haricots verts\nGepofte aardappel met roomboter\nGemengde salade van het seizoen',
    NULL,
    NULL,
    3
  );

  -- Kaasplank
  INSERT INTO menu_card_courses (event_id, title, subtitle, items, wine_red, wine_white, sort_order)
  VALUES (
    v_event_id,
    'Kaasplank',
    'Zeven kazen — van zacht tot gerijpt',
    E'18 Maanden gerijpte Old Holland\nBuffelkaas met zwarte truffel\nZoete Ambacht \u2014 langgerijpt\nZachte geitenkaas\nBrie de Meaux AOP\nD\u00E9lice de Bourgogne \u2014 romig & mild\nReblochon de Savoie\nGegrilde ananas van de BBQ',
    'een Port of late harvest rode wijn bij de kaas',
    'een Gew\u00FCrztraminer die prachtig bij kaas past',
    4
  );

END $$;
