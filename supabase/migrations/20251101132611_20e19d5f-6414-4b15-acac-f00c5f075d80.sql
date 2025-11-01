-- Add region_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN region_id uuid REFERENCES public.regions(id);

-- Create index for better query performance
CREATE INDEX idx_profiles_region_id ON public.profiles(region_id);