
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_authenticated_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
