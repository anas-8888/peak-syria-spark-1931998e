-- Add customer receipt confirmation to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_confirmed_receipt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS receipt_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add timestamp columns for each order status transition
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pending_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS processing_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Create trigger to update status timestamps automatically
CREATE OR REPLACE FUNCTION update_order_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp based on status change
  IF NEW.status = 'processing' AND OLD.status != 'processing' THEN
    NEW.processing_at = now();
  ELSIF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    NEW.shipped_at = now();
  ELSIF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = now();
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_timestamp_trigger
BEFORE UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_order_status_timestamp();

-- Add RLS policy for users to confirm receipt of their own orders
CREATE POLICY "Users can confirm receipt of their own orders"
ON orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);