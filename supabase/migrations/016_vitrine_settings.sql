-- Migration: Vitrine Settings
-- Adiciona colunas de vitrine, Instagram, newsletter e footer ao store_settings
-- E garante que a tabela kits existe com todos os campos necessários

-- =========================================================
-- 1. TABELA KITS (garante existência e campos)
-- =========================================================
CREATE TABLE IF NOT EXISTS kits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  contents     TEXT,
  description  TEXT,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  image_url    TEXT,
  is_featured  BOOLEAN NOT NULL DEFAULT false,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kits_updated_at ON kits;
CREATE TRIGGER kits_updated_at
  BEFORE UPDATE ON kits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed de exemplo
INSERT INTO kits (name, contents, price, original_price, is_featured, is_active, sort_order)
VALUES
  ('Kit Família',    '2kg Coxa e Sobrecoxa + 1kg Asa + 1kg Peito',  64.90, 74.90, true, true, 1),
  ('Kit Econômico',  '3kg Coxa e Sobrecoxa + 1kg Asa',              54.90, 64.90, true, true, 2),
  ('Kit Churrasco',  '2kg Asa + 1kg Corinha da Asa + 1kg Peito',    59.90, 64.90, true, true, 3)
ON CONFLICT DO NOTHING;

-- =========================================================
-- 2. STORE_SETTINGS — novas colunas de vitrine
-- =========================================================

-- Subheader (4 diferenciais exibidos na faixa vermelha)
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS subheader_features JSONB NOT NULL DEFAULT '[
    {"icon":"CreditCard","title":"Formas de Pagamento","description":"Cartão, PIX, Dinheiro e Transferência."},
    {"icon":"ShieldCheck","title":"Ambiente Higienizado","description":"Seguimos todas as normas de higiene e segurança."},
    {"icon":"Package","title":"Embalagem Segura","description":"Embalagens resistentes que garantem qualidade."},
    {"icon":"Headphones","title":"Atendimento Humanizado","description":"Estamos sempre prontos para te atender!"}
  ]'::JSONB;

-- Instagram
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT DEFAULT '@frangofortecanoa';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://instagram.com/frangofortecanoa';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS instagram_photos JSONB NOT NULL DEFAULT '[]'::JSONB;
  -- Array de objetos: [{url: string, alt?: string}]

-- Newsletter
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS newsletter_title TEXT DEFAULT 'RECEBA NOSSAS OFERTAS';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS newsletter_description TEXT DEFAULT 'Cadastre-se e receba ofertas exclusivas no seu e-mail!';

-- Footer
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS footer_about TEXT DEFAULT 'Frango abatido na hora com qualidade, segurança e o melhor sabor para você e sua família.';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS footer_whatsapp TEXT DEFAULT '5588996125274';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS footer_email TEXT DEFAULT 'contato@frangofortecanoa.com.br';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS footer_address TEXT DEFAULT 'Canoa Quebrada - Aracati/CE';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS footer_hours TEXT DEFAULT 'Seg a Sáb: 06h às 18h | Dom: 06h às 12h';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS footer_facebook_url TEXT DEFAULT '';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS footer_copyright TEXT DEFAULT '2024 Frango Forte Canoa. Todos os direitos reservados.';

-- =========================================================
-- 3. NEWSLETTER SUBSCRIBERS
-- =========================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 4. RLS
-- =========================================================
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kits_select_all" ON kits;
CREATE POLICY "kits_select_all" ON kits FOR SELECT USING (true);
DROP POLICY IF EXISTS "kits_all_service" ON kits;
CREATE POLICY "kits_all_service" ON kits FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "newsletter_insert_all" ON newsletter_subscribers;
CREATE POLICY "newsletter_insert_all" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "newsletter_select_service" ON newsletter_subscribers;
CREATE POLICY "newsletter_select_service" ON newsletter_subscribers FOR SELECT USING (auth.role() = 'service_role');
