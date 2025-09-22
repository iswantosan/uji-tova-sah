-- Create registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID REFERENCES public.registrations(id),
  email TEXT NOT NULL,
  payment_code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create test_results table
CREATE TABLE public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id),
  email TEXT NOT NULL,
  payment_code TEXT NOT NULL,
  test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration TEXT NOT NULL,
  omission_errors INTEGER NOT NULL DEFAULT 0,
  commission_errors INTEGER NOT NULL DEFAULT 0,
  response_time NUMERIC NOT NULL DEFAULT 0,
  variability NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed'))
);

-- Enable Row Level Security
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (assuming admin users will be authenticated)
-- For now, allow all authenticated users to access these tables
-- You may want to restrict this to specific admin roles later

CREATE POLICY "Allow authenticated users to view registrations" 
ON public.registrations 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage registrations" 
ON public.registrations 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage payments" 
ON public.payments 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view test results" 
ON public.test_results 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage test results" 
ON public.test_results 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_registrations_email ON public.registrations(email);
CREATE INDEX idx_registrations_status ON public.registrations(status);
CREATE INDEX idx_payments_email ON public.payments(email);
CREATE INDEX idx_payments_code ON public.payments(payment_code);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_test_results_email ON public.test_results(email);
CREATE INDEX idx_test_results_payment_code ON public.test_results(payment_code);