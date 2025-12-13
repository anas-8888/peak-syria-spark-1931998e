-- Create flags table
CREATE TABLE public.flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_in_navbar BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage flags" 
ON public.flags 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active flags" 
ON public.flags 
FOR SELECT 
USING ((is_active = true) OR is_admin(auth.uid()));

-- Make flag_name nullable in hero_slides (to decouple from flags)
ALTER TABLE public.hero_slides 
ALTER COLUMN flag_name DROP NOT NULL;

-- Insert existing flags from hero_slides into flags table
INSERT INTO public.flags (name, show_in_navbar, display_order)
SELECT DISTINCT flag_name, show_in_navbar, display_order
FROM public.hero_slides
WHERE flag_name IS NOT NULL AND flag_name != ''
ON CONFLICT (name) DO NOTHING;

-- Also insert flags from products table
INSERT INTO public.flags (name)
SELECT DISTINCT flag
FROM public.products
WHERE flag IS NOT NULL AND flag != ''
ON CONFLICT (name) DO NOTHING;