-- Add contact information fields to store_settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS business_hours TEXT DEFAULT 'Mon-Sat, 9AM-8PM',
ADD COLUMN IF NOT EXISTS physical_address TEXT DEFAULT 'Damascus, Syria',
ADD COLUMN IF NOT EXISTS email_response_time TEXT DEFAULT 'We''ll reply within 24 hours',
ADD COLUMN IF NOT EXISTS whatsapp_description TEXT DEFAULT 'Quick responses guaranteed',
ADD COLUMN IF NOT EXISTS phone_description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS location_description TEXT DEFAULT 'Visit us at our showroom';