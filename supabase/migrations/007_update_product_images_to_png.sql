-- ============================================================
-- Atualizar imagens de produtos para PNG (fundo transparente)
-- Execute no Supabase SQL Editor
-- ============================================================

-- Atualizar frango-inteiro
UPDATE public.products 
SET image_url = '/products/frango-inteiro.png', updated_at = now()
WHERE slug = 'frango-inteiro';

-- Atualizar coxa-sobrecoxa
UPDATE public.products 
SET image_url = '/products/coxa-sobrecoxa.png', updated_at = now()
WHERE slug = 'coxa-e-sobrecoxa';

-- Atualizar asa-frango
UPDATE public.products 
SET image_url = '/products/asa-frango.png', updated_at = now()
WHERE slug = 'asa-de-frango';

-- Atualizar miudo-frango
UPDATE public.products 
SET image_url = '/products/miudo-frango.png', updated_at = now()
WHERE slug = 'miudo-de-frango';

-- Atualizar peito-frango
UPDATE public.products 
SET image_url = '/products/peito-frango.png', updated_at = now()
WHERE slug = 'peito-de-frango';

-- Verificar resultado
SELECT name, slug, image_url FROM public.products;
