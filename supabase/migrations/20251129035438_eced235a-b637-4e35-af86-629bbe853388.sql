-- Make payment-proofs bucket public so images can be accessed via public URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';