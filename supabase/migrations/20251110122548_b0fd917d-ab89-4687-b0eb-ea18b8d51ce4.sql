-- Add language preference to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add GPS coordinates to orders table for delivery location
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language (en or ar)';
COMMENT ON COLUMN public.orders.delivery_latitude IS 'GPS latitude of delivery location if user clicked use GPS';
COMMENT ON COLUMN public.orders.delivery_longitude IS 'GPS longitude of delivery location if user clicked use GPS';