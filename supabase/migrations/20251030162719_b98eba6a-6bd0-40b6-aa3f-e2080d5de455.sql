-- Drop collections table
DROP TABLE IF EXISTS public.collections CASCADE;

-- Create hero_showcase table for the featured product section
CREATE TABLE public.hero_showcase (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT,
  hero_description TEXT NOT NULL,
  hero_image_url TEXT NOT NULL,
  cta_text TEXT DEFAULT 'View Models',
  cta_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create showcase_products junction table for featured products
CREATE TABLE public.showcase_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  showcase_id UUID NOT NULL REFERENCES public.hero_showcase(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_products ENABLE ROW LEVEL SECURITY;

-- Admins can manage hero showcases
CREATE POLICY "Admins can manage hero showcases"
ON public.hero_showcase
FOR ALL
USING (is_admin(auth.uid()));

-- Anyone can view active showcases
CREATE POLICY "Anyone can view active showcases"
ON public.hero_showcase
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

-- Admins can manage showcase products
CREATE POLICY "Admins can manage showcase products"
ON public.showcase_products
FOR ALL
USING (is_admin(auth.uid()));

-- Anyone can view showcase products
CREATE POLICY "Anyone can view showcase products"
ON public.showcase_products
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_hero_showcase_updated_at
BEFORE UPDATE ON public.hero_showcase
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();