-- Allow anyone to view public profile information (name and avatar)
-- This is needed so that product reviews can display reviewer names publicly
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
TO public
USING (true);