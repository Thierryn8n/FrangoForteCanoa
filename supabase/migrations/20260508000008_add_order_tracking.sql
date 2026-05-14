-- ============================================================
-- ORDER TRACKING & ABANDONED CARTS
-- Adicionar campos para rastreamento e carrinhos abandonados
-- ============================================================

-- Adicionar campos de rastreamento à tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_code TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_preparation_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS left_for_delivery_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_partner TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_minutes INTEGER DEFAULT 30;

-- Adicionar novos status para rastreamento detalhado
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check,
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'printing', 'printed', 'preparing', 'ready', 'left_for_delivery', 'delivering', 'delivered', 'cancelled'));

-- Criar tabela de carrinhos abandonados
DROP TABLE IF EXISTS abandoned_carts;
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  customer_id UUID,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  customer_info JSONB,
  abandoned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recovery_email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de logs de status dos pedidos
CREATE TABLE IF NOT EXISTS order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de autenticação Google
CREATE TABLE IF NOT EXISTS google_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session_id ON abandoned_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_abandoned_at ON abandoned_carts(abandoned_at);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON order_status_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_created_at ON order_status_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_google_auth_google_id ON google_auth(google_id);

-- Índices para novos campos de orders
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_printed_at ON orders(printed_at);
CREATE INDEX IF NOT EXISTS idx_orders_started_preparation_at ON orders(started_preparation_at);
CREATE INDEX IF NOT EXISTS idx_orders_left_for_delivery_at ON orders(left_for_delivery_at);

-- Habilitar RLS nas novas tabelas
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_auth ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para abandoned_carts
CREATE POLICY "Users can view their own abandoned carts" ON abandoned_carts
  FOR SELECT USING (customer_id = auth.uid() OR customer_id IS NULL);

CREATE POLICY "Users can insert abandoned carts" ON abandoned_carts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update abandoned carts" ON abandoned_carts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Políticas RLS para order_status_logs
CREATE POLICY "Users can view order status logs" ON order_status_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert order status logs" ON order_status_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS para google_auth
CREATE POLICY "Users can view their own google auth" ON google_auth
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own google auth" ON google_auth
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own google auth" ON google_auth
  FOR UPDATE USING (user_id = auth.uid());

-- Trigger para atualizar timestamps em abandoned_carts
CREATE OR REPLACE FUNCTION update_abandoned_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_abandoned_carts_updated_at();

-- Trigger para atualizar timestamps em google_auth
CREATE OR REPLACE FUNCTION update_google_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_auth_updated_at
  BEFORE UPDATE ON google_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_google_auth_updated_at();

-- Função para registrar mudança de status
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_logs (
      order_id,
      old_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE 
        WHEN OLD.status = 'pending' AND NEW.status = 'printing' THEN 'Pedido enviado para impressão'
        WHEN OLD.status = 'printing' AND NEW.status = 'printed' THEN 'Pedido impresso com sucesso'
        WHEN OLD.status = 'printed' AND NEW.status = 'preparing' THEN 'Iniciando preparação do pedido'
        WHEN OLD.status = 'preparing' AND NEW.status = 'ready' THEN 'Pedido pronto para entrega'
        WHEN OLD.status = 'ready' AND NEW.status = 'left_for_delivery' THEN 'Pedido saiu para entrega'
        WHEN OLD.status = 'left_for_delivery' AND NEW.status = 'delivering' THEN 'Pedido em rota de entrega'
        WHEN OLD.status = 'delivering' AND NEW.status = 'delivered' THEN 'Pedido entregue com sucesso'
        ELSE 'Status alterado de ' || COALESCE(OLD.status, 'N/A') || ' para ' || NEW.status
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para log automático de mudanças de status
DROP TRIGGER IF EXISTS orders_status_log_trigger ON orders;
CREATE TRIGGER orders_status_log_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Comentários
COMMENT ON TABLE abandoned_carts IS 'Carrinhos abandonados para recuperação';
COMMENT ON TABLE order_status_logs IS 'Histórico de mudanças de status dos pedidos';
COMMENT ON TABLE google_auth IS 'Autenticação Google OAuth2';

COMMENT ON COLUMN orders.tracking_code IS 'Código de rastreamento da entrega';
COMMENT ON COLUMN orders.tracking_url IS 'URL de rastreamento';
COMMENT ON COLUMN orders.printed_at IS 'Data/hora da impressão do pedido';
COMMENT ON COLUMN orders.started_preparation_at IS 'Data/hora do início da preparação';
COMMENT ON COLUMN orders.left_for_delivery_at IS 'Data/hora que saiu para entrega';
COMMENT ON COLUMN orders.delivery_partner IS 'Parceiro de entrega';
COMMENT ON COLUMN orders.estimated_delivery_minutes IS 'Tempo estimado de entrega em minutos';
