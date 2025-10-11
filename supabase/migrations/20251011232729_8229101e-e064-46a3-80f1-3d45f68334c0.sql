-- Create admin user directly
-- Email: admin@peaksyria.com
-- Password: PeakAdmin2025!

-- Insert admin user in auth.users (this will be handled by Supabase Auth)
-- We'll use a function to create the admin properly

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@peaksyria.com';

  -- If admin doesn't exist, we need to create it manually
  -- Note: In production, you should create the admin through signup first,
  -- then run this migration to grant admin role

  -- For now, we'll just prepare the role assignment
  -- After you signup with admin@peaksyria.com, this will grant admin role automatically
  
  IF admin_user_id IS NOT NULL THEN
    -- User exists, grant admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Create trigger to automatically grant admin role to specific email
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user is the admin email
  IF NEW.email = 'admin@peaksyria.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Insert regular user role for all other users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_signup();