-- Migration: Corrigir RLS e políticas para customer_addresses
-- A tabela existe mas pode estar sem as políticas de segurança corretas

-- Habilitar RLS se não estiver ativo
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "addresses_select_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "addresses_update_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "addresses_delete_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_select_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_insert_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_update_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_delete_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_admin_all" ON public.customer_addresses;

-- Criar políticas corretas
CREATE POLICY "users_can_view_own_addresses" ON public.customer_addresses 
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "users_can_insert_own_addresses" ON public.customer_addresses 
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "users_can_update_own_addresses" ON public.customer_addresses 
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "users_can_delete_own_addresses" ON public.customer_addresses 
  FOR DELETE USING (auth.uid() = customer_id);

-- Política para admin/service role
CREATE POLICY "service_role_full_access_addresses" ON public.customer_addresses 
  FOR ALL USING (auth.role() = 'service_role');

-- Garantir que o índice existe
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id 
  ON public.customer_addresses(customer_id);
