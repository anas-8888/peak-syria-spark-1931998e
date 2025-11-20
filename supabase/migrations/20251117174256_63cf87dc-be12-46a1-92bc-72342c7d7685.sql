-- Add unique constraint to phone column in profiles table
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Add index for better performance on phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;