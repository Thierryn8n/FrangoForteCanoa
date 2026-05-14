-- Migration: Adicionar campos PDV faltantes na tabela products
-- A tabela foi criada pelo schema ecommerce (010_products.sql) antes do PDV

DO $$
BEGIN
    -- Adicionar price_per_kg se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'price_per_kg'
    ) THEN
        ALTER TABLE products ADD COLUMN price_per_kg DECIMAL(10, 2);
        UPDATE products SET price_per_kg = price WHERE unit = 'kg' OR unit IS NULL;
    END IF;

    -- Adicionar validity_days se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'validity_days'
    ) THEN
        ALTER TABLE products ADD COLUMN validity_days INTEGER;
    END IF;

    -- Adicionar product_kind se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'product_kind'
    ) THEN
        ALTER TABLE products ADD COLUMN product_kind VARCHAR(20) DEFAULT 'regular';
    END IF;

    -- Adicionar requires_album_cover se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'requires_album_cover'
    ) THEN
        ALTER TABLE products ADD COLUMN requires_album_cover BOOLEAN DEFAULT false;
    END IF;

    -- Adicionar cover_image_url se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'cover_image_url'
    ) THEN
        ALTER TABLE products ADD COLUMN cover_image_url VARCHAR(500);
    END IF;

    -- Adicionar slug se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'slug'
    ) THEN
        ALTER TABLE products ADD COLUMN slug TEXT;
        
        -- Gerar slugs para produtos existentes
        UPDATE products 
        SET slug = LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(name, '[^a-zA-Z0-9\\s]', '', 'g'),
                '\\s+', '-', 'g'
            )
        )
        WHERE slug IS NULL OR slug = '';
        
        -- Corrigir slugs duplicados
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
        
        -- Criar índice único
        CREATE UNIQUE INDEX idx_products_slug_unique ON products(slug);
    END IF;
END $$;
