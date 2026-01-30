-- Migration: Purchase Orders System
-- Date: 2026-01-31
-- US-014 Phase 3: ERP-style procurement tables
--
-- Tables: purchase_orders, purchase_order_lines
--
-- Description: Separates procurement data (purchase orders, invoices) from the
--              menu recipe (Bill of Materials). Supports non-menu items like
--              sauces, herbs, drinks, and non-food supplies.

-- =============================================================================
-- 1. purchase_orders Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Supplier info
  supplier TEXT NOT NULL,
  order_date DATE,
  expected_delivery_date DATE,

  -- Status tracking
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'ordered', 'received', 'invoiced')),

  -- Invoice info
  invoice_reference TEXT,
  invoice_date DATE,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE purchase_orders IS 'Purchase orders / invoices linked to events';
COMMENT ON COLUMN purchase_orders.supplier IS 'Supplier name (e.g., HANOS, Slager, Sligro)';
COMMENT ON COLUMN purchase_orders.status IS 'draft, ordered, received, or invoiced';
COMMENT ON COLUMN purchase_orders.invoice_reference IS 'Invoice number from supplier';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_event_id ON purchase_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier);

-- =============================================================================
-- 2. purchase_order_lines Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

  -- Optional link to menu item (NULL for non-menu items like sauces, drinks)
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,

  -- Item info
  name TEXT NOT NULL,
  description TEXT,

  -- Category
  line_category TEXT DEFAULT 'food'
    CHECK (line_category IN ('food', 'drink', 'condiment', 'herb', 'non_food', 'other')),

  -- Quantities
  ordered_quantity NUMERIC(10,2),
  received_quantity NUMERIC(10,2),
  unit_label TEXT,

  -- Pricing
  unit_price NUMERIC(10,2),
  total_price NUMERIC(10,2),

  -- Supplier reference
  supplier_article_nr TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE purchase_order_lines IS 'Individual line items on a purchase order';
