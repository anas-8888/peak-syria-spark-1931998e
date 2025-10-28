-- Assign all permissions to super admin role
DO $$
DECLARE
  v_super_admin_role_id UUID;
  v_permission RECORD;
BEGIN
  -- Get super admin role id
  SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'super admin';
  
  IF v_super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found';
  END IF;
  
  -- Delete existing permissions for super admin
  DELETE FROM public.role_permissions WHERE role_id = v_super_admin_role_id;
  
  -- Insert all permissions for super admin
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_super_admin_role_id, id
  FROM public.permissions;
END $$;