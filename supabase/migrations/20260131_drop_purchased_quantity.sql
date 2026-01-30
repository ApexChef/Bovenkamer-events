-- Migration: Drop purchased_quantity column from menu_items
-- Date: 2026-01-31
-- US-014 Phase 5: Cleanup after PO system migration
--
-- Prerequisites: Run AFTER 20260131_purchase_orders.sql has been applied
--                and all code has been deployed using PO lines instead of
--                menu_items.purchased_quantity
--
-- This migration removes the legacy column now that procurement data
-- lives in purchase_order_lines.received_quantity

ALTER TABLE menu_items DROP COLUMN IF EXISTS purchased_quantity;
