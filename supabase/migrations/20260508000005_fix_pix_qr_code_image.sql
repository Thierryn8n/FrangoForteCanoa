-- Corrigir coluna qr_code_image na tabela pix_transactions
-- Migration para alinhar colunas com o código

-- Verificar se a coluna qr_code_image existe e remover se desnecessária
DO $$
BEGIN
    -- Remover coluna qr_code_image se existir (não é usada no código)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'qr_code_image'
    ) THEN
        ALTER TABLE pix_transactions DROP COLUMN qr_code_image;
    END IF;
END $$;

-- Garantir que a coluna qr_code exista e não seja nula
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'qr_code'
    ) THEN
        ALTER TABLE pix_transactions ADD COLUMN qr_code TEXT NOT NULL DEFAULT '';
    END IF;

    -- Remover constraint NOT NULL temporariamente se existir problema
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'qr_code'
        AND is_nullable = 'YES'
    ) THEN
        -- Permitir nulo temporariamente para corrigir dados existentes
        ALTER TABLE pix_transactions ALTER COLUMN qr_code DROP NOT NULL;
    END IF;
END $$;

-- Atualizar dados existentes se houver
UPDATE pix_transactions SET 
    qr_code = COALESCE(qr_code, '')
WHERE qr_code IS NULL;

-- Reaplicar constraint NOT NULL se foi removido
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pix_transactions' 
        AND column_name = 'qr_code'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE pix_transactions ALTER COLUMN qr_code SET NOT NULL;
    END IF;
END $$;

COMMIT;
