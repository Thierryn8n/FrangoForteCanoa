-- Corrigir tabela pix_transactions
-- Migration para adicionar colunas faltantes e garantir estrutura correta

-- Verificar e adicionar colunas faltantes na pix_transactions
DO $$
BEGIN
    -- Adicionar pix_key se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'pix_key'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN pix_key VARCHAR(255) NOT NULL DEFAULT '';
    END IF;

    -- Adicionar qr_code se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'qr_code'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN qr_code TEXT NOT NULL DEFAULT '';
    END IF;

    -- Adicionar transaction_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN transaction_id VARCHAR(255);
    END IF;

    -- Adicionar status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- Adicionar created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Adicionar updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Adicionar expires_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Adicionar paid_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'paid_at'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Garantir que as colunas tenham as restrições corretas
ALTER TABLE pix_transactions 
ALTER COLUMN pix_key SET NOT NULL,
ALTER COLUMN qr_code SET NOT NULL;

-- Adicionar constraint CHECK para status se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'pix_transactions' 
        AND constraint_name = 'check_pix_status'
    ) THEN
        ALTER TABLE pix_transactions 
        ADD CONSTRAINT check_pix_status 
        CHECK (status IN ('pending', 'paid', 'expired', 'cancelled'));
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_pix_transactions_order_id ON pix_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON pix_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_created_at ON pix_transactions(created_at);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pix_transactions
DROP POLICY IF EXISTS "Users can view their own pix transactions" ON pix_transactions;
CREATE POLICY "Users can view their own pix transactions" ON pix_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = pix_transactions.order_id 
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own pix transactions" ON pix_transactions;
CREATE POLICY "Users can insert their own pix transactions" ON pix_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = pix_transactions.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Atualizar dados existentes se houver
UPDATE pix_transactions SET 
    pix_key = COALESCE(pix_key, ''),
    qr_code = COALESCE(qr_code, ''),
    status = COALESCE(status, 'pending')
WHERE pix_key IS NULL OR qr_code IS NULL OR status IS NULL;

COMMIT;
