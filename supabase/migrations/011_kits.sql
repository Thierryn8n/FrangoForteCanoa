-- ============================================================
-- KITS TABLE
-- Tabela de kits promocionais
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10, 2),
  image_url TEXT,
  contents TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "kits_public_read" ON public.kits;
CREATE POLICY "kits_public_read" ON public.kits 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "kits_authenticated_insert" ON public.kits;
CREATE POLICY "kits_authenticated_insert" ON public.kits 
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kits_authenticated_update" ON public.kits;
CREATE POLICY "kits_authenticated_update" ON public.kits 
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "kits_authenticated_delete" ON public.kits;
CREATE POLICY "kits_authenticated_delete" ON public.kits 
  FOR DELETE TO authenticated USING (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_kits_slug ON public.kits(slug);
CREATE INDEX IF NOT EXISTS idx_kits_is_active ON public.kits(is_active);
CREATE INDEX IF NOT EXISTS idx_kits_is_featured ON public.kits(is_featured);

-- Seed de kits iniciais
INSERT INTO public.kits (name, slug, description, price, original_price, image_url, contents, is_active, is_featured) VALUES
  ('Kit Churrasco', 'kit-churrasco', 'Kit completo para seu churrasco em familia. Inclui coxa, sobrecoxa e asa.', 49.90, 65.00, '/kits/kit-churrasco.png', '1kg Coxa e Sobrecoxa, 500g Asa de Frango, 500g Coracao', true, true),
  ('Kit Familia', 'kit-familia', 'Kit economico para toda a familia. Frango inteiro mais cortes variados.', 79.90, 95.00, '/kits/kit-familia.png', '1 Frango Inteiro (~2kg), 1kg Peito de Frango, 1kg Coxa e Sobrecoxa', true, true),
  ('Kit Economico', 'kit-economico', 'Melhor custo-beneficio. Cortes variados para a semana toda.', 39.90, 50.00, '/kits/kit-economico.png', '500g Peito, 500g Coxa, 500g Miudos', true, true),
  ('Kit Fitness', 'kit-fitness', 'Kit especial para dieta proteica. Somente peito de frango.', 89.90, 110.00, '/kits/kit-familia.png', '3kg Peito de Frango sem osso e sem pele', true, false),
  ('Kit Petisco', 'kit-petisco', 'Ideal para petiscos e aperitivos. Asas e coxinha da asa.', 34.90, 42.00, '/kits/kit-churrasco.png', '1kg Asa de Frango, 500g Coxinha da Asa', true, false)
ON CONFLICT (slug) DO NOTHING;
