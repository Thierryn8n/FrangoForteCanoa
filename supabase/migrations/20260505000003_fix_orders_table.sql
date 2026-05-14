-- Adicionar campos que estão faltando na tabela orders para o checkout
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Atualizar check constraint do payment_method para incluir os métodos do checkout
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('credit_card', 'debit_card', 'pix', 'cash', 'transfer', 'credit', 'debit', 'money'));

-- Adicionar política RLS para admin poder ver todos os pedidos
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      JOIN admins ON admins.email = auth.users.email 
      WHERE auth.users.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      JOIN admins ON admins.email = auth.users.email 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Adicionar política RLS para admin poder ver todas as transações PIX
DROP POLICY IF EXISTS "Admins can view all pix transactions" ON pix_transactions;
CREATE POLICY "Admins can view all pix transactions" ON pix_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      JOIN admins ON admins.email = auth.users.email 
      WHERE auth.users.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update all pix transactions" ON pix_transactions;
CREATE POLICY "Admins can update all pix transactions" ON pix_transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      JOIN admins ON admins.email = auth.users.email 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Adicionar função para permitir admin inserir pedidos (para checkout sem usuário)
DROP POLICY IF EXISTS "Admins and guests can insert orders" ON orders;
CREATE POLICY "Admins and guests can insert orders" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND user_id IS NULL) OR
    EXISTS (
      SELECT 1 FROM auth.users 
      JOIN admins ON admins.email = auth.users.email 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Adicionar política para usuários não logados poderem criar pedidos
DROP POLICY IF EXISTS "Guests can insert orders without user_id" ON orders;
CREATE POLICY "Guests can insert orders without user_id" ON orders
  FOR INSERT WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL) OR
    auth.uid() = user_id
  );

-- Adicionar política para usuários não logados poderem ver seus próprios pedidos por telefone/email
DROP POLICY IF EXISTS "Guests can view orders by phone/email" ON orders;
CREATE POLICY "Guests can view orders by phone/email" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.uid() IS NULL AND (
      customer_phone = current_setting('app.current_phone', true) OR
      customer_email = current_setting('app.current_email', true)
    ))
  );

-- Criar função para facilitar busca de pedidos por telefone
CREATE OR REPLACE FUNCTION get_orders_by_phone(phone_number TEXT)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  status TEXT,
  payment_method TEXT,
  payment_status TEXT,
  total DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_name,
    o.customer_phone,
    o.customer_email,
    o.status,
    o.payment_method,
    o.payment_status,
    o.total,
    o.created_at,
    o.updated_at
  FROM orders o
  WHERE o.customer_phone = phone_number
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para facilitar busca de pedidos por email
CREATE OR REPLACE FUNCTION get_orders_by_email(email_address TEXT)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  status TEXT,
  payment_method TEXT,
  payment_status TEXT,
  total DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_name,
    o.customer_phone,
    o.customer_email,
    o.status,
    o.payment_method,
    o.payment_status,
    o.total,
    o.created_at,
    o.updated_at
  FROM orders o
  WHERE o.customer_email = email_address
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
