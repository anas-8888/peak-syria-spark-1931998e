-- Fix profiles RLS policy to prevent unauthorized access to phone numbers and PII
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create restrictive policy: users can only view their own profile, admins can view all
CREATE POLICY "Users can view own profile and admins can view all"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id 
  OR is_admin(auth.uid())
);