-- ============================================================
-- CATEGORIES TABLE
-- Tabela de categorias de produtos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_authenticated_insert" ON public.categories;
CREATE POLICY "categories_authenticated_insert" ON public.categories 
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "categories_authenticated_update" ON public.categories;
CREATE POLICY "categories_authenticated_update" ON public.categories 
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "categories_authenticated_delete" ON public.categories;
CREATE POLICY "categories_authenticated_delete" ON public.categories 
  FOR DELETE TO authenticated USING (true);

-- Indice para busca
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- Seed de categorias iniciais
INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Frango Inteiro', 'frango-inteiro', 'Frangos inteiros frescos e selecionados', 1),
  ('Cortes', 'cortes', 'Peitos, coxas, sobrecoxas e mais', 2),
  ('Miudos', 'miudos', 'Figado, coracao e moela', 3),
  ('Ofertas', 'ofertas', 'Kits e promocoes especiais', 4)
ON CONFLICT (slug) DO NOTHING;
