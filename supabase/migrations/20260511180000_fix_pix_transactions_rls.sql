-- Migration: 20260511180000_fix_pix_transactions_rls.sql
-- Corrigir RLS policies para permitir acesso admin na validação PIX

-- Remover policies antigas restritivas
DROP POLICY IF EXISTS "Users can view their own pix transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Users can insert their own pix transactions" ON pix_transactions;

-- Criar policies permissivas para permitir validação admin
CREATE POLICY "Allow all select pix_transactions" ON pix_transactions FOR SELECT USING (true);
CREATE POLICY "Allow all insert pix_transactions" ON pix_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update pix_transactions" ON pix_transactions FOR UPDATE USING (true) WITH CHECK (true);

-- Service role tem acesso total
CREATE POLICY "Service role full access pix_transactions"
  ON pix_transactions FOR ALL
  TO service_role
  USING (true);
