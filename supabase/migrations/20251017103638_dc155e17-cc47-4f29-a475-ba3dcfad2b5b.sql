-- Remove unique constraint on payment_code to allow multiple tests with same code
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS unique_payment_code;

-- Create index for faster lookups but not unique
CREATE INDEX IF NOT EXISTS idx_test_results_payment_code ON test_results(payment_code);