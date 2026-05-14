-- Migration: Adicionar campo slug na tabela products
-- O schema PDV criou a tabela sem slug, e o schema ecommerce espera que exista

DO $$
BEGIN
    -- Adicionar coluna slug se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'slug'
    ) THEN
        ALTER TABLE products ADD COLUMN slug TEXT;
        
        -- Criar índice único para slug
        CREATE UNIQUE INDEX idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;
        
        -- Gerar slugs para produtos existentes baseados no nome
        UPDATE products 
        SET slug = LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(name, '[^a-zA-Z0-9\\s]', '', 'g'),
                '\\s+', '-', 'g'
            )
        )
        WHERE slug IS NULL OR slug = '';
        
        -- Para produtos com slug duplicado, adicionar um sufixo numérico
        WITH numbered AS (
            SELECT 
                id,
                slug,
                ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) as rn
            FROM products
            WHERE slug IS NOT NULL
        )
        UPDATE products p
        SET slug = n.slug || '-' || n.rn
        FROM numbered n
        WHERE p.id = n.id AND n.rn > 1;
    END IF;
END $$;

-- Adicionar índice para busca se não existir
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
