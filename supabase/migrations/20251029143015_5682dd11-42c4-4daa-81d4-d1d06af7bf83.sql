-- Remove CHECK constraint on flag_name to allow custom flag names
ALTER TABLE public.hero_slides DROP CONSTRAINT IF EXISTS hero_slides_flag_name_check;