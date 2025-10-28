-- 1) Make is_admin compatible with both 'super admin' and legacy 'admin'
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'super admin')
         OR public.has_role(_user_id, 'admin');
$$;

-- 2) Allow admins to UPDATE any profile (keep user self-update policy intact)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- 3) Allow admins to DELETE profiles (customers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can delete profiles'
  ) THEN
    CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE
    USING (is_admin(auth.uid()));
  END IF;
END $$;