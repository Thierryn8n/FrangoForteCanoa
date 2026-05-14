-- Criar tabelas de clientes e endereços
-- Migration: 20260506000007_create_customers_tables.sql

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de endereços de clientes
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    neighborhood TEXT,
    complement TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default ON customer_addresses(is_default);

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para customers
CREATE POLICY "Users can view all customers" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Users can insert customers" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update customers" ON customers
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete customers" ON customers
    FOR DELETE USING (true);

-- Políticas RLS para customer_addresses
CREATE POLICY "Users can view all customer addresses" ON customer_addresses
    FOR SELECT USING (true);

CREATE POLICY "Users can insert customer addresses" ON customer_addresses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update customer addresses" ON customer_addresses
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete customer addresses" ON customer_addresses
    FOR DELETE USING (true);

-- Inserir dados de exemplo (opcional)
INSERT INTO customers (id, name, phone, email) VALUES 
('550e8400-e29b-41d4-a716-44227297b5e3', 'João da Silva', '88996125274', 'joao.silva@email.com'),
('550e8400-e29b-41d4-a716-44227297b5e4', 'Maria Santos', '88996125275', 'maria.santos@email.com')
ON CONFLICT DO NOTHING;

-- Inserir endereços de exemplo
INSERT INTO customer_addresses (customer_id, address, neighborhood, complement, is_default) VALUES 
('550e8400-e29b-41d4-a716-44227297b5e3', 'Rua 7 de Abril, 16', 'Centro', 'Loja', true),
('550e8400-e29b-41d4-a716-44227297b5e3', 'Rua das Flores, 123', 'Jardim', 'Casa 1', false),
('550e8400-e29b-41d4-a716-44227297b5e4', 'Avenida Principal, 500', 'Industrial', 'Apto 201', true)
ON CONFLICT DO NOTHING;
