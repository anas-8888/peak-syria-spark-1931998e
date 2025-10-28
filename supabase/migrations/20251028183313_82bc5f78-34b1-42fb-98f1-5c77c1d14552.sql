-- Create permissions table for granular access control
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions
CREATE POLICY "Admins can manage permissions"
ON public.permissions
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view permissions"
ON public.permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for role_permissions
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Seed default permissions
INSERT INTO public.permissions (name, description, category) VALUES
-- User Management
('view_users', 'View users list', 'Users'),
('edit_users', 'Edit user information', 'Users'),
('delete_users', 'Delete users', 'Users'),

-- Product Management
('view_products', 'View products list', 'Products'),
('create_products', 'Create new products', 'Products'),
('edit_products', 'Edit product information', 'Products'),
('delete_products', 'Delete products', 'Products'),

-- Order Management
('view_orders', 'View orders list', 'Orders'),
('edit_orders', 'Edit order status', 'Orders'),
('delete_orders', 'Delete orders', 'Orders'),

-- Category Management
('view_categories', 'View categories list', 'Categories'),
('create_categories', 'Create new categories', 'Categories'),
('edit_categories', 'Edit category information', 'Categories'),
('delete_categories', 'Delete categories', 'Categories'),

-- Analytics
('view_analytics', 'View analytics dashboard', 'Analytics'),

-- Settings
('manage_settings', 'Manage application settings', 'Settings'),
('manage_roles', 'Manage user roles and permissions', 'Roles');

-- Grant all permissions to admin role by default
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions;