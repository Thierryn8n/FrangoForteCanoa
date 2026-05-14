-- Migration: Adicionar categoria de Ovos e produtos iniciais
-- Descrição: Cria a categoria 'Ovos' e insere 3 variações baseadas nas imagens fornecidas.

DO $$
BEGIN
    -- 1. Garantir que a coluna 'slug' exista (essencial para o ON CONFLICT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'slug') THEN
        ALTER TABLE categories ADD COLUMN slug VARCHAR(255) UNIQUE;
        UPDATE categories SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;
        ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
    END IF;

    -- 2. Garantir que a coluna 'is_active' exista
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
        ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

DO $$
DECLARE
    v_category_id UUID;
BEGIN
    -- 3. Inserir a categoria 'Ovos' apenas com colunas básicas confirmadas
    INSERT INTO categories (name, slug, is_active)
    VALUES ('Ovos', 'ovos', true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_category_id;

    -- 4. Inserir os produtos (Ovos)
    -- 10 Ovos
    INSERT INTO products (
        category_id, name, slug, short_description, price, unit, 
        stock_quantity, is_active, is_featured, image_url
    )
    VALUES (
        v_category_id, 
        'Cartela com 10 Ovos', 
        'cartela-10-ovos', 
        'Ovos caipiras frescos e selecionados.', 
        8.50, 
        'und', 
        100, 
        true, 
        true, 
        '/10 ovos (1).png'
    )
    ON CONFLICT (slug) DO NOTHING;

    -- 20 Ovos
    INSERT INTO products (
        category_id, name, slug, short_description, price, unit, 
        stock_quantity, is_active, is_featured, image_url
    )
    VALUES (
        v_category_id, 
        'Cartela com 20 Ovos', 
        'cartela-20-ovos', 
        'Ovos caipiras frescos e selecionados.', 
        16.00, 
        'und', 
        100, 
        true, 
        true, 
        '/20 ovos (1).png'
    )
    ON CONFLICT (slug) DO NOTHING;

    -- 30 Ovos
    INSERT INTO products (
        category_id, name, slug, short_description, price, unit, 
        stock_quantity, is_active, is_featured, image_url
    )
    VALUES (
        v_category_id, 
        'Cartela com 30 Ovos', 
        'cartela-30-ovos', 
        'Ovos caipiras frescos e selecionados.', 
        23.00, 
        'und', 
        100, 
        true, 
        true, 
        '/30 ovos (1).png'
    )
    ON CONFLICT (slug) DO NOTHING;

END $$;
