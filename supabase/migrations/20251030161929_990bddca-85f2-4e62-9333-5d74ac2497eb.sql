-- Create collections table for curated product collections
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  icon_name TEXT DEFAULT 'package',
  background_gradient TEXT DEFAULT 'from-primary/20 to-primary/5',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Admins can manage collections
CREATE POLICY "Admins can manage collections"
ON public.collections
FOR ALL
USING (is_admin(auth.uid()));

-- Anyone can view active collections
CREATE POLICY "Anyone can view active collections"
ON public.collections
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();