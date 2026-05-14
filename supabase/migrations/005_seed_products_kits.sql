-- ============================================================
-- SEED: Products and Kits with PNG images (transparent background)
-- ============================================================

-- Clear existing data (optional - comment out if you want to keep existing)
-- DELETE FROM public.products;
-- DELETE FROM public.kits;

-- Update existing products with new PNG images
UPDATE public.products SET image_url = '/products/frango-inteiro.png' WHERE slug = 'frango-inteiro';
UPDATE public.products SET image_url = '/products/peito-frango.png' WHERE slug = 'peito-frango' OR slug = 'peito-de-frango';
UPDATE public.products SET image_url = '/products/coxa-sobrecoxa.png' WHERE slug = 'coxa-sobrecoxa' OR slug = 'coxa-e-sobrecoxa';
UPDATE public.products SET image_url = '/products/asa-frango.png' WHERE slug = 'asa-frango' OR slug = 'asa-de-frango';
UPDATE public.products SET image_url = '/products/miudo-frango.png' WHERE slug = 'miudo-frango' OR slug = 'miudos';

-- Insert products if they don't exist
INSERT INTO public.products (name, slug, description, short_description, price, original_price, unit, image_url, is_active, is_featured, stock_quantity) VALUES
  ('Frango Inteiro', 'frango-inteiro', 'Frango inteiro fresco, abatido na hora. Perfeito para assar ou cozinhar.', 'Frango fresco inteiro', 29.90, 34.90, 'kg', '/products/frango-inteiro.png', true, true, 100),
  ('Peito de Frango', 'peito-de-frango', 'Peito de frango desossado, ideal para grelhados e receitas fitness.', 'Peito desossado premium', 24.90, 29.90, 'kg', '/products/peito-frango.png', true, true, 100),
  ('Coxa e Sobrecoxa', 'coxa-e-sobrecoxa', 'Coxa e sobrecoxa juntas, perfeitas para churrasco e assados.', 'Corte suculento', 19.90, 24.90, 'kg', '/products/coxa-sobrecoxa.png', true, true, 100),
  ('Asa de Frango', 'asa-de-frango', 'Asas de frango frescas, ótimas para fritar ou assar.', 'Crocante e saborosa', 17.90, 22.90, 'kg', '/products/asa-frango.png', true, true, 100),
  ('Miúdos de Frango', 'miudos', 'Fígado, coração e moela frescos.', 'Miúdos selecionados', 14.90, 18.90, 'kg', '/products/miudo-frango.png', true, true, 100)
ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  is_featured = EXCLUDED.is_featured;

-- Update existing kits with new PNG images
UPDATE public.kits SET image_url = '/kits/kit-churrasco.png' WHERE slug = 'kit-churrasco';
UPDATE public.kits SET image_url = '/kits/kit-familia.png' WHERE slug = 'kit-familia';
UPDATE public.kits SET image_url = '/kits/kit-economico.png' WHERE slug = 'kit-economico';

-- Insert kits if they don't exist
INSERT INTO public.kits (name, slug, description, price, original_price, image_url, contents, is_active, is_featured) VALUES
  ('Kit Churrasco', 'kit-churrasco', 'Kit completo para o churrasco perfeito', 89.90, 109.90, '/kits/kit-churrasco.png', '1kg Coxa e Sobrecoxa, 1kg Asa, 500g Coração', true, true),
  ('Kit Família', 'kit-familia', 'Kit ideal para alimentar toda a família', 69.90, 89.90, '/kits/kit-familia.png', '1 Frango Inteiro, 1kg Peito, 500g Miúdos', true, true),
  ('Kit Econômico', 'kit-economico', 'Economia para o dia a dia', 49.90, 64.90, '/kits/kit-economico.png', '1 Frango Inteiro, 500g Coxa e Sobrecoxa', true, true)
ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  is_featured = EXCLUDED.is_featured;
