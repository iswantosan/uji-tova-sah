-- Fix RLS policy for registrations to allow anonymous registration
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;

-- Create a policy that explicitly allows anonymous users to register
CREATE POLICY "Allow anonymous registration" 
ON public.registrations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);