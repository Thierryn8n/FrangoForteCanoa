-- Criar tabela para jobs de impressão do print-agent
CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL DEFAULT 'PRINT-AGENT-01',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'error')),
  text_content TEXT NOT NULL,
  printer_name TEXT,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  printed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_print_jobs_agent_id ON print_jobs(agent_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_order_id ON print_jobs(order_id);

-- Habilitar RLS
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Qualquer um pode inserir jobs de impressão (para o sistema web)
DROP POLICY IF EXISTS "Anyone can insert print jobs" ON print_jobs;
CREATE POLICY "Anyone can insert print jobs" ON print_jobs
  FOR INSERT WITH CHECK (true);

-- Qualquer um pode ver jobs de impressão (para o sistema web)
DROP POLICY IF EXISTS "Anyone can view print jobs" ON print_jobs;
CREATE POLICY "Anyone can view print jobs" ON print_jobs
  FOR SELECT USING (true);

-- Qualquer um pode atualizar jobs de impressão (para o print-agent)
DROP POLICY IF EXISTS "Anyone can update print jobs" ON print_jobs;
CREATE POLICY "Anyone can update print jobs" ON print_jobs
  FOR UPDATE USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_print_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER print_jobs_updated_at
  BEFORE UPDATE ON print_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_print_jobs_updated_at();

-- Função para criar job de impressão para um pedido
CREATE OR REPLACE FUNCTION create_print_job(
  p_order_id UUID,
  p_text_content TEXT,
  p_printer_name TEXT DEFAULT NULL,
  p_agent_id TEXT DEFAULT 'PRINT-AGENT-01'
)
RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  INSERT INTO print_jobs (
    order_id,
    text_content,
    printer_name,
    agent_id,
    status
  ) VALUES (
    p_order_id,
    p_text_content,
    p_printer_name,
    p_agent_id,
    'queued'
  ) RETURNING id INTO job_id;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para formatar texto de impressão do pedido
CREATE OR REPLACE FUNCTION format_order_print_text(p_order_id UUID)
RETURNS TEXT AS $$
DECLARE
  order_record RECORD;
  item_record RECORD;
  text_lines TEXT[] := ARRAY[]::TEXT[];
  subtotal DECIMAL := 0;
BEGIN
  -- Buscar dados do pedido
  SELECT * INTO order_record 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN 'ERRO: Pedido não encontrado';
  END IF;
  
  -- Cabeçalho
  text_lines := array_append(text_lines, 'FRANGO FORTE PDV');
  text_lines := array_append(text_lines, 'COMPROVANTE DE PEDIDO');
  text_lines := array_append(text_lines, '----------------------------------------');
  text_lines := array_append(text_lines, 'Pedido: #' || LEFT(order_record.id::TEXT, 8));
  text_lines := array_append(text_lines, 'Data: ' || TO_CHAR(order_record.created_at, 'DD/MM/YYYY HH24:MI'));
  text_lines := array_append(text_lines, 'Canal: ONLINE');
  text_lines := array_append(text_lines, '');
  
  -- Dados do cliente
  text_lines := array_append(text_lines, 'CLIENTE');
  text_lines := array_append(text_lines, 'Nome: ' || COALESCE(order_record.customer_name, 'N/A'));
  IF order_record.customer_phone IS NOT NULL THEN
    text_lines := array_append(text_lines, 'Telefone: ' || order_record.customer_phone);
  END IF;
  IF order_record.delivery_address IS NOT NULL THEN
    text_lines := array_append(text_lines, 'Endereco: ' || order_record.delivery_address);
  END IF;
  text_lines := array_append(text_lines, '');
  
  -- Itens do pedido
  text_lines := array_append(text_lines, 'ITENS');
  
  FOR item_record IN 
    SELECT oi.*, p.name as product_name
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = p_order_id
    ORDER BY oi.created_at
  LOOP
    DECLARE
      item_total DECIMAL := item_record.quantity * item_record.product_price;
    BEGIN
      text_lines := array_append(text_lines, 
        COALESCE(item_record.product_name, item_record.product_name) || 
        ' - ' || item_record.quantity || ' x R$ ' || 
        TO_CHAR(item_record.product_price, 'FM999999990.00') || 
        ' = R$ ' || TO_CHAR(item_total, 'FM999999990.00')
      );
      subtotal := subtotal + item_total;
    END;
  END LOOP;
  
  text_lines := array_append(text_lines, '----------------------------------------');
  text_lines := array_append(text_lines, 'Subtotal: R$ ' || TO_CHAR(subtotal, 'FM999999990.00'));
  text_lines := array_append(text_lines, 'Taxa Entrega: R$ ' || TO_CHAR(order_record.delivery_fee, 'FM999999990.00'));
  text_lines := array_append(text_lines, 'TOTAL: R$ ' || TO_CHAR(order_record.total, 'FM999999990.00'));
  text_lines := array_append(text_lines, '');
  
  -- Pagamento
  text_lines := array_append(text_lines, 'PAGAMENTO');
  text_lines := array_append(text_lines, 'Forma: ' || 
    CASE order_record.payment_method
      WHEN 'pix' THEN 'PIX'
      WHEN 'credit_card' THEN 'Cartão Crédito'
      WHEN 'debit_card' THEN 'Cartão Débito'
      WHEN 'cash' THEN 'Dinheiro'
      WHEN 'money' THEN 'Dinheiro'
      WHEN 'credit' THEN 'Crédito'
      WHEN 'debit' THEN 'Débito'
      WHEN 'transfer' THEN 'Transferência'
      ELSE order_record.payment_method
    END
  );
  text_lines := array_append(text_lines, 'Status: ' || 
    CASE order_record.payment_status
      WHEN 'paid' THEN 'PAGO'
      WHEN 'pending' THEN 'PENDENTE'
      WHEN 'failed' THEN 'FALHOU'
      WHEN 'refunded' THEN 'REEMBOLSADO'
      ELSE order_record.payment_status
    END
  );
  
  IF order_record.notes IS NOT NULL AND order_record.notes != '' THEN
    text_lines := array_append(text_lines, '');
    text_lines := array_append(text_lines, 'Observacao: ' || order_record.notes);
  END IF;
  
  text_lines := array_append(text_lines, '----------------------------------------');
  text_lines := array_append(text_lines, 'Documento nao fiscal');
  text_lines := array_append(text_lines, 'Obrigado pela preferencia!');
  text_lines := array_append(text_lines, '');
  
  RETURN array_to_string(text_lines, E'\n');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar job de impressão automaticamente quando pedido muda para 'printing'
CREATE OR REPLACE FUNCTION auto_create_print_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas se o status mudar para 'printing' e ainda não existir job
  IF NEW.status = 'printing' AND OLD.status != 'printing' THEN
    -- Verificar se já existe job de impressão para este pedido
    IF NOT EXISTS (
      SELECT 1 FROM print_jobs 
      WHERE order_id = NEW.id 
      AND status NOT IN ('done', 'error')
      LIMIT 1
    ) THEN
      -- Criar job de impressão
      PERFORM create_print_job(
        NEW.id,
        format_order_print_text(NEW.id),
        NULL, -- printer_name (usará padrão do agent)
        'PRINT-AGENT-01'
      );
      
      -- Log para debug
      RAISE LOG 'Print job criado automaticamente para o pedido %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar job de impressão automaticamente
DROP TRIGGER IF EXISTS orders_auto_print_job ON orders;
CREATE TRIGGER orders_auto_print_job
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_print_job();

-- Comentários para documentação
COMMENT ON TABLE print_jobs IS 'Tabela para gerenciar jobs de impressão do print-agent';
COMMENT ON COLUMN print_jobs.order_id IS 'ID do pedido relacionado';
COMMENT ON COLUMN print_jobs.agent_id IS 'ID do agente de impressão';
COMMENT ON COLUMN print_jobs.status IS 'Status do job: queued, processing, done, error';
COMMENT ON COLUMN print_jobs.text_content IS 'Conteúdo de texto para impressão';
COMMENT ON COLUMN print_jobs.printer_name IS 'Nome da impressora utilizada';
COMMENT ON COLUMN print_jobs.retry_count IS 'Número de tentativas de impressão';
COMMENT ON COLUMN print_jobs.error_message IS 'Mensagem de erro em caso de falha';

COMMENT ON FUNCTION create_print_job IS 'Cria um novo job de impressão';
COMMENT ON FUNCTION format_order_print_text IS 'Formata o texto de impressão para um pedido';
COMMENT ON FUNCTION auto_create_print_job IS 'Trigger para criar job automaticamente quando pedido muda para printing';
