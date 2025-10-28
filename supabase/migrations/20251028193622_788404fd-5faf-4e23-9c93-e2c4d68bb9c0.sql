-- Remove recursive ALL policy on roles that causes infinite recursion
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.roles;

-- Ensure SELECT remains open to view roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'Anyone can view roles'
  ) THEN
    CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT USING (true);
  END IF;
END $$;