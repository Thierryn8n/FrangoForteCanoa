-- Adicionar colunas necessárias na tabela order_items
-- Migration para corrigir estrutura da tabela order_items

-- Verificar se a tabela existe e adicionar colunas faltantes
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

    -- Adicionar created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Garantir que as colunas tenham as restrições corretas
ALTER TABLE order_items 
ALTER COLUMN product_name SET NOT NULL,
ALTER COLUMN product_price SET NOT NULL,
ALTER COLUMN quantity SET NOT NULL,
ALTER COLUMN unit SET NOT NULL,
ALTER COLUMN subtotal SET NOT NULL;

-- Adicionar restrição CHECK para quantity > 0 (verificar se não existe primeiro)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_items' 
        AND constraint_name = 'check_quantity_positive'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT check_quantity_positive 
        CHECK (quantity > 0);
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para order_items
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
CREATE POLICY "Users can insert their own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Adicionar colunas faltantes na tabela orders se necessário
DO $$
BEGIN
    -- Adicionar delivery_neighborhood se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_neighborhood'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_neighborhood TEXT;
    END IF;

    -- Adicionar delivery_type se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_type'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_type TEXT DEFAULT 'delivery';
    END IF;

    -- Adicionar order_number se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_number BIGSERIAL UNIQUE;
    END IF;
END $$;

-- Criar sequence para order_number se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'orders_order_number_seq') THEN
        CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq;
        ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('orders_order_number_seq');
    END IF;
END $$;

-- Criar trigger para order_number automático
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := nextval('orders_order_number_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Atualizar dados existentes se houver
UPDATE order_items SET 
    product_name = COALESCE(product_name, 'Produto'),
    product_price = COALESCE(product_price, 0),
    quantity = COALESCE(quantity, 1),
    unit = COALESCE(unit, 'un'),
    subtotal = COALESCE(subtotal, 0)
WHERE product_name IS NULL OR product_price IS NULL OR quantity IS NULL OR unit IS NULL OR subtotal IS NULL;

COMMIT;
