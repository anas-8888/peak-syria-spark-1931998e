-- Add image_url and additional_data to payment_methods table
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS additional_data TEXT;

-- Update existing payment methods to have null values for new columns
UPDATE payment_methods 
SET image_url = NULL, additional_data = NULL
WHERE image_url IS NULL;