-- Migration: 20260510230001_fix_orders_rls_safe.sql
-- Corrigir RLS para permitir pedidos PDV (sem autenticação) - versão segura

-- === ORDERS ===

-- Remover policies antigas restritivas (se existirem)
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

-- Remover policies permissivas anteriores (se existirem)
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON orders;

-- Criar policies permissivas
CREATE POLICY "Allow all insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all select orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow all update orders" ON orders FOR UPDATE USING (true);

-- === ORDER_ITEMS ===

-- Remover policies antigas restritivas (se existirem)
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;

-- Remover policies permissivas anteriores (se existirem)
DROP POLICY IF EXISTS "Anyone can view order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can delete order items" ON order_items;

-- Criar policies permissivas
CREATE POLICY "Allow all select order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow all insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete order_items" ON order_items FOR DELETE USING (true);
