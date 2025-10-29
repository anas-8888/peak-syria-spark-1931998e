-- Update button URLs for hero slides to use flag-products route
UPDATE public.hero_slides
SET button_url = '/flag-products?flag=' || REPLACE(flag_name, ' ', '%20')
WHERE button_url IN (
  '/products?category=basketball',
  '/products?category=running',
  '/products',
  '/products?flag=Limited Edition'
);