-- Create about_us table
CREATE TABLE IF NOT EXISTS public.about_us (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title TEXT NOT NULL DEFAULT 'About PEAK Syria',
  hero_subtitle TEXT NOT NULL DEFAULT 'The official and exclusive distributor of PEAK sportswear in Syria',
  story_title TEXT NOT NULL DEFAULT 'Our Story',
  story_content TEXT NOT NULL DEFAULT 'PEAK Syria is proud to be the official distributor of PEAK Sport Products in Syria. Founded with a passion for sports and a commitment to excellence, we bring world-class athletic footwear and apparel to Syrian athletes and sports enthusiasts.',
  mission_title TEXT NOT NULL DEFAULT 'Our Mission',
  mission_content TEXT NOT NULL DEFAULT 'To empower athletes and sports enthusiasts across Syria with premium, authentic PEAK sportswear, fostering a culture of excellence, performance, and healthy living.',
  values JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_us ENABLE ROW LEVEL SECURITY;

-- Anyone can view about us content
CREATE POLICY "Anyone can view about us"
  ON public.about_us
  FOR SELECT
  USING (true);

-- Only admins can manage about us content
CREATE POLICY "Admins can manage about us"
  ON public.about_us
  FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default values
INSERT INTO public.about_us (
  hero_title,
  hero_subtitle,
  story_title,
  story_content,
  mission_title,
  mission_content,
  values
) VALUES (
  'About PEAK Syria',
  'The official and exclusive distributor of PEAK sportswear in Syria',
  'Our Story',
  'PEAK Syria is proud to be the official distributor of PEAK Sport Products in Syria. Founded with a passion for sports and a commitment to excellence, we bring world-class athletic footwear and apparel to Syrian athletes and sports enthusiasts.

PEAK is a leading international sports brand with a strong presence in over 100 countries. Known for its innovative designs, cutting-edge technology, and premium quality, PEAK has become the choice of professional athletes worldwide.

We are committed to providing authentic PEAK products, exceptional customer service, and promoting an active lifestyle throughout Syria. Whether you''re a professional athlete or just starting your fitness journey, PEAK Syria is here to support your goals.',
  'Our Mission',
  'To empower athletes and sports enthusiasts across Syria with premium, authentic PEAK sportswear, fostering a culture of excellence, performance, and healthy living. We strive to make world-class athletic gear accessible to everyone, from professional athletes to weekend warriors.',
  '[
    {
      "icon": "Shield",
      "title": "100% Authentic",
      "description": "Official distributor ensuring genuine PEAK products"
    },
    {
      "icon": "Award",
      "title": "Premium Quality",
      "description": "World-class materials and craftsmanship"
    },
    {
      "icon": "Users",
      "title": "Expert Support",
      "description": "Dedicated team to help you find the perfect fit"
    },
    {
      "icon": "TrendingUp",
      "title": "Latest Collections",
      "description": "First access to new releases and innovations"
    }
  ]'::jsonb
);

-- Create trigger for updated_at
CREATE TRIGGER update_about_us_updated_at
  BEFORE UPDATE ON public.about_us
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();