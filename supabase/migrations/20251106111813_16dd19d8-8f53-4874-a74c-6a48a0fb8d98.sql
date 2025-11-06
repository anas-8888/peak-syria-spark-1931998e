-- Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  english_key text NOT NULL UNIQUE,
  arabic_value text NOT NULL,
  is_auto_detected boolean NOT NULL DEFAULT false,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view translations"
ON public.translations
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage translations"
ON public.translations
FOR ALL
USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_translations_english_key ON public.translations(english_key);
CREATE INDEX IF NOT EXISTS idx_translations_is_auto_detected ON public.translations(is_auto_detected);
CREATE INDEX IF NOT EXISTS idx_translations_last_seen_at ON public.translations(last_seen_at);

-- Create function to update last_seen_at
CREATE OR REPLACE FUNCTION public.update_translation_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updating last_seen_at
CREATE TRIGGER update_translations_last_seen
BEFORE UPDATE ON public.translations
FOR EACH ROW
EXECUTE FUNCTION public.update_translation_last_seen();

-- Insert existing translations from JSON
INSERT INTO public.translations (english_key, arabic_value, is_auto_detected)
SELECT key, value, false
FROM json_each_text('{"All Products": "جميع المنتجات", "About": "من نحن", "Search": "بحث", "Cart": "السلة", "My Profile": "ملفي الشخصي", "My Wishlist": "قائمة الأمنيات", "Sign Out": "تسجيل الخروج", "Dashboard": "لوحة التحكم"}'::json)
ON CONFLICT (english_key) DO NOTHING;

COMMENT ON TABLE public.translations IS 'Stores all website translations with automatic detection of missing keys';