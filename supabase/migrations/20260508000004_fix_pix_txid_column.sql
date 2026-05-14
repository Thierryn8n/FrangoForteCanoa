-- Corrigir coluna txid vs transaction_id na tabela pix_transactions
-- Migration para alinhar colunas com o código

-- Verificar se a coluna txid existe e renomear para transaction_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'txid'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'transaction_id'
    ) THEN
        -- Renomear coluna txid para transaction_id
        ALTER TABLE pix_transactions RENAME COLUMN txid TO transaction_id;
    END IF;
END $$;

-- Garantir que a coluna transaction_id exista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN transaction_id VARCHAR(255);
    END IF;
END $$;

-- Remover coluna txid se ainda existir (após renomear)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'txid'
    ) THEN
        ALTER TABLE pix_transactions DROP COLUMN txid;
    END IF;
END $$;

-- Atualizar dados existentes se houver
UPDATE pix_transactions SET 
    transaction_id = COALESCE(transaction_id, '')
WHERE transaction_id IS NULL;

COMMIT;
