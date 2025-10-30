-- Create store_settings table
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_email TEXT,
  store_phone TEXT,
  whatsapp_number TEXT,
  brand_description TEXT DEFAULT 'Official distributor of PEAK sportswear in Syria. Premium quality, authentic products.',
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view store settings
CREATE POLICY "Anyone can view store settings"
ON public.store_settings
FOR SELECT
USING (true);

-- Only admins can manage store settings
CREATE POLICY "Admins can manage store settings"
ON public.store_settings
FOR ALL
USING (is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.store_settings (store_email, store_phone, whatsapp_number, facebook_url, instagram_url)
VALUES ('info@peaksyria.com', '+963 XXX XXX XXX', '963XXXXXXXXX', '#', '#');

-- Add trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();