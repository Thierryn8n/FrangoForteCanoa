-- ============================================================
-- ORDER ITEMS TABLE
-- Tabela de itens do pedido
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  kit_id UUID REFERENCES public.kits(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL DEFAULT 'product' CHECK (item_type IN ('product', 'kit')),
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'kg',
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
CREATE POLICY "order_items_select_own" ON public.order_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.customer_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "order_items_insert_public" ON public.order_items;
CREATE POLICY "order_items_insert_public" ON public.order_items 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_update_authenticated" ON public.order_items;
CREATE POLICY "order_items_update_authenticated" ON public.order_items 
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "order_items_delete_authenticated" ON public.order_items;
CREATE POLICY "order_items_delete_authenticated" ON public.order_items 
  FOR DELETE TO authenticated USING (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_kit_id ON public.order_items(kit_id);
