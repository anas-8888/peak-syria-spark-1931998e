-- Add show_in_navbar column to categories table
ALTER TABLE public.categories 
ADD COLUMN show_in_navbar boolean NOT NULL DEFAULT false;