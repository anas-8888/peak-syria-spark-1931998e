-- Create order_reviews table
CREATE TABLE public.order_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, user_id)
);

-- Enable RLS
ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

-- Users can create reviews for their own orders (only after receipt confirmation)
CREATE POLICY "Users can create reviews for confirmed orders"
ON public.order_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_reviews.order_id 
    AND orders.user_id = auth.uid()
    AND orders.customer_confirmed_receipt = true
  )
);

-- Users can view their own reviews
CREATE POLICY "Users can view their own reviews"
ON public.order_reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.order_reviews
FOR SELECT
USING (is_admin(auth.uid()));

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.order_reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.order_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_order_reviews_updated_at
BEFORE UPDATE ON public.order_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();