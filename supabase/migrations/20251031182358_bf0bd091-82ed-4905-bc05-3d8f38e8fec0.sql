-- Remove base_cost column from shipping_carriers table
ALTER TABLE shipping_carriers DROP COLUMN IF EXISTS base_cost;