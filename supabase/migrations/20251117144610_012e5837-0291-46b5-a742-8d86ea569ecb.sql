-- Add maintenance mode fields to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS maintenance_image_url TEXT;