-- First check current policies on test_results
-- Drop all existing policies on test_results
DROP POLICY IF EXISTS "Admins can view all test results" ON test_results;
DROP POLICY IF EXISTS "Admins can manage test results" ON test_results;
DROP POLICY IF EXISTS "Users can view their own test results" ON test_results;
DROP POLICY IF EXISTS "Anyone can create test results" ON test_results;
DROP POLICY IF EXISTS "Enable insert for test results" ON test_results;

-- Create new policies that work correctly
-- Allow anyone (authenticated or anonymous) to insert test results
CREATE POLICY "Allow all inserts to test_results"
ON test_results
FOR INSERT
WITH CHECK (true);

-- Allow admins to view all test results
CREATE POLICY "Admins can view all test results"
ON test_results
FOR SELECT
USING (is_admin());

-- Allow admins to update/delete test results  
CREATE POLICY "Admins can update test results"
ON test_results
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete test results"
ON test_results
FOR DELETE
USING (is_admin());

-- Allow authenticated users to view their own test results
CREATE POLICY "Users can view their own test results"
ON test_results
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);