-- Drop existing insert policy
DROP POLICY IF EXISTS "Anyone can create test results" ON test_results;

-- Create new policy that allows anonymous inserts
CREATE POLICY "Enable insert for test results"
ON test_results
FOR INSERT
TO anon, authenticated
WITH CHECK (true);