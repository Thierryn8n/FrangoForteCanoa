-- ============================================================
-- CUSTOMER FAVORITES TABLE
-- Save favorite products and kits
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  kit_id UUID REFERENCES public.kits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure at least one of product_id or kit_id is set
  CONSTRAINT favorites_has_item CHECK (product_id IS NOT NULL OR kit_id IS NOT NULL),
  
  -- Unique constraints to prevent duplicates
  UNIQUE(customer_id, product_id),
  UNIQUE(customer_id, kit_id)
);

-- Enable RLS
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "customer_favorites_select_own" ON public.customer_favorites 
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "customer_favorites_insert_own" ON public.customer_favorites 
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customer_favorites_delete_own" ON public.customer_favorites 
  FOR DELETE USING (auth.uid() = customer_id);

CREATE POLICY "customer_favorites_admin_all" ON public.customer_favorites 
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer_id 
  ON public.customer_favorites(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_favorites_product_id 
  ON public.customer_favorites(product_id);

CREATE INDEX IF NOT EXISTS idx_customer_favorites_kit_id 
  ON public.customer_favorites(kit_id);
