-- Drop the unique constraint that prevents adding same product with different variants
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- Create a unique index that includes color and size (nulls are treated as distinct)
-- This allows same product with different color/size combinations
CREATE UNIQUE INDEX cart_items_user_product_variant_idx 
  ON cart_items (user_id, product_id, selected_color, selected_size);