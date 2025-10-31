-- Create shipping_carriers table
CREATE TABLE public.shipping_carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_cost NUMERIC NOT NULL DEFAULT 0,
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipping_carrier_regions table (junction table)
CREATE TABLE public.shipping_carrier_regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID NOT NULL REFERENCES public.shipping_carriers(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(carrier_id, region_id)
);

-- Enable RLS
ALTER TABLE public.shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_carrier_regions ENABLE ROW LEVEL SECURITY;

-- Policies for shipping_carriers
CREATE POLICY "Anyone can view active carriers"
ON public.shipping_carriers
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage carriers"
ON public.shipping_carriers
FOR ALL
USING (is_admin(auth.uid()));

-- Policies for shipping_carrier_regions
CREATE POLICY "Anyone can view carrier regions"
ON public.shipping_carrier_regions
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage carrier regions"
ON public.shipping_carrier_regions
FOR ALL
USING (is_admin(auth.uid()));

-- Add shipping info to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_carrier_id UUID REFERENCES public.shipping_carriers(id),
ADD COLUMN IF NOT EXISTS shipping_region_id UUID REFERENCES public.regions(id),
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index for better performance
CREATE INDEX idx_shipping_carrier_regions_carrier ON public.shipping_carrier_regions(carrier_id);
CREATE INDEX idx_shipping_carrier_regions_region ON public.shipping_carrier_regions(region_id);