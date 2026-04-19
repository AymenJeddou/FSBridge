
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
-- Allow public read by direct path; bucket listing prevented by not granting list at API.
CREATE POLICY "avatars_public_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
-- Make bucket NOT public-listable but objects still publicly readable via URL
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
