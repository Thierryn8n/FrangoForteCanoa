-- ============================================================
-- Migration 015: RLS + Realtime para print_jobs e tabelas PDV
-- ============================================================

-- Habilitar Realtime na tabela print_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE print_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE ecommerce_orders;

-- ============================================================
-- RLS: print_jobs
-- ============================================================
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir jobs
CREATE POLICY "authenticated can insert print_jobs"
  ON print_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Qualquer usuário autenticado pode ler jobs
CREATE POLICY "authenticated can read print_jobs"
  ON print_jobs FOR SELECT
  TO authenticated
  USING (true);

-- Qualquer usuário autenticado pode atualizar status
CREATE POLICY "authenticated can update print_jobs"
  ON print_jobs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role tem acesso total
CREATE POLICY "service role full access print_jobs"
  ON print_jobs FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- RLS: products
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Leitura pública de produtos ativos
CREATE POLICY "public can read active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Apenas autenticados gerenciam produtos
CREATE POLICY "authenticated can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role full access products"
  ON products FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- RLS: product_images
-- ============================================================
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read active product_images"
  ON product_images FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "authenticated can manage product_images"
  ON product_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role full access product_images"
  ON product_images FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- RLS: categories
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "authenticated can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS: orders (PDV)
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role full access orders"
  ON orders FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- RLS: order_items
-- ============================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can manage order_items"
  ON order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role full access order_items"
  ON order_items FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- RLS: ecommerce_orders
-- ============================================================
ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;

-- Clientes veem apenas seus próprios pedidos
CREATE POLICY "customers can view own ecommerce_orders"
  ON ecommerce_orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "customers can insert ecommerce_orders"
  ON ecommerce_orders FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "service role full access ecommerce_orders"
  ON ecommerce_orders FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- RLS: ecommerce_order_items
-- ============================================================
ALTER TABLE ecommerce_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access ecommerce_order_items"
  ON ecommerce_order_items FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "authenticated can read own ecommerce_order_items"
  ON ecommerce_order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM ecommerce_orders WHERE customer_id = auth.uid()
    )
  );

-- ============================================================
-- RLS: store_settings
-- ============================================================
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read store_settings"
  ON store_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "authenticated can update store_settings"
  ON store_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role full access store_settings"
  ON store_settings FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- RLS: delivery_areas
-- ============================================================
ALTER TABLE delivery_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read delivery_areas"
  ON delivery_areas FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "authenticated can manage delivery_areas"
  ON delivery_areas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS: coupons
-- ============================================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "authenticated can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role full access coupons"
  ON coupons FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- Trigger: sync product.cover_image_url quando is_primary muda
-- ============================================================
CREATE OR REPLACE FUNCTION sync_product_cover_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE products
    SET cover_image_url = NEW.image_url,
        image_url = NEW.image_url,
        updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_product_cover ON product_images;
CREATE TRIGGER trigger_sync_product_cover
  AFTER INSERT OR UPDATE OF is_primary ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_cover_image();

-- ============================================================
-- Trigger: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ecommerce_orders_updated_at
  BEFORE UPDATE ON ecommerce_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed: Inserir configurações padrão se não existir
-- ============================================================
INSERT INTO store_settings (
  store_name,
  payment_settings,
  shipping_settings,
  general_settings
)
SELECT
  'Minha Loja',
  '{"gateway": "manual", "pix_enabled": true, "card_enabled": true, "transaction_fee_percent": 0}'::jsonb,
  '{"default_deadline_days": 3, "default_price": 10.00, "free_shipping_min_total": 150.00, "express_shipping_enabled": false}'::jsonb,
  '{"currency": "BRL", "language": "pt-BR", "timezone": "America/Fortaleza"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM store_settings LIMIT 1);
