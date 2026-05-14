  -- ============================================================
  -- FIX RLS POLICIES FOR ORDER STATUS UPDATES
  -- Corrigir políticas de segurança que bloqueiam atualizações
  -- ============================================================

  -- Remover políticas antigas da tabela orders
  DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
  DROP POLICY IF EXISTS "Users can insert orders" ON orders;
  DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
  DROP POLICY IF EXISTS "Admins can update any order" ON orders;

  -- Remover políticas existentes antes de criar
  DROP POLICY IF EXISTS "Allow anonymous read access to orders" ON orders;
  DROP POLICY IF EXISTS "Allow anonymous insert access to orders" ON orders;
  DROP POLICY IF EXISTS "Allow anonymous update access to orders" ON orders;

  -- Criar novas políticas mais permissivas para a tabela orders
  CREATE POLICY "Allow anonymous read access to orders" ON orders
    FOR SELECT USING (true);

  CREATE POLICY "Allow anonymous insert access to orders" ON orders
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "Allow anonymous update access to orders" ON orders
    FOR UPDATE USING (true);

  -- Remover políticas antigas da tabela order_status_updates
  DROP POLICY IF EXISTS "Users can view order status updates" ON order_status_updates;
  DROP POLICY IF EXISTS "Users can insert order status updates" ON order_status_updates;
  DROP POLICY IF EXISTS "Admins can update order status updates" ON order_status_updates;
  DROP POLICY IF EXISTS "Allow anonymous access to order status updates" ON order_status_updates;

  -- Criar novas políticas mais permissivas para order_status_updates
  CREATE POLICY "Allow anonymous access to order status updates" ON order_status_updates
    FOR ALL USING (true) WITH CHECK (true);

  -- Remover políticas antigas da tabela order_status_logs
  DROP POLICY IF EXISTS "Users can view order status logs" ON order_status_logs;
  DROP POLICY IF EXISTS "Admins can insert order status logs" ON order_status_logs;
  DROP POLICY IF EXISTS "Allow anonymous access to order status logs" ON order_status_logs;

  -- Criar novas políticas mais permissivas para order_status_logs
  CREATE POLICY "Allow anonymous access to order status logs" ON order_status_logs
    FOR ALL USING (true) WITH CHECK (true);

  -- Garantir que RLS está habilitado
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE order_status_updates ENABLE ROW LEVEL SECURITY;
  ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
