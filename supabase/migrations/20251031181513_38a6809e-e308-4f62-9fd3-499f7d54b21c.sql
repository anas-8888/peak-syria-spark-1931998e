-- Add image_url to shipping_carriers
ALTER TABLE shipping_carriers
ADD COLUMN image_url TEXT;

-- Remove city from orders table
ALTER TABLE orders
DROP COLUMN IF EXISTS city;