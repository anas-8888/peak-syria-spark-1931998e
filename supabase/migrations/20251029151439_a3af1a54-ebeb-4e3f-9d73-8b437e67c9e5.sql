-- Add image_id column to product_colors table
ALTER TABLE public.product_colors 
ADD COLUMN image_id UUID REFERENCES public.product_images(id) ON DELETE SET NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.product_colors.image_id IS 'The product image associated with this color variant';