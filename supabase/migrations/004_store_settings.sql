-- ============================================================
-- STORE SETTINGS TABLE
-- Key-value store for app configuration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Policies - public read, admin write
CREATE POLICY "store_settings_public_read" ON public.store_settings 
  FOR SELECT USING (true);

CREATE POLICY "store_settings_admin_all" ON public.store_settings 
  FOR ALL USING (auth.role() = 'service_role');

-- Index
CREATE INDEX IF NOT EXISTS idx_store_settings_key 
  ON public.store_settings(key);

-- Seed default settings
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name', 'Frango Forte Canoa'),
  ('store_phone', '(88) 99999-9999'),
  ('store_whatsapp', '5588999999999'),
  ('store_email', 'contato@frangofortecanoa.com.br'),
  ('delivery_fee', '5.00'),
  ('min_order_value', '30.00'),
  ('delivery_time', '30-45 min'),
  ('store_address', 'Canoa Quebrada - Aracati'),
  ('store_city', 'Aracati'),
  ('store_state', 'CE'),
  ('opening_hours_weekday', '06h às 18h'),
  ('opening_hours_sunday', '06h às 12h'),
  ('instagram', '@frangofortecanoa'),
  ('facebook', '')
ON CONFLICT (key) DO NOTHING;
