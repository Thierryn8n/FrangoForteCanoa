-- Migration: Vitrine Settings - CORRIGIDO
-- Adiciona colunas de vitrine, Instagram, newsletter e footer ao store_settings
-- E garante que a tabela kits existe com todos os campos necessários

-- =========================================================
-- 1. TABELA KITS - Adicionar colunas que podem faltar
-- =========================================================

-- Adicionar colunas que podem não existir na tabela kits criada pelo 011_kits.sql
ALTER TABLE IF EXISTS kits 
  ADD COLUMN IF NOT EXISTS contents TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Trigger updated_at (só cria se a tabela existir)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kits') THEN
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $inner$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $inner$;

    DROP TRIGGER IF EXISTS kits_updated_at ON kits;
    CREATE TRIGGER kits_updated_at
      BEFORE UPDATE ON kits
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $outer$;

-- Seed de exemplo (só insere se as colunas existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'kits' AND column_name = 'sort_order') THEN
    INSERT INTO kits (name, slug, contents, price, original_price, is_featured, is_active, sort_order)
    VALUES
      ('Kit Família',    'kit-familia-vitrine',    '2kg Coxa e Sobrecoxa + 1kg Asa + 1kg Peito',  64.90, 74.90, true, true, 1),
      ('Kit Econômico',  'kit-economico-vitrine',  '3kg Coxa e Sobrecoxa + 1kg Asa',              54.90, 64.90, true, true, 2),
      ('Kit Churrasco',  'kit-churrasco-vitrine',  '2kg Asa + 1kg Corinha da Asa + 1kg Peito',    59.90, 64.90, true, true, 3)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- =========================================================
-- 2. STORE_SETTINGS — novas colunas de vitrine
-- =========================================================

-- Subheader (4 diferenciais exibidos na faixa vermelha)
ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS subheader_features JSONB NOT NULL DEFAULT '[
    {"icon":"CreditCard","title":"Formas de Pagamento","description":"Cartão, PIX, Dinheiro e Transferência."},
    {"icon":"ShieldCheck","title":"Ambiente Higienizado","description":"Seguimos todas as normas de higiene e segurança."},
    {"icon":"Package","title":"Embalagem Segura","description":"Embalagens resistentes que garantem qualidade."},
    {"icon":"Headphones","title":"Atendimento Humanizado","description":"Estamos sempre prontos para te atender!"}
  ]'::JSONB;

-- Instagram
ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT DEFAULT '@frangofortecanoa';

ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://instagram.com/frangofortecanoa';

ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS instagram_photos JSONB NOT NULL DEFAULT '[]'::JSONB;

-- Newsletter
ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS newsletter_title TEXT DEFAULT 'RECEBA NOSSAS OFERTAS';

ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS newsletter_description TEXT DEFAULT 'Cadastre-se e receba ofertas exclusivas no seu e-mail!';

-- Footer
ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS footer_about TEXT DEFAULT 'Frango abatido na hora com qualidade, segurança e o melhor sabor para você e sua família.';

ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS footer_whatsapp TEXT DEFAULT '5588996125274';

ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS footer_email TEXT DEFAULT 'contato@frangofortecanoa.com.br';

ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS footer_address TEXT DEFAULT 'Canoa Quebrada - Aracati/CE';

ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS footer_hours TEXT DEFAULT 'Seg a Sáb: 06h às 18h | Dom: 06h às 12h';

ALTER TABLE IF EXISTS store_settings
  ADD COLUMN IF NOT EXISTS footer_facebook_url TEXT DEFAULT '';

ALTER TABLE IF EXISTS store_settings
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
DO $$
BEGIN
  -- Kits RLS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kits') THEN
    ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "kits_select_all" ON kits;
    CREATE POLICY "kits_select_all" ON kits FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "kits_all_service" ON kits;
    CREATE POLICY "kits_all_service" ON kits FOR ALL USING (auth.role() = 'service_role');
  END IF;

  -- Newsletter RLS
  ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "newsletter_insert_all" ON newsletter_subscribers;
  CREATE POLICY "newsletter_insert_all" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
  
  DROP POLICY IF EXISTS "newsletter_select_service" ON newsletter_subscribers;
  CREATE POLICY "newsletter_select_service" ON newsletter_subscribers FOR SELECT USING (auth.role() = 'service_role');
END $$;
