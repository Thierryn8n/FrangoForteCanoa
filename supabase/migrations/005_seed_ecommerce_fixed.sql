-- ============================================================
-- SEED: Products and Kits - CORRIGIDO PARA ESTRUTURA E-COMMERCE
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
-- 2. SEED DE PRODUTOS (estrutura E-commerce)
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

-- Inserir produtos se não existirem (estrutura E-commerce: price, slug, stock_quantity)
INSERT INTO products (
  name, 
  slug,
  description, 
  short_description,
  price, 
  original_price,
  unit,
  image_url,
  category_id,
  is_active,
  is_featured,
  stock_quantity
) 
SELECT 
  'Frango Inteiro',
  'frango-inteiro',
  'Frango inteiro fresco, abatido na hora. Perfeito para assar ou cozinhar.',
  'Frango fresco inteiro',
  29.90,
  34.90,
  'kg',
  '/products/frango-inteiro.png',
  (SELECT id FROM categories WHERE slug = 'frango-inteiro' LIMIT 1),
  true,
  true,
  100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'frango-inteiro');

INSERT INTO products (
  name, 
  slug,
  description, 
  short_description,
  price, 
  original_price,
  unit,
  image_url,
  category_id,
  is_active,
  is_featured,
  stock_quantity
) 
SELECT 
  'Peito de Frango',
  'peito-de-frango',
  'Peito de frango desossado, ideal para grelhados e receitas fitness.',
  'Peito desossado premium',
  24.90,
  29.90,
  'kg',
  '/products/peito-frango.png',
  (SELECT id FROM categories WHERE slug = 'cortes' LIMIT 1),
  true,
  true,
  100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'peito-de-frango');

INSERT INTO products (
  name, 
  slug,
  description, 
  short_description,
  price, 
  original_price,
  unit,
  image_url,
  category_id,
  is_active,
  is_featured,
  stock_quantity
) 
SELECT 
  'Coxa e Sobrecoxa',
  'coxa-e-sobrecoxa',
  'Coxa e sobrecoxa juntas, perfeitas para churrasco e assados.',
  'Corte suculento',
  19.90,
  24.90,
  'kg',
  '/products/coxa-sobrecoxa.png',
  (SELECT id FROM categories WHERE slug = 'cortes' LIMIT 1),
  true,
  true,
  100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'coxa-e-sobrecoxa');

INSERT INTO products (
  name, 
  slug,
  description, 
  short_description,
  price, 
  original_price,
  unit,
  image_url,
  category_id,
  is_active,
  is_featured,
  stock_quantity
) 
SELECT 
  'Asa de Frango',
  'asa-de-frango',
  'Asas de frango frescas, ótimas para fritar ou assar.',
  'Crocante e saborosa',
  17.90,
  22.90,
  'kg',
  '/products/asa-frango.png',
  (SELECT id FROM categories WHERE slug = 'cortes' LIMIT 1),
  true,
  true,
  100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'asa-de-frango');

INSERT INTO products (
  name, 
  slug,
  description, 
  short_description,
  price, 
  original_price,
  unit,
  image_url,
  category_id,
  is_active,
  is_featured,
  stock_quantity
) 
SELECT 
  'Miúdos de Frango',
  'miudos',
  'Fígado, coração e moela frescos.',
  'Miúdos selecionados',
  14.90,
  18.90,
  'kg',
  '/products/miudo-frango.png',
  (SELECT id FROM categories WHERE slug = 'miudos' LIMIT 1),
  true,
  true,
  100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'miudos');

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
SELECT 'Categorias inseridas:' as info, COUNT(*) as total FROM categories
UNION ALL
SELECT 'Produtos inseridos:', COUNT(*) FROM products
UNION ALL
SELECT 'Kits inseridos:', COUNT(*) FROM kits;
