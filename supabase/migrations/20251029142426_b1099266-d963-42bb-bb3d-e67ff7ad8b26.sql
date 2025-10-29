-- Create hero_slides table for managing hero section content
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL CHECK (flag_name IN ('New Arrival', 'Offer', 'Best Seller', 'Limited Edition')),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  button_text TEXT NOT NULL,
  button_url TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_width INTEGER NOT NULL DEFAULT 1920,
  image_height INTEGER NOT NULL DEFAULT 1080,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Anyone can view active hero slides
CREATE POLICY "Anyone can view active hero slides"
ON public.hero_slides
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

-- Admins can manage hero slides
CREATE POLICY "Admins can manage hero slides"
ON public.hero_slides
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default hero slides
INSERT INTO public.hero_slides (flag_name, title, subtitle, button_text, button_url, image_url, display_order) VALUES
('New Arrival', 'Unleash Your Peak Performance', 'Premium Basketball Collection 2025', 'Shop Basketball', '/products?category=basketball', '', 0),
('Offer', 'Run Beyond Limits', 'Revolutionary Running Shoes', 'Explore Collection', '/products?category=running', '', 1),
('Best Seller', 'Champion Your Game', 'Top Rated Performance Gear', 'Shop Now', '/products', '', 2),
('Limited Edition', 'Exclusive Drop', 'Limited Edition Collection', 'Get Yours', '/products?flag=Limited Edition', '', 3);