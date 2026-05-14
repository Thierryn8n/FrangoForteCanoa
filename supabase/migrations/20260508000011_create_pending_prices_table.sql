-- ============================================================
-- CREATE PENDING PRICES TABLE
-- Tabela para produtos criados por voz com preço pendente
-- ============================================================

-- Criar tabela de preços pendentes
CREATE TABLE IF NOT EXISTS pending_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  created_by TEXT DEFAULT 'voice_system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'cancelled')),
  notes TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_pending_prices_status ON pending_prices(status);
CREATE INDEX IF NOT EXISTS idx_pending_prices_created_at ON pending_prices(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_prices_product_id ON pending_prices(product_id);

-- Adicionar coluna na tabela products para marcar se tem preço pendente
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_pending_price BOOLEAN DEFAULT FALSE;

-- Criar trigger para atualizar has_pending_price quando houver mudanças em pending_prices
CREATE OR REPLACE FUNCTION update_product_pending_price_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE products 
    SET has_pending_price = EXISTS (
      SELECT 1 FROM pending_prices 
      WHERE product_id = NEW.product_id AND status = 'pending'
    )
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET has_pending_price = EXISTS (
      SELECT 1 FROM pending_prices 
      WHERE product_id = OLD.product_id AND status = 'pending'
    )
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
DROP TRIGGER IF EXISTS trigger_update_pending_price_flag ON pending_prices;
CREATE TRIGGER trigger_update_pending_price_flag
  AFTER INSERT OR UPDATE OR DELETE ON pending_prices
  FOR EACH ROW EXECUTE FUNCTION update_product_pending_price_flag();

-- Habilitar RLS
ALTER TABLE pending_prices ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pending_prices
CREATE POLICY "Allow anonymous read access to pending_prices" ON pending_prices
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access to pending_prices" ON pending_prices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to pending_prices" ON pending_prices
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access to pending_prices" ON pending_prices
  FOR DELETE USING (true);
