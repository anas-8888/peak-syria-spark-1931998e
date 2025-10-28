-- Create roles table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default roles
INSERT INTO public.roles (name) VALUES 
  ('customer'),
  ('admin'),
  ('moderator');

-- Add role_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role_id UUID REFERENCES public.roles(id);

-- Migrate existing user_roles data to profiles
UPDATE public.profiles p
SET role_id = (
  SELECT r.id 
  FROM public.roles r
  JOIN public.user_roles ur ON ur.role::TEXT = r.name
  WHERE ur.user_id = p.id
  LIMIT 1
);

-- Set default role_id for profiles without a role
UPDATE public.profiles p
SET role_id = (SELECT id FROM public.roles WHERE name = 'customer')
WHERE role_id IS NULL;

-- Make role_id NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN role_id SET NOT NULL;

-- Update role_permissions to use role_id instead of role enum
ALTER TABLE public.role_permissions 
DROP CONSTRAINT IF EXISTS role_permissions_role_fkey,
ADD COLUMN role_id UUID REFERENCES public.roles(id);

-- Migrate role_permissions data
UPDATE public.role_permissions rp
SET role_id = (
  SELECT id FROM public.roles r WHERE r.name = rp.role::TEXT
);

-- Make role_id NOT NULL and drop old role column
ALTER TABLE public.role_permissions 
ALTER COLUMN role_id SET NOT NULL,
DROP COLUMN role;

-- Drop old user_roles table
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Drop old app_role enum
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for roles table
CREATE POLICY "Anyone can view roles"
ON public.roles FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage roles"
ON public.roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role_id = (SELECT id FROM public.roles WHERE name = 'admin')
  )
);

-- Update has_role function to work with new structure
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = _user_id
    AND r.name = _role_name
  )
$$;

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Update handle_admin_signup trigger function
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Check if the new user is the admin email
  IF NEW.email = 'admin@peaksyria.com' THEN
    -- Get admin role id
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'admin';
  ELSE
    -- Get customer role id for regular users
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'customer';
  END IF;
  
  -- Update the profile with the role_id
  UPDATE public.profiles
  SET role_id = v_role_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Add customer permissions
INSERT INTO public.permissions (name, description, category) VALUES
  ('browse_products', 'Can browse and view products', 'Products'),
  ('view_product_details', 'Can view detailed product information', 'Products'),
  ('add_to_cart', 'Can add products to cart', 'Shopping'),
  ('create_order', 'Can create and place orders', 'Orders'),
  ('view_own_orders', 'Can view their own orders', 'Orders'),
  ('update_own_profile', 'Can update their own profile', 'Profile'),
  ('view_categories', 'Can view product categories', 'Categories')
ON CONFLICT (name) DO NOTHING;

-- Assign customer permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'customer'),
  p.id
FROM public.permissions p
WHERE p.name IN (
  'browse_products',
  'view_product_details', 
  'add_to_cart',
  'create_order',
  'view_own_orders',
  'update_own_profile',
  'view_categories'
)
ON CONFLICT DO NOTHING;