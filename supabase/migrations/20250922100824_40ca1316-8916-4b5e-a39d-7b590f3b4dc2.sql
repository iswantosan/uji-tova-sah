-- Grant admin role to the admin user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('5a43a386-67ec-4d86-87a8-c28fdb0b7b54', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;