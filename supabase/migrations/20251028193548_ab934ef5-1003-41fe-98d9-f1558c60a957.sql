-- Safe creation of admin view policy on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (is_admin(auth.uid()) OR (auth.jwt() ->> 'email') = 'admin@peaksyria.com');
  END IF;
END $$;