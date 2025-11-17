
-- Fix the existing order by linking it to the correct discount and creating discount_usages record
-- This order has a 100,000 discount (10% of 1,000,000) applied to product dad792fc-f2ec-4fe9-bfe5-ecd3245a2469

-- Update the order to include the discount_id
UPDATE orders 
SET discount_id = '3628d34d-f40b-4463-9be0-b226751b50fc'
WHERE id = '2a61c17a-20be-4433-aeb5-a219f639e607'
AND discount_id IS NULL;

-- Create the missing discount_usages record
INSERT INTO discount_usages (
  discount_id,
  order_id,
  user_id,
  discount_amount,
  order_subtotal,
  created_at
)
SELECT 
  '3628d34d-f40b-4463-9be0-b226751b50fc',
  '2a61c17a-20be-4433-aeb5-a219f639e607',
  o.user_id,
  100000,
  1000000,
  o.created_at
FROM orders o
WHERE o.id = '2a61c17a-20be-4433-aeb5-a219f639e607'
AND NOT EXISTS (
  SELECT 1 FROM discount_usages 
  WHERE order_id = '2a61c17a-20be-4433-aeb5-a219f639e607'
);

-- Update discount stats to reflect this usage
UPDATE discounts
SET 
  total_uses = total_uses + 1,
  total_revenue = total_revenue + 1000000
WHERE id = '3628d34d-f40b-4463-9be0-b226751b50fc'
AND NOT EXISTS (
  SELECT 1 FROM discount_usages 
  WHERE order_id = '2a61c17a-20be-4433-aeb5-a219f639e607' 
  AND discount_id = '3628d34d-f40b-4463-9be0-b226751b50fc'
);
