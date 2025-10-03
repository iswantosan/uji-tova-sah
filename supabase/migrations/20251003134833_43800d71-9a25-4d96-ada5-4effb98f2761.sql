-- Add unique constraint to prevent multiple tests with same payment code
-- First, let's keep only the most recent test for each payment_code
WITH ranked_tests AS (
  SELECT id, 
         payment_code,
         ROW_NUMBER() OVER (PARTITION BY payment_code ORDER BY test_date DESC) as rn
  FROM test_results
)
DELETE FROM test_results
WHERE id IN (
  SELECT id FROM ranked_tests WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE test_results 
ADD CONSTRAINT unique_payment_code UNIQUE (payment_code);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT unique_payment_code ON test_results IS 
'Ensures each payment code can only be used for one test attempt';