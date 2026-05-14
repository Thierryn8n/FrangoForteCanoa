-- Migration: 20260511130000_fix_print_jobs_trigger.sql
-- Corrigir trigger para criar print job tambem no INSERT (pedido ja vem com status 'printing')

-- Remover trigger antiga (AFTER UPDATE apenas)
DROP TRIGGER IF EXISTS orders_auto_print_job ON orders;

-- Criar nova funcao que trata INSERT e UPDATE
CREATE OR REPLACE FUNCTION auto_create_print_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status for 'printing' e ainda nao existir job
  IF NEW.status = 'printing' THEN
    IF NOT EXISTS (
      SELECT 1 FROM print_jobs 
      WHERE order_id = NEW.id 
      AND status NOT IN ('done', 'error')
      LIMIT 1
    ) THEN
      INSERT INTO print_jobs (
        order_id,
        text_content,
        printer_name,
        agent_id,
        status
      ) VALUES (
        NEW.id,
        format_order_print_text(NEW.id),
        NULL,
        'PRINT-AGENT-01',
        'queued'
      );
      
      RAISE LOG 'Print job criado automaticamente para o pedido %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para INSERT (pedido PDV ja vem com status 'printing')
DROP TRIGGER IF EXISTS orders_auto_print_job_insert ON orders;
CREATE TRIGGER orders_auto_print_job_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_print_job();

-- Trigger para UPDATE (status muda para 'printing')
DROP TRIGGER IF EXISTS orders_auto_print_job_update ON orders;
CREATE TRIGGER orders_auto_print_job_update
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_print_job();
