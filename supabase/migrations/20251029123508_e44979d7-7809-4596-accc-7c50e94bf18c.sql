-- Update bogo_config structure to use percentage instead of fixed price
-- The bogo_config jsonb field will now store:
-- {
--   "buy_quantity": number,
--   "get_quantity": number,
--   "get_discount_percentage": number (0-100)
-- }
-- instead of get_price

COMMENT ON COLUMN discounts.bogo_config IS 'BOGO configuration: {buy_quantity, get_quantity, get_discount_percentage (0-100)}';