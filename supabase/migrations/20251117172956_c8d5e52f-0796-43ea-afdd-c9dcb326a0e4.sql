-- Fix admin email mismatch in handle_new_user function
-- Update from admin@peaksyria.com to admin@peak-sy.com

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate handle_new_user function with correct admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Check if the new user is the admin email (FIXED: updated to admin@peak-sy.com)
  IF NEW.email = 'admin@peak-sy.com' THEN
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