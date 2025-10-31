-- Make shipping_carrier_id nullable for backward compatibility
ALTER TABLE orders ALTER COLUMN shipping_carrier_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN shipping_region_id DROP NOT NULL;