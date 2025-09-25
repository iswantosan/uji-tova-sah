-- Drop all existing INSERT policies on registrations
DROP POLICY IF EXISTS "Allow anonymous registration" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;

-- Create a comprehensive policy that definitely allows anonymous registration
CREATE POLICY "Enable insert for anonymous users" 
ON public.registrations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also ensure payments table allows anonymous inserts
DROP POLICY IF EXISTS "Anyone can create payments" ON public.payments;

CREATE POLICY "Enable insert for anonymous payments" 
ON public.payments 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);