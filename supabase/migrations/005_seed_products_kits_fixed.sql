-- ============================================================
-- SEED: Products and Kits - CORRIGIDO PARA ESTRUTURA PDV
-- ============================================================

-- ============================================================
-- 1. SEED DE CATEGORIAS (se não existirem)
-- ============================================================
INSERT INTO categories (name, slug, description, image_url, is_active, display_order) VALUES
  ('Frango Inteiro', 'frango-inteiro', 'Frangos inteiros frescos e selecionados', '/categories/frango-inteiro.png', true, 1),
  ('Cortes', 'cortes', 'Peitos, coxas, sobrecoxas e mais', '/categories/cortes.png', true, 2),
  ('Miúdos', 'miudos', 'Fígado, coração e moela', '/categories/miudos.png', true, 3),
  ('Kits Especiais', 'kits-especiais', 'Kits e promoções especiais', '/categories/kits.png', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. SEED DE PRODUTOS (estrutura PDV: price_per_kg, validity_days)
-- ============================================================

-- Atualizar imagens de produtos existentes
UPDATE products SET 
  image_url = '/products/frango-inteiro.png',
  updated_at = now()
WHERE slug = 'frango-inteiro';

UPDATE products SET 
  image_url = '/products/peito-frango.png',
  updated_at = now()
WHERE slug = 'peito-de-frango' OR slug = 'peito-frango';

UPDATE products SET 
  image_url = '/products/coxa-sobrecoxa.png',
  updated_at = now()
WHERE slug = 'coxa-e-sobrecoxa' OR slug = 'coxa-sobrecoxa';

UPDATE products SET 
  image_url = '/products/asa-frango.png',
  updated_at = now()
WHERE slug = 'asa-de-frango' OR slug = 'asa-frango';

UPDATE products SET 
  image_url = '/products/miudo-frango.png',
  updated_at = now()
WHERE slug = 'miudos' OR slug = 'miudo-de-frango' OR slug = 'miudo-frango';

-- Inserir produtos se não existirem (estrutura PDV)
INSERT INTO products (
  name, 
  description, 
  price_per_kg, 
  category_id,
  validity_days,
  image_url,
  product_kind,
  is_active
) 
SELECT 
  'Frango Inteiro',
  'Frango inteiro fresco, abatido na hora. Perfeito para assar ou cozinhar.',
  29.90,
  (SELECT id FROM categories WHERE name = 'Frango Inteiro' LIMIT 1),
  3,
  '/products/frango-inteiro.png',
  'regular',
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Frango Inteiro');

INSERT INTO products (
  name, 
  description, 
  price_per_kg, 
  category_id,
  validity_days,
  image_url,
  product_kind,
  is_active
) 
SELECT 
  'Peito de Frango',
  'Peito de frango desossado, ideal para grelhados e receitas fitness.',
  24.90,
  (SELECT id FROM categories WHERE name = 'Cortes' LIMIT 1),
  3,
  '/products/peito-frango.png',
  'regular',
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Peito de Frango');

INSERT INTO products (
  name, 
  description, 
  price_per_kg, 
  category_id,
  validity_days,
  image_url,
  product_kind,
  is_active
) 
SELECT 
  'Coxa e Sobrecoxa',
  'Coxa e sobrecoxa juntas, perfeitas para churrasco e assados.',
  19.90,
  (SELECT id FROM categories WHERE name = 'Cortes' LIMIT 1),
  3,
  '/products/coxa-sobrecoxa.png',
  'regular',
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Coxa e Sobrecoxa');

INSERT INTO products (
  name, 
  description, 
  price_per_kg, 
  category_id,
  validity_days,
  image_url,
  product_kind,
  is_active
) 
SELECT 
  'Asa de Frango',
  'Asas de frango frescas, ótimas para fritar ou assar.',
  17.90,
  (SELECT id FROM categories WHERE name = 'Cortes' LIMIT 1),
  3,
  '/products/asa-frango.png',
  'regular',
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Asa de Frango');

INSERT INTO products (
  name, 
  description, 
  price_per_kg, 
  category_id,
  validity_days,
  image_url,
  product_kind,
  is_active
) 
SELECT 
  'Miúdos de Frango',
  'Fígado, coração e moela frescos.',
  14.90,
  (SELECT id FROM categories WHERE name = 'Miúdos' LIMIT 1),
  2,
  '/products/miudo-frango.png',
  'regular',
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Miúdos de Frango');

-- ============================================================
-- 3. SEED DE KITS
-- ============================================================

-- Atualizar imagens de kits existentes
UPDATE kits SET 
  image_url = '/kits/kit-churrasco.png',
  updated_at = now()
WHERE slug = 'kit-churrasco';

UPDATE kits SET 
  image_url = '/kits/kit-familia.png',
  updated_at = now()
WHERE slug = 'kit-familia';

UPDATE kits SET 
  image_url = '/kits/kit-economico.png',
  updated_at = now()
WHERE slug = 'kit-economico';

-- Inserir kits se não existirem
INSERT INTO kits (name, slug, description, price, original_price, image_url, contents, is_active, is_featured)
SELECT 
  'Kit Churrasco',
  'kit-churrasco',
  'Kit completo para o churrasco perfeito',
  89.90,
  109.90,
  '/kits/kit-churrasco.png',
  '1kg Coxa e Sobrecoxa, 1kg Asa, 500g Coração',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM kits WHERE slug = 'kit-churrasco');

INSERT INTO kits (name, slug, description, price, original_price, image_url, contents, is_active, is_featured)
SELECT 
  'Kit Família',
  'kit-familia',
  'Kit ideal para alimentar toda a família',
  69.90,
  89.90,
  '/kits/kit-familia.png',
  '1 Frango Inteiro, 1kg Peito, 500g Miúdos',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM kits WHERE slug = 'kit-familia');

INSERT INTO kits (name, slug, description, price, original_price, image_url, contents, is_active, is_featured)
SELECT 
  'Kit Econômico',
  'kit-economico',
  'Economia para o dia a dia',
  49.90,
  64.90,
  '/kits/kit-economico.png',
  '1 Frango Inteiro, 500g Coxa e Sobrecoxa',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM kits WHERE slug = 'kit-economico');

-- ============================================================
-- 4. VERIFICAÇÃO
-- ============================================================
SELECT 'Produtos inseridos:' as info, COUNT(*) as total FROM products
UNION ALL
SELECT 'Kits inseridos:', COUNT(*) FROM kits
UNION ALL
SELECT 'Categorias inseridas:', COUNT(*) FROM categories;
