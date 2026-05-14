-- Migration: 20260511160000_fix_order_status_log_trigger.sql
-- Corrigir trigger de log para nao falhar quando auth.uid() nao existe em admins

-- Corrigir a tabela order_status_logs para nao exigir FK em admins
ALTER TABLE order_status_logs 
DROP CONSTRAINT IF EXISTS order_status_logs_changed_by_fkey;

-- Recriar a funcao de log com tratamento de erro
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    BEGIN
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
          WHEN OLD.status = 'pending' AND NEW.status = 'printing' THEN 'Pedido enviado para impressao'
          WHEN OLD.status = 'printing' AND NEW.status = 'printed' THEN 'Pedido impresso com sucesso'
          WHEN OLD.status = 'printed' AND NEW.status = 'preparing' THEN 'Iniciando preparacao do pedido'
          WHEN OLD.status = 'preparing' AND NEW.status = 'ready' THEN 'Pedido pronto para entrega'
          WHEN OLD.status = 'ready' AND NEW.status = 'left_for_delivery' THEN 'Pedido saiu para entrega'
          WHEN OLD.status = 'left_for_delivery' AND NEW.status = 'delivering' THEN 'Pedido em rota de entrega'
          WHEN OLD.status = 'delivering' AND NEW.status = 'delivered' THEN 'Pedido entregue com sucesso'
          ELSE 'Status alterado de ' || COALESCE(OLD.status, 'N/A') || ' para ' || NEW.status
        END
      );
    EXCEPTION WHEN OTHERS THEN
      -- Se a insercao do log falhar, apenas registrar e continuar
      RAISE LOG 'Erro ao registrar log de status (ignorado): %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
