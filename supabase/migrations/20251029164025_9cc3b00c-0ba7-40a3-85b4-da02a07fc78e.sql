-- Add show_in_banner column to discounts table
ALTER TABLE public.discounts 
ADD COLUMN show_in_banner BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster queries
CREATE INDEX idx_discounts_show_in_banner ON public.discounts(show_in_banner) WHERE show_in_banner = true;