-- First, let's create a proper role system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow authenticated users to manage registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow authenticated users to view payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated users to manage payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated users to view test results" ON public.test_results;
DROP POLICY IF EXISTS "Allow authenticated users to manage test results" ON public.test_results;

-- Create secure policies for registrations
CREATE POLICY "Users can view their own registrations" 
ON public.registrations 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own registrations" 
ON public.registrations 
FOR INSERT 
TO authenticated
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all registrations" 
ON public.registrations 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage all registrations" 
ON public.registrations 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create secure policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own payments" 
ON public.payments 
FOR INSERT 
TO authenticated
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage payments" 
ON public.payments 
FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create secure policies for test results
CREATE POLICY "Users can view their own test results" 
ON public.test_results 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own test results" 
ON public.test_results 
FOR INSERT 
TO authenticated
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all test results" 
ON public.test_results 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage test results" 
ON public.test_results 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Insert admin role for existing users (you'll need to modify this based on your admin user)
-- This is commented out - you should manually add admin roles for specific users
-- INSERT INTO public.user_roles (user_id, role) 
-- SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'your-admin-email@example.com';