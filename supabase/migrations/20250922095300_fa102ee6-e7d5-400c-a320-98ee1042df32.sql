-- Create profiles table to store user data accessible via API
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create trigger function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add profiles for existing users
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Now update the RLS policies to use profiles table instead of auth.users
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can insert their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own test results" ON public.test_results;
DROP POLICY IF EXISTS "Users can insert their own test results" ON public.test_results;

-- Create new secure policies using profiles table
CREATE POLICY "Users can view their own registrations" 
ON public.registrations 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own registrations" 
ON public.registrations 
FOR INSERT 
TO authenticated
WITH CHECK (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own payments" 
ON public.payments 
FOR INSERT 
TO authenticated
WITH CHECK (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own test results" 
ON public.test_results 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own test results" 
ON public.test_results 
FOR INSERT 
TO authenticated
WITH CHECK (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));