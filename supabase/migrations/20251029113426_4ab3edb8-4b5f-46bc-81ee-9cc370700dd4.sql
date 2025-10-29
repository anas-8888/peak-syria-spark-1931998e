-- Drop existing discount_type enum and recreate with new types
ALTER TABLE discounts DROP CONSTRAINT IF EXISTS discounts_type_check;

-- Update the type column to text temporarily
ALTER TABLE discounts ALTER COLUMN type TYPE text;

-- Drop the old enum type
DROP TYPE IF EXISTS discount_type CASCADE;

-- Create new enum with all discount types
CREATE TYPE discount_type AS ENUM (
  'percentage',
  'fixed_amount',
  'bogo_x_for_y',
  'tiered',
  'bundle',
  'volume',
  'free_shipping',
  'clearance',
  'flash_sale'
);

-- Convert column back to enum type
ALTER TABLE discounts ALTER COLUMN type TYPE discount_type USING type::discount_type;

-- Add new columns for different discount configurations
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS min_purchase_amount numeric DEFAULT 0;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS bogo_config jsonb DEFAULT NULL;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS bundle_products jsonb DEFAULT NULL;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS bundle_price numeric DEFAULT NULL;

-- Update tiered_config to be more explicit
COMMENT ON COLUMN discounts.tiered_config IS 'Array of tier objects: [{"min_amount": 100000, "discount_percent": 10}, ...]';
COMMENT ON COLUMN discounts.bogo_config IS 'BOGO configuration: {"buy_quantity": 1, "get_quantity": 1, "get_price": 5000}';
COMMENT ON COLUMN discounts.bundle_products IS 'Array of product IDs in bundle: ["uuid1", "uuid2", ...]';
COMMENT ON COLUMN discounts.bundle_price IS 'Fixed price for the bundle';
COMMENT ON COLUMN discounts.min_quantity IS 'Minimum quantity for volume discounts';