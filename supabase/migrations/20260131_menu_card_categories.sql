-- Add item_categories column to menu_card_courses
-- Each line maps 1:1 to the corresponding item in the items column
-- Valid values per line: pork, beef, chicken, game, fish, vegetarian, or empty
ALTER TABLE menu_card_courses ADD COLUMN IF NOT EXISTS item_categories TEXT;

-- Seed: Vis & Zeevruchten = all fish
UPDATE menu_card_courses SET item_categories = E'fish\nfish\nfish\nfish\nfish'
WHERE title = 'Vis & Zeevruchten van de Grill';

-- Seed: BBQ Vlees = mixed categories
UPDATE menu_card_courses SET item_categories = E'beef\nbeef\nbeef\npork\npork\ngame\nchicken'
WHERE title = 'BBQ Vlees';
