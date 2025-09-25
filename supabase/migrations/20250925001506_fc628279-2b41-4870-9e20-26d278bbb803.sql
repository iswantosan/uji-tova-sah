-- Temporarily disable RLS on registrations table to allow registration
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on payments table  
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;