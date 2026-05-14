-- ============================================================
-- CUSTOMER ADDRESSES TABLE
-- Multiple delivery addresses per customer
-- ============================================================

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

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "customer_addresses_select_own" ON public.customer_addresses 
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_insert_own" ON public.customer_addresses 
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_update_own" ON public.customer_addresses 
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_delete_own" ON public.customer_addresses 
  FOR DELETE USING (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_admin_all" ON public.customer_addresses 
  FOR ALL USING (auth.role() = 'service_role');

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id 
  ON public.customer_addresses(customer_id);