COMMENT ON COLUMN purchase_order_lines.menu_item_id IS 'Optional link to menu_items (NULL for non-menu items)';
COMMENT ON COLUMN purchase_order_lines.line_category IS 'food, drink, condiment, herb, non_food, or other';
COMMENT ON COLUMN purchase_order_lines.ordered_quantity IS 'Quantity ordered (grams, units, etc.)';
COMMENT ON COLUMN purchase_order_lines.received_quantity IS 'Quantity actually received';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_po_lines_purchase_order_id ON purchase_order_lines(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_lines_menu_item_id ON purchase_order_lines(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_po_lines_category ON purchase_order_lines(line_category);

-- =============================================================================
-- 3. Updated_at Triggers
-- =============================================================================
DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_order_lines_updated_at ON purchase_order_lines;
CREATE TRIGGER update_purchase_order_lines_updated_at
  BEFORE UPDATE ON purchase_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. Data Migration: HANOS Invoice 925956726
-- =============================================================================
-- Migrate existing purchased_quantity data from menu_items to purchase_order_lines
-- and add all non-menu items from the HANOS invoice

DO $$
DECLARE
  v_event_id UUID;
  v_po_id UUID;
BEGIN
  -- Find the event (Nieuwjaars BBQ 2026)
  SELECT id INTO v_event_id
  FROM events
  WHERE name ILIKE '%Nieuwjaars%BBQ%' OR name ILIKE '%Nieuwjaar%'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Exit if no event found
  IF v_event_id IS NULL THEN
    RAISE NOTICE 'No matching event found, skipping data migration';
    RETURN;
  END IF;

  -- Create the purchase order
  INSERT INTO purchase_orders (
    event_id, supplier, order_date, status,
    invoice_reference, invoice_date, notes
  )
  VALUES (
    v_event_id, 'HANOS', '2026-01-25', 'invoiced',
    '925956726', '2026-01-25',
    'HANOS factuur 925956726 - Nieuwjaars BBQ 2026'
  )
  RETURNING id INTO v_po_id;

  -- Step 1: Migrate menu-linked items (items that have purchased_quantity)
  INSERT INTO purchase_order_lines (
    purchase_order_id, menu_item_id, name, line_category,
    received_quantity, unit_label, supplier_article_nr
  )
  SELECT
    v_po_id, mi.id, mi.name, 'food',
    mi.purchased_quantity, mi.unit_label, NULL
  FROM menu_items mi
  JOIN event_courses ec ON mi.course_id = ec.id
  WHERE ec.event_id = v_event_id
    AND mi.purchased_quantity IS NOT NULL;

  -- Step 2: Non-menu items from HANOS invoice

  -- === DRINKS ===
  INSERT INTO purchase_order_lines (purchase_order_id, name, line_category, received_quantity, unit_label, unit_price, total_price, supplier_article_nr) VALUES
    (v_po_id, 'Champagne Gruet Cuvée des 3 Blancs', 'drink', 2, 'fl 75cl', 34.20, 68.40, '8108920'),
    (v_po_id, 'Ferrandière Grand Blanc', 'drink', 4, 'fl 75cl', 7.95, 31.80, '8286980'),
    (v_po_id, 'Campore Etna Bianco DOC', 'drink', 2, 'fl 75cl', 14.85, 29.70, '8551630'),
    (v_po_id, 'Astrolabe Late Harvest Chenin Blanc', 'drink', 1, 'fl 37.5cl', 14.95, 14.95, '8555590'),
    (v_po_id, 'Sitial Crianza Ribera del Duero', 'drink', 6, 'fl 75cl', 6.45, 38.70, '8559300'),
    (v_po_id, 'González Byass Nectar Pedro Ximénez', 'drink', 1, 'fl 75cl', 14.35, 14.35, '9030042'),
    (v_po_id, 'Sir James 101 G&T 0.0%', 'drink', 3, 'fl 25cl', 1.90, 5.70, '9102170'),
    (v_po_id, 'Sir James 101 Mojito 0.0%', 'drink', 3, 'fl 25cl', 1.90, 5.70, '9102580'),
    (v_po_id, 'Sir James 101 Pink G&T 0.0%', 'drink', 3, 'fl 25cl', 1.90, 5.70, '9104500'),
    (v_po_id, 'Sir James 101 Passion Martini 0.0%', 'drink', 3, 'fl 25cl', 1.90, 5.70, '9105920');

  -- === CONDIMENTS / SAUCES ===
  INSERT INTO purchase_order_lines (purchase_order_id, name, line_category, received_quantity, unit_label, unit_price, total_price, supplier_article_nr) VALUES
    (v_po_id, 'BBQ Sauce Original (Jack Daniel''s)', 'condiment', 553, 'g', 7.50, 7.50, '24118270'),
    (v_po_id, 'Classic Pepersaus (Oscar)', 'condiment', 1000, 'ml', 9.15, 9.15, '24124450'),
    (v_po_id, 'Béarnaisesaus (Oscar)', 'condiment', 1000, 'ml', 9.15, 9.15, '24124470'),
    (v_po_id, 'Dashi Iri Ponzu Yuzu (Uchibori)', 'condiment', 360, 'ml', 9.50, 9.50, '25112200'),
    (v_po_id, 'Chimichurri NL (Bresc)', 'condiment', 450, 'g', 8.95, 8.95, '32805240');

  -- === HERBS ===
  INSERT INTO purchase_order_lines (purchase_order_id, name, line_category, received_quantity, unit_label, unit_price, total_price, supplier_article_nr) VALUES
    (v_po_id, 'Bieslook', 'herb', 80, 'g', 2.95, 2.95, '34906406'),
    (v_po_id, 'Dille', 'herb', 80, 'g', 2.35, 2.35, '34915807'),
    (v_po_id, 'Peterselie plat', 'herb', 80, 'g', 1.55, 1.55, '34960615');

  -- === FOOD: Dairy/Cooking ===
  INSERT INTO purchase_order_lines (purchase_order_id, name, line_category, received_quantity, unit_label, unit_price, total_price, supplier_article_nr) VALUES
    (v_po_id, 'Roomboter ongezouten', 'food', 500, 'g', 3.95, 3.95, '27122187'),
    (v_po_id, 'Slagroom 30% ongesuikerd', 'food', 1000, 'ml', 4.40, 4.40, '40200050'),
    (v_po_id, 'Crème fraîche 30%', 'food', 1000, 'ml', 7.95, 7.95, '40710830');

  -- === FOOD: Vegetables not on menu ===
  INSERT INTO purchase_order_lines (purchase_order_id, name, line_category, received_quantity, unit_label, unit_price, total_price, supplier_article_nr) VALUES
    (v_po_id, 'Knoflook wit Frans', 'food', 116, 'g', 9.48, 1.10, '34244309'),
    (v_po_id, 'Komkommer', 'food', 3, 'st', 1.65, 4.95, '34246254'),
    (v_po_id, 'Winterpeen', 'food', 1180, 'g', 1.25, 1.48, '34295808'),
    (v_po_id, 'Kool wit', 'food', 1000, 'g', 3.75, 3.75, '34297600'),
    (v_po_id, 'Suikersla / Little Gem', 'food', 6, 'st', 3.50, 3.50, '34202087'),
    (v_po_id, 'Veldsla gewassen', 'food', 125, 'g', 1.80, 1.80, '34206880'),
    (v_po_id, 'Mesclun met kruiden', 'food', 250, 'g', 3.75, 3.75, '34295970'),
    (v_po_id, 'Citroen', 'food', 508, 'g', 3.95, 2.01, '34418505'),
    (v_po_id, 'Limes', 'food', 202, 'g', 4.26, 0.86, '34450505');

  -- === NON-FOOD ===
  INSERT INTO purchase_order_lines (purchase_order_id, name, line_category, received_quantity, unit_label, unit_price, total_price, supplier_article_nr) VALUES
    (v_po_id, 'Servetten Linstyle 39x39cm wit', 'non_food', 50, 'st', 7.95, 7.95, '60194216'),
    (v_po_id, 'Bord Basic Bagasse rond 26cm 3-vaks', 'non_food', 50, 'st', 7.35, 7.35, '60253660'),
    (v_po_id, 'Houtskool Horeca 10kg', 'non_food', 10, 'kg', 24.95, 24.95, '65120509');

  RAISE NOTICE 'Data migration complete: PO % created with lines for event %', v_po_id, v_event_id;
END $$;
