-- ============================================================
-- STORAGE RLS POLICIES - Product, Kit & Category Images
-- Execute no Supabase SQL Editor
-- ============================================================

-- IMPORTANTE: Execute esse script DEPOIS de criar os buckets!
-- Os buckets ja foram criados via: supabase/migrations/buket storage.sql

-- ============================================================
-- PRODUCT IMAGES BUCKET POLICIES
-- ============================================================

-- Leitura publica (qualquer pessoa pode ver as imagens)
CREATE POLICY "product_images_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Upload por usuarios autenticados
CREATE POLICY "product_images_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Update por usuarios autenticados
CREATE POLICY "product_images_auth_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Delete por usuarios autenticados
CREATE POLICY "product_images_auth_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================================
-- KIT IMAGES BUCKET POLICIES
-- ============================================================

-- Leitura publica
CREATE POLICY "kit_images_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'kit-images');

-- Upload por usuarios autenticados
CREATE POLICY "kit_images_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kit-images'
  AND auth.role() = 'authenticated'
);

-- Update por usuarios autenticados
CREATE POLICY "kit_images_auth_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'kit-images' AND auth.role() = 'authenticated');

-- Delete por usuarios autenticados
CREATE POLICY "kit_images_auth_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'kit-images' AND auth.role() = 'authenticated');

-- ============================================================
-- CATEGORY IMAGES BUCKET POLICIES
-- ============================================================

-- Leitura publica
CREATE POLICY "category_images_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

-- Upload por usuarios autenticados
CREATE POLICY "category_images_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'category-images'
  AND auth.role() = 'authenticated'
);

-- Update por usuarios autenticados
CREATE POLICY "category_images_auth_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'category-images' AND auth.role() = 'authenticated');

-- Delete por usuarios autenticados
CREATE POLICY "category_images_auth_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'category-images' AND auth.role() = 'authenticated');

-- ============================================================
-- VERIFICACAO
-- ============================================================

-- Verificar policies criadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';
