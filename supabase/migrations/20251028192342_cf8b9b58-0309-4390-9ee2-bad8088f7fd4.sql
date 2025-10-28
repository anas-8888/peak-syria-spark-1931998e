-- Fix RLS recursion on roles and invalid INSERT USING
-- 1) Drop problematic policies on roles
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.roles;
DROP POLICY IF EXISTS "Super admins can update non-reserved roles" ON public.roles;
DROP POLICY IF EXISTS "Super admins can delete non-reserved roles" ON public.roles;

-- 2) Recreate roles policies WITHOUT recursion (avoid is_admin/has_role) and fix INSERT
-- Keep public SELECT policy as-is (created earlier): "Anyone can view roles" USING (true)

-- INSERT: only WITH CHECK is allowed
CREATE POLICY "Super admins manage roles - insert"
ON public.roles FOR INSERT
WITH CHECK ((auth.jwt() ->> 'email') = 'admin@peaksyria.com');

-- UPDATE: protect reserved names and restrict to super admin email
CREATE POLICY "Super admins manage roles - update"
ON public.roles FOR UPDATE
USING ((auth.jwt() ->> 'email') = 'admin@peaksyria.com' AND name NOT IN ('super admin','customer'))
WITH CHECK ((auth.jwt() ->> 'email') = 'admin@peaksyria.com' AND name NOT IN ('super admin','customer'));

-- DELETE: protect reserved names and restrict to super admin email
CREATE POLICY "Super admins manage roles - delete"
ON public.roles FOR DELETE
USING ((auth.jwt() ->> 'email') = 'admin@peaksyria.com' AND name NOT IN ('super admin','customer'));
