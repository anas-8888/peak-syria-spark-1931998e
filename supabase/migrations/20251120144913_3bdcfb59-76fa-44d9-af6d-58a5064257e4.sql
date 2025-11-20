-- Add hidden column to products table
ALTER TABLE products 
ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT true;

-- Set existing products to visible (hidden = false)
UPDATE products SET hidden = false;

-- Update RLS policy to check both is_active and hidden
DROP POLICY IF EXISTS "Anyone can view active products" ON products;

CREATE POLICY "Anyone can view active products" ON products
FOR SELECT
USING (
  (is_active = true AND hidden = false) 
  OR is_admin(auth.uid())
);