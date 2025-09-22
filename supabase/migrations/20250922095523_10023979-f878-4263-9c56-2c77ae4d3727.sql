-- Fix RLS policies for public registration
-- Drop the current restrictive policy for inserting registrations
DROP POLICY IF EXISTS "Users can insert their own registrations" ON public.registrations;

-- Allow anyone (unauthenticated users) to register
CREATE POLICY "Anyone can register" 
ON public.registrations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- For payments, also allow unauthenticated users to create payments
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;

CREATE POLICY "Anyone can create payments" 
ON public.payments 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- For test results, allow unauthenticated users to insert results  
DROP POLICY IF EXISTS "Users can insert their own test results" ON public.test_results;

CREATE POLICY "Anyone can create test results" 
ON public.test_results 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);