-- Add show_in_navbar column to hero_slides table
ALTER TABLE public.hero_slides 
ADD COLUMN show_in_navbar BOOLEAN NOT NULL DEFAULT false;