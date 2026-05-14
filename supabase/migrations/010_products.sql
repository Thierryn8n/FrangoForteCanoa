-- ============================================================
-- PRODUCTS TABLE
-- Tabela de produtos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10, 2),
  unit TEXT DEFAULT 'kg',
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  stock_quantity INTEGER NOT NULL DEFAULT 100,
  min_order_quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_authenticated_insert" ON public.products;
CREATE POLICY "products_authenticated_insert" ON public.products 
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "products_authenticated_update" ON public.products;
CREATE POLICY "products_authenticated_update" ON public.products 
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "products_authenticated_delete" ON public.products;
CREATE POLICY "products_authenticated_delete" ON public.products 
  FOR DELETE TO authenticated USING (true);

-- Indices para busca e performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

-- Seed de produtos iniciais
INSERT INTO public.products (name, slug, description, short_description, price, original_price, unit, image_url, is_active, is_featured, stock_quantity) VALUES
  ('Frango Inteiro', 'frango-inteiro', 'Frango inteiro fresco, ideal para assados e churrascos. Peso medio de 2kg.', 'Frango inteiro fresco ~2kg', 24.90, 29.90, 'kg', '/products/frango-inteiro.png', true, true, 100),
  ('Peito de Frango', 'peito-frango', 'Peito de frango sem osso e sem pele. Corte nobre, ideal para grelhados.', 'Peito sem osso ~1kg', 18.90, NULL, 'kg', '/products/peito-frango.png', true, true, 100),
  ('Coxa e Sobrecoxa', 'coxa-sobrecoxa', 'Coxa e sobrecoxa juntas, com osso. Perfeitas para assados.', 'Coxa com sobrecoxa ~1kg', 14.90, NULL, 'kg', '/products/coxa-sobrecoxa.png', true, true, 100),
  ('Asa de Frango', 'asa-frango', 'Asas de frango frescas, ideais para petiscos e aperitivos.', 'Asas frescas ~500g', 12.90, 15.90, 'kg', '/products/asa-frango.png', true, false, 100),
  ('Miudos de Frango', 'miudos-frango', 'Figado, coracao e moela frescos. Otimos para preparos tradicionais.', 'Miudos variados ~500g', 8.90, NULL, 'kg', '/products/miudo-frango.png', true, false, 100),
  ('File de Peito', 'file-peito', 'File de peito de frango, corte fino ideal para empanados e strogonoff.', 'File fino ~500g', 22.90, NULL, 'kg', '/products/peito-frango.png', true, false, 100),
  ('Coxinha da Asa', 'coxinha-asa', 'Coxinha da asa, parte mais suculenta. Perfeita para fritar.', 'Coxinha da asa ~500g', 16.90, NULL, 'kg', '/products/asa-frango.png', true, false, 100),
  ('Dorso de Frango', 'dorso-frango', 'Dorso de frango para caldos e sopas. Muito saboroso.', 'Dorso ~1kg', 6.90, NULL, 'kg', '/products/frango-inteiro.png', true, false, 100)
ON CONFLICT (slug) DO NOTHING;
