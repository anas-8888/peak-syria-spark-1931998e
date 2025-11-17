-- Update admin email from admin@peaksyria.com to admin@peak-sy.com

-- Update the email in auth.users table
UPDATE auth.users 
SET email = 'admin@peak-sy.com',
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{email}',
      '"admin@peak-sy.com"'
    )
WHERE email = 'admin@peaksyria.com';

-- Update the email in profiles table
UPDATE public.profiles 
SET email = 'admin@peak-sy.com'
WHERE email = 'admin@peaksyria.com';

-- Update RLS policies on profiles table that reference the old email
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()) OR ((auth.jwt() ->> 'email'::text) = 'admin@peak-sy.com'::text));

-- Update RLS policies on roles table
DROP POLICY IF EXISTS "Super admins manage roles - insert" ON public.roles;
CREATE POLICY "Super admins manage roles - insert"
ON public.roles
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@peak-sy.com'::text);

DROP POLICY IF EXISTS "Super admins manage roles - update" ON public.roles;
CREATE POLICY "Super admins manage roles - update"
ON public.roles
FOR UPDATE
USING (((auth.jwt() ->> 'email'::text) = 'admin@peak-sy.com'::text) AND (name <> ALL (ARRAY['super admin'::text, 'customer'::text])))
WITH CHECK (((auth.jwt() ->> 'email'::text) = 'admin@peak-sy.com'::text) AND (name <> ALL (ARRAY['super admin'::text, 'customer'::text])));

DROP POLICY IF EXISTS "Super admins manage roles - delete" ON public.roles;
CREATE POLICY "Super admins manage roles - delete"
ON public.roles
FOR DELETE
USING (((auth.jwt() ->> 'email'::text) = 'admin@peak-sy.com'::text) AND (name <> ALL (ARRAY['super admin'::text, 'customer'::text])));