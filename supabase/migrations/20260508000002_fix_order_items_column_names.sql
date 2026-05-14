-- Corrigir nomes de colunas na tabela order_items
-- Migration para alinhar colunas com o código

-- Verificar se a coluna item_name existe e product_name não existe, então renomear
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'item_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_name'
    ) THEN
        -- Renomear coluna item_name para product_name
        ALTER TABLE order_items RENAME COLUMN item_name TO product_name;
    END IF;
END $$;

-- Verificar se a coluna item_price existe e product_price não existe, então renomear
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'item_price'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_price'
    ) THEN
        -- Renomear coluna item_price para product_price
        ALTER TABLE order_items RENAME COLUMN item_price TO product_price;
    END IF;
END $$;

-- Verificar se a coluna item_quantity existe e quantity não existe, então renomear
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'item_quantity'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'quantity'
    ) THEN
        -- Renomear coluna item_quantity para quantity
        ALTER TABLE order_items RENAME COLUMN item_quantity TO quantity;
    END IF;
END $$;

-- Garantir que todas as colunas necessárias existam
DO $$
BEGIN
    -- Adicionar product_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_name TEXT NOT NULL DEFAULT '';
    END IF;

    -- Adicionar product_price se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_price'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_price DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;

    -- Adicionar quantity se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
    END IF;

    -- Adicionar unit se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'unit'
    ) THEN
        ALTER TABLE order_items ADD COLUMN unit TEXT NOT NULL DEFAULT 'un';
    END IF;

    -- Adicionar subtotal se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Remover colunas desnecessárias se existirem
DO $$
BEGIN
    -- Remover coluna item_name se ainda existir (após renomear)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'item_name'
    ) THEN
        ALTER TABLE order_items DROP COLUMN item_name;
    END IF;

    -- Remover coluna item_price se ainda existir (após renomear)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'item_price'
    ) THEN
        ALTER TABLE order_items DROP COLUMN item_price;
    END IF;

    -- Remover coluna item_quantity se ainda existir (após renomear)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'item_quantity'
    ) THEN
        ALTER TABLE order_items DROP COLUMN item_quantity;
    END IF;
END $$;

-- Atualizar dados existentes se houver
UPDATE order_items SET 
    product_name = COALESCE(product_name, 'Produto'),
    product_price = COALESCE(product_price, 0),
    quantity = COALESCE(quantity, 1),
    unit = COALESCE(unit, 'un'),
    subtotal = COALESCE(subtotal, 0)
WHERE product_name IS NULL OR product_price IS NULL OR quantity IS NULL OR unit IS NULL OR subtotal IS NULL;

COMMIT;
