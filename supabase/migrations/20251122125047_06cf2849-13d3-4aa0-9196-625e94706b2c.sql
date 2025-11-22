-- Drop the policy first
DROP POLICY IF EXISTS "Anyone can view active products" ON products;

-- Remove is_active column from products table
ALTER TABLE products DROP COLUMN is_active;

-- Create new RLS policy using only hidden column
CREATE POLICY "Anyone can view active products" 
ON products 
FOR SELECT 
USING ((hidden = false) OR is_admin(auth.uid()));