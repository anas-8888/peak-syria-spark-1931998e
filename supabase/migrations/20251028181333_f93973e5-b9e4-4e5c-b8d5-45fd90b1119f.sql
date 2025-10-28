-- Add image_url column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.categories.image_url IS 'URL of the category image';