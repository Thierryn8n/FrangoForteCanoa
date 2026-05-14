-- Migration: Ajustar produtos para preço por quilo e suporte a favoritos
-- Descrição: Altera a estrutura de preços e garante que a tabela de favoritos esteja correta.

-- 1. Garantir que a tabela de produtos tenha price_per_kg
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_per_kg') THEN
        ALTER TABLE products ADD COLUMN price_per_kg DECIMAL(10, 2);
        -- Migrar dados existentes de price para price_per_kg onde a unidade for kg
        UPDATE products SET price_per_kg = price WHERE unit = 'kg' OR unit = 'kg.';
    END IF;
END $$;

-- 2. Garantir que a tabela customer_favorites exista e tenha as permissões RLS
CREATE TABLE IF NOT EXISTS customer_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(customer_id, product_id),
    UNIQUE(customer_id, kit_id),
    CONSTRAINT one_target_check CHECK (
        (product_id IS NOT NULL AND kit_id IS NULL) OR
        (product_id IS NULL AND kit_id IS NOT NULL)
    )
);

-- Habilitar RLS
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso para Favoritos
DROP POLICY IF EXISTS "Users can view their own favorites" ON customer_favorites;
CREATE POLICY "Users can view their own favorites"
ON customer_favorites FOR SELECT
USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON customer_favorites;
CREATE POLICY "Users can insert their own favorites"
ON customer_favorites FOR INSERT
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON customer_favorites;
CREATE POLICY "Users can delete their own favorites"
ON customer_favorites FOR DELETE
USING (auth.uid() = customer_id);

-- 3. Habilitar Realtime para favoritos
ALTER publication supabase_realtime ADD TABLE customer_favorites;
