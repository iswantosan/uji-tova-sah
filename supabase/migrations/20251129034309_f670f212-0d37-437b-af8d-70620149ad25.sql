-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create RLS policies for payment-proofs bucket
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Users can view their own payment proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs' AND is_admin());

CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'payment-proofs' AND is_admin());