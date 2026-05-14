-- Migration: 20260512080000_simplify_order_status.sql
-- Simplificar status dos pedidos para apenas 5 essenciais

-- Atualizar todos os pedidos com status antigos para os novos status simplificados
UPDATE orders SET status = 'confirmed' WHERE status IN ('pending', 'printing', 'printed');
UPDATE orders SET status = 'preparing' WHERE status IN ('ready');
UPDATE orders SET status = 'left_for_delivery' WHERE status IN ('delivering');

-- Remover constraint CHECK antigo se existir
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Adicionar novo constraint CHECK com status essenciais + printing temporario
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('confirmed', 'printing', 'preparing', 'left_for_delivery', 'delivered', 'cancelled'));

-- Opcional: Limpar colunas não utilizadas (se quiser)
-- ALTER TABLE orders DROP COLUMN IF EXISTS printed_at;
-- ALTER TABLE orders DROP COLUMN IF EXISTS started_preparation_at;
-- ALTER TABLE orders DROP COLUMN IF EXISTS delivery_partner;
-- ALTER TABLE orders DROP COLUMN IF EXISTS estimated_delivery_minutes;
