-- Add target_gender column to products table
ALTER TABLE products 
ADD COLUMN target_gender text DEFAULT 'both' CHECK (target_gender IN ('men', 'women', 'both'));