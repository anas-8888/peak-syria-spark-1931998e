-- Remove default first
ALTER TABLE public.discounts ALTER COLUMN scope DROP DEFAULT;

-- Rename old enum
ALTER TYPE discount_scope RENAME TO discount_scope_old;

-- Create new enum
CREATE TYPE discount_scope AS ENUM (
  'store_wide',
  'categories',
  'products',
  'flags'
);

-- Update the column type
ALTER TABLE public.discounts 
  ALTER COLUMN scope TYPE discount_scope 
  USING scope::text::discount_scope;

-- Drop old enum
DROP TYPE discount_scope_old;

-- Re-add default
ALTER TABLE public.discounts ALTER COLUMN scope SET DEFAULT 'store_wide';