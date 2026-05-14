-- ============================================================
-- ALTER ORDERS TABLE - Adiciona campos necessários para o Admin
-- ============================================================

-- Adicionar campos de delivery e email que o painel admin espera
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_neighborhood VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0;

-- Alterar o CHECK constraint do status para incluir os valores do admin
-- Primeiro remover o constraint antigo
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Adicionar novo constraint com todos os status necessários
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'));

-- Atualizar registros existentes para usar 'delivered' em vez de 'completed'
UPDATE orders SET status = 'delivered' WHERE status = 'completed';

-- Verificar estrutura atual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
