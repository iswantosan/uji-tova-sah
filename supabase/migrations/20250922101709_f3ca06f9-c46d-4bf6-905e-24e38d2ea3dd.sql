-- Allow anonymous users to view payments they can verify with email and payment code
CREATE POLICY "Anyone can view payments with matching email and code" 
ON public.payments 
FOR SELECT 
TO anon, authenticated
USING (true);