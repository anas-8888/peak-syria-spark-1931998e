-- Rename admin role to super admin and update all references
UPDATE public.roles SET name = 'super admin' WHERE name = 'admin';

-- Update is_admin function to check for 'super admin'
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'super admin');
$$;

-- Update handle_admin_signup trigger function
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Update the profile with the role_id
  UPDATE public.profiles
  SET role_id = v_role_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$function$;