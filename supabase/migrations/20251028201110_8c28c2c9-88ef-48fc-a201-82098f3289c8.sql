-- Fix search_path security warning for generate_product_sku function
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  counter INTEGER;
  new_sku TEXT;
BEGIN
  IF NEW.sku IS NULL THEN
    -- Extract prefix from category or use PEAK
    prefix := COALESCE(UPPER(SUBSTRING(NEW.category FROM 1 FOR 3)), 'PEAK');
    
    -- Get counter based on existing products
    SELECT COUNT(*) + 1 INTO counter FROM products;
    
    -- Generate SKU like PEAK-BBX-001
    new_sku := prefix || '-' || LPAD(counter::TEXT, 3, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM products WHERE sku = new_sku) LOOP
      counter := counter + 1;
      new_sku := prefix || '-' || LPAD(counter::TEXT, 3, '0');
    END LOOP;
    
    NEW.sku := new_sku;
  END IF;
  
  RETURN NEW;
END;
$$;