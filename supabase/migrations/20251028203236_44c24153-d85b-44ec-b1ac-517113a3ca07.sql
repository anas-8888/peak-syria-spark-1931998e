-- Drop all existing triggers and functions properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;

-- Now drop the functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_admin_signup() CASCADE;

-- Create improved function that assigns default role during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Check if the new user is the admin email
  IF NEW.email = 'admin@peaksyria.com' THEN
    -- Get super admin role id
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'super admin';
  ELSE
    -- Get customer role id for regular users
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'customer';
  END IF;
  
  -- Insert profile with role_id
  INSERT INTO public.profiles (id, email, full_name, role_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role_id
  );
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();