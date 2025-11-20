-- Allow multiple images per product/color by removing overly strict unique constraint
ALTER TABLE public.product_colors
  DROP CONSTRAINT IF EXISTS product_colors_product_id_color_id_key;

-- Ensure no duplicate rows for the same product/color/image combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_colors_product_id_color_id_image_id_key'
  ) THEN
    ALTER TABLE public.product_colors
      ADD CONSTRAINT product_colors_product_id_color_id_image_id_key
      UNIQUE (product_id, color_id, image_id);
  END IF;
END $$;