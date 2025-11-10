-- Fix CRITICAL privilege escalation vulnerability
-- Users should not be able to modify their own role_id

-- First, drop the existing overly permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policy that allows users to update their profile EXCEPT role_id
CREATE POLICY "Users can update own profile fields"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role_id changes by non-admins
  -- This checks that role_id hasn't changed from what's currently in the database
  role_id IS NOT DISTINCT FROM (SELECT role_id FROM profiles WHERE id = auth.uid())
);

-- Create trigger-based protection as additional defense layer
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow admins to modify any role_id
  IF is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  
  -- For non-admins, prevent role_id modification
  IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify user roles';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce role protection
DROP TRIGGER IF EXISTS check_role_modification ON public.profiles;
CREATE TRIGGER check_role_modification
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();