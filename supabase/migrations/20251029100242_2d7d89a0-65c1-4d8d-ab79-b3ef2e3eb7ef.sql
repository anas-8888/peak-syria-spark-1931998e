-- Add INSERT policy for payments table to allow users to create payments for their orders
CREATE POLICY "Users can create payments for their orders"
ON payments FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_id 
    AND orders.user_id = auth.uid()
    AND orders.total_amount = amount
  )
  AND status = 'pending'
);