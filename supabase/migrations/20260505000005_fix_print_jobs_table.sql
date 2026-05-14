-- Corrigir tabela print_jobs se já existir com estrutura diferente
DO $$
BEGIN
    -- Se a tabela print_jobs já existe, verificar se tem a coluna agent_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'print_jobs' 
        AND column_name = 'agent_id'
    ) THEN
        -- Tabela já existe com a estrutura correta
        RAISE LOG 'Tabela print_jobs já existe com coluna agent_id';
    ELSE
        -- Tabela existe mas sem a coluna agent_id, adicionar a coluna
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'print_jobs'
        ) THEN
            ALTER TABLE print_jobs 
            ADD COLUMN IF NOT EXISTS agent_id TEXT NOT NULL DEFAULT 'PRINT-AGENT-01';
            
            -- Adicionar comentário na coluna
            COMMENT ON COLUMN print_jobs.agent_id IS 'ID do agente de impressão';
            
            RAISE LOG 'Coluna agent_id adicionada à tabela print_jobs existente';
        END IF;
    END IF;
END $$;

-- Garantir que todos os índices existam
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_print_jobs_agent_id ON print_jobs(agent_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_order_id ON print_jobs(order_id);

-- Garantir que RLS está habilitado
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- Recriar políticas se necessário
DROP POLICY IF EXISTS "Anyone can insert print jobs" ON print_jobs;
CREATE POLICY "Anyone can insert print jobs" ON print_jobs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view print jobs" ON print_jobs;
CREATE POLICY "Anyone can view print jobs" ON print_jobs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update print jobs" ON print_jobs;
CREATE POLICY "Anyone can update print jobs" ON print_jobs
  FOR UPDATE USING (true);

-- Comentários para documentação
COMMENT ON TABLE print_jobs IS 'Tabela para gerenciar jobs de impressão do print-agent';
COMMENT ON COLUMN print_jobs.order_id IS 'ID do pedido relacionado';
COMMENT ON COLUMN print_jobs.agent_id IS 'ID do agente de impressão';
COMMENT ON COLUMN print_jobs.status IS 'Status do job: queued, processing, done, error';
COMMENT ON COLUMN print_jobs.text_content IS 'Conteúdo de texto para impressão';
COMMENT ON COLUMN print_jobs.printer_name IS 'Nome da impressora utilizada';
COMMENT ON COLUMN print_jobs.retry_count IS 'Número de tentativas de impressão';
COMMENT ON COLUMN print_jobs.error_message IS 'Mensagem de erro em caso de falha';
