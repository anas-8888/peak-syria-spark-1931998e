-- Create colors table
CREATE TABLE public.colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  hex_code TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active colors"
  ON public.colors FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage colors"
  ON public.colors FOR ALL
  USING (is_admin(auth.uid()));

-- Create product_colors junction table
CREATE TABLE public.product_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_id UUID NOT NULL REFERENCES public.colors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, color_id)
);

-- Enable RLS
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_colors
CREATE POLICY "Anyone can view product colors"
  ON public.product_colors FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product colors"
  ON public.product_colors FOR ALL
  USING (is_admin(auth.uid()));

-- Insert initial color data
INSERT INTO public.colors (name, hex_code, display_order) VALUES
  ('Black', '#000000', 1),
  ('White', '#FFFFFF', 2),
  ('Red', '#FF0000', 3),
  ('Blue', '#0000FF', 4),
  ('Green', '#00FF00', 5),
  ('Yellow', '#FFFF00', 6),
  ('Orange', '#FFA500', 7),
  ('Purple', '#800080', 8),
  ('Pink', '#FFC0CB', 9),
  ('Gray', '#808080', 10),
  ('Navy', '#000080', 11),
  ('Beige', '#F5F5DC', 12);

-- Trigger for updated_at
CREATE TRIGGER update_colors_updated_at
  BEFORE UPDATE ON public.colors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();