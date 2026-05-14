-- Migration: 20260510210000_create_clientes_table.sql
-- Criar tabela de clientes específica para checkout, admin e caixa
-- A tabela customers existente continua servindo para login/cadastro de usuários

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    phone TEXT,
    address TEXT,
    address_number TEXT,
    address_complement TEXT,
    zip_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_clientes_phone ON clientes(phone);
CREATE INDEX IF NOT EXISTS idx_clientes_full_name ON clientes(full_name);

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permissivas para uso interno no checkout, caixa e admin
CREATE POLICY "Users can view all clientes" ON clientes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert clientes" ON clientes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update clientes" ON clientes
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete clientes" ON clientes
    FOR DELETE USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
