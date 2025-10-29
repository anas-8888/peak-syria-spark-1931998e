-- Create regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Create policies for regions
CREATE POLICY "Anyone can view active regions"
ON public.regions
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage regions"
ON public.regions
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_regions_updated_at
BEFORE UPDATE ON public.regions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default regions
INSERT INTO public.regions (name, country) VALUES
  ('Damascus', 'Syria'),
  ('Aleppo', 'Syria'),
  ('Homs', 'Syria'),
  ('Latakia', 'Syria'),
  ('Hama', 'Syria')
ON CONFLICT (name) DO NOTHING;