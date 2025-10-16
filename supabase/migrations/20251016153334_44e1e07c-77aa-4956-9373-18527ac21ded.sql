-- Add participant_name column to test_results table
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS participant_name TEXT;

-- Update existing records to get name from registrations table based on email
UPDATE test_results tr
SET participant_name = r.name
FROM registrations r
WHERE tr.email = r.email AND tr.participant_name IS NULL;