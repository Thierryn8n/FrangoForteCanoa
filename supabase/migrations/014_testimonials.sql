-- ============================================================
-- TESTIMONIALS TABLE
-- Tabela de depoimentos de clientes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_avatar TEXT,
  customer_location TEXT,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "testimonials_public_read" ON public.testimonials;
CREATE POLICY "testimonials_public_read" ON public.testimonials 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "testimonials_authenticated_insert" ON public.testimonials;
CREATE POLICY "testimonials_authenticated_insert" ON public.testimonials 
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "testimonials_authenticated_update" ON public.testimonials;
CREATE POLICY "testimonials_authenticated_update" ON public.testimonials 
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "testimonials_authenticated_delete" ON public.testimonials;
CREATE POLICY "testimonials_authenticated_delete" ON public.testimonials 
  FOR DELETE TO authenticated USING (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON public.testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON public.testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON public.testimonials(rating);

-- Seed de depoimentos iniciais
INSERT INTO public.testimonials (customer_name, customer_location, content, rating, is_active, is_featured) VALUES
  ('Maria Silva', 'Canoa Quebrada', 'Frango fresquinho de verdade! Entrega rapida e embalagem impecavel. Super recomendo!', 5, true, true),
  ('Joao Santos', 'Aracati', 'Melhor frango que ja comprei. O peito e enorme e muito saboroso. Ja sou cliente fiel!', 5, true, true),
  ('Ana Oliveira', 'Canoa Quebrada', 'Atendimento excelente, produto de qualidade. Chega sempre no prazo combinado.', 5, true, true),
  ('Carlos Ferreira', 'Fortim', 'Os kits sao otimos! Economia garantida e qualidade superior. Recomendo demais!', 5, true, false),
  ('Patricia Lima', 'Canoa Quebrada', 'Compro toda semana. Frango sempre fresco e preco justo. Melhor da regiao!', 5, true, false)
ON CONFLICT DO NOTHING;
