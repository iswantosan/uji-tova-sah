-- Drop and recreate the insert policy to explicitly include anon role
DROP POLICY IF EXISTS "Allow all inserts to test_results" ON test_results;

-- Create policy that explicitly allows anon and authenticated roles
CREATE POLICY "Allow all inserts to test_results"
ON test_results
FOR INSERT
TO anon, authenticated
WITH CHECK (true);