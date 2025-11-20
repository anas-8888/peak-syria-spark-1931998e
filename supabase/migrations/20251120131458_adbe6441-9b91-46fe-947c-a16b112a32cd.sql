
-- Add display_order column to product_colors for ordering multiple images per color
ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add comment explaining the new structure
COMMENT ON TABLE product_colors IS 'Junction table linking products, colors, and images. Multiple rows with same product_id and color_id are allowed to support multiple images per color.';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_product_colors_lookup ON product_colors(product_id, color_id, display_order);
