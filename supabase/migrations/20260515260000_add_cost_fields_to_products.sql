-- ============================================================
-- ADD COST FIELDS TO PRODUCTS
-- Adicionar campos para cálculo de preço ideal do frango
-- ============================================================

-- Adicionar campos para cálculo de preço ideal
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_per_kg NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS weight_in_kg NUMERIC(10, 2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_chicken_product BOOLEAN DEFAULT false;

-- Criar índice para produtos de frango
CREATE INDEX IF NOT EXISTS idx_products_is_chicken ON public.products(is_chicken_product);

-- Atualizar produtos existentes que são frango
UPDATE public.products 
SET is_chicken_product = true 
WHERE LOWER(name) LIKE '%frango%';

-- Política para service role
DROP POLICY IF EXISTS "products_service_role" ON public.products;
CREATE POLICY "products_service_role" ON public.products 
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
