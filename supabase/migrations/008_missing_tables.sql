-- ============================================================
-- TABELAS FALTANTES - Execute no Supabase SQL Editor
-- Voce ja tem: categories, kits, newsletter_subscribers, 
-- order_items, orders, products, testimonials
-- ============================================================

-- CUSTOMERS (perfil de clientes vinculado ao auth.users)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  address TEXT,
  address_number TEXT,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policies para customers
CREATE POLICY "customers_select_own" ON public.customers 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "customers_insert_own" ON public.customers 
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "customers_update_own" ON public.customers 
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================

-- CUSTOMER_ADDRESSES (multiplos enderecos por cliente)
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Casa',
  address TEXT NOT NULL,
  address_number TEXT,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Policies para customer_addresses
CREATE POLICY "addresses_select_own" ON public.customer_addresses 
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "addresses_insert_own" ON public.customer_addresses 
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "addresses_update_own" ON public.customer_addresses 
  FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "addresses_delete_own" ON public.customer_addresses 
  FOR DELETE USING (auth.uid() = customer_id);

-- ============================================================

-- CUSTOMER_FAVORITES (produtos e kits favoritos)
CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  kit_id UUID REFERENCES public.kits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT favorites_has_item CHECK (product_id IS NOT NULL OR kit_id IS NOT NULL),
  UNIQUE(customer_id, product_id),
  UNIQUE(customer_id, kit_id)
);

ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- Policies para customer_favorites
CREATE POLICY "favorites_select_own" ON public.customer_favorites 
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "favorites_insert_own" ON public.customer_favorites 
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "favorites_delete_own" ON public.customer_favorites 
  FOR DELETE USING (auth.uid() = customer_id);

-- ============================================================

-- STORE_SETTINGS (configuracoes da loja)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Policies para store_settings (leitura publica)
CREATE POLICY "settings_public_read" ON public.store_settings 
  FOR SELECT USING (true);

-- Seed de configuracoes iniciais
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name', 'Frango Forte'),
  ('store_phone', '(11) 99999-9999'),
  ('store_whatsapp', '5511999999999'),
  ('store_email', 'contato@frangoforte.com.br'),
  ('delivery_fee', '5.00'),
  ('min_order_value', '30.00'),
  ('delivery_time', '30-45 min'),
  ('store_address', 'Rua das Aves, 123 - Centro'),
  ('store_city', 'Sao Paulo'),
  ('store_state', 'SP')
ON CONFLICT (key) DO NOTHING;

-- ============================================================

-- TRIGGER para criar perfil automaticamente quando usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.customers (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VERIFICACAO FINAL
-- ============================================================

-- Listar todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
