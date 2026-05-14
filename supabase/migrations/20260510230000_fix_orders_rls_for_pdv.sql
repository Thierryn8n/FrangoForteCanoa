-- Migration: 20260510230000_fix_orders_rls_for_pdv.sql
-- Corrigir RLS para permitir pedidos PDV (sem autenticação) e caixa

-- Remover policies restritivas de INSERT para orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

-- Criar policy permissiva para INSERT (PDV/caixa não tem auth)
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Criar policy permissiva para SELECT (PDV precisa listar pedidos)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Anyone can view orders" ON orders
  FOR SELECT USING (true);

-- Criar policy permissiva para UPDATE (caixa precisa atualizar status)
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Anyone can update orders" ON orders
  FOR UPDATE USING (true);

-- Policies para order_items
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Anyone can view order items" ON order_items
  FOR SELECT USING (true);

-- Criar policy permissiva para INSERT em order_items
CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Criar policy permissiva para DELETE em order_items
CREATE POLICY "Anyone can delete order items" ON order_items
  FOR DELETE USING (true);
