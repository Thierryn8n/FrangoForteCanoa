-- Sistema de Gestão de Estoque por KG
-- Tabelas para controle de estoque diário, categorias e transações

-- Tabela de categorias de estoque com tipos de unidade
CREATE TABLE IF NOT EXISTS stock_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('kg', 'unidade', 'caixa', 'pacote')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de abertura de estoque diário
CREATE TABLE IF NOT EXISTS daily_stock_opening (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_date DATE NOT NULL UNIQUE,
  opened_by UUID REFERENCES auth.users(id),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de estoque diário
CREATE TABLE IF NOT EXISTS daily_stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_id UUID NOT NULL REFERENCES daily_stock_opening(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES stock_categories(id),
  product_id UUID REFERENCES products(id),
  initial_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  current_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opening_id, product_id)
);

-- Tabela de transações de estoque
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_id UUID NOT NULL REFERENCES daily_stock_opening(id),
  stock_item_id UUID NOT NULL REFERENCES daily_stock_items(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'return', 'adjustment', 'waste')),
  quantity DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de preços da granja
CREATE TABLE IF NOT EXISTS farm_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_category TEXT NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  price_change_type TEXT NOT NULL CHECK (price_change_type IN ('increase', 'decrease', 'stable')),
  previous_price DECIMAL(10,2),
  effective_date DATE NOT NULL,
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de custos operacionais
CREATE TABLE IF NOT EXISTS operational_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_type TEXT NOT NULL CHECK (cost_type IN ('labor', 'transport', 'slaughter', 'energy', 'packaging', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relatórios diários
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL UNIQUE,
  opening_id UUID NOT NULL REFERENCES daily_stock_opening(id),
  total_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_profit DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_profit DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_quantity_sold DECIMAL(10,3) NOT NULL DEFAULT 0,
  products_sold_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_stock_opening_date ON daily_stock_opening(opening_date);
CREATE INDEX IF NOT EXISTS idx_daily_stock_items_opening ON daily_stock_items(opening_id);
CREATE INDEX IF NOT EXISTS idx_daily_stock_items_product ON daily_stock_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_opening ON stock_transactions(opening_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item ON stock_transactions(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_farm_price_history_date ON farm_price_history(effective_date);
CREATE INDEX IF NOT EXISTS idx_operational_costs_date ON operational_costs(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_categories_updated_at BEFORE UPDATE ON stock_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stock_opening_updated_at BEFORE UPDATE ON daily_stock_opening
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stock_items_updated_at BEFORE UPDATE ON daily_stock_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE stock_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stock_opening ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para stock_categories
CREATE POLICY "Stock categories are viewable by authenticated users" 
  ON stock_categories FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Stock categories can be created by authenticated users" 
  ON stock_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Stock categories can be updated by authenticated users" 
  ON stock_categories FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Stock categories can be deleted by authenticated users" 
  ON stock_categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can bypass RLS for stock_categories" 
  ON stock_categories FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Políticas para daily_stock_opening
CREATE POLICY "Daily stock opening is viewable by authenticated users" 
  ON daily_stock_opening FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Daily stock opening can be created by authenticated users" 
  ON daily_stock_opening FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Daily stock opening can be updated by authenticated users" 
  ON daily_stock_opening FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can bypass RLS for daily_stock_opening" 
  ON daily_stock_opening FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Políticas para daily_stock_items
CREATE POLICY "Daily stock items are viewable by authenticated users" 
  ON daily_stock_items FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Daily stock items can be created by authenticated users" 
  ON daily_stock_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Daily stock items can be updated by authenticated users" 
  ON daily_stock_items FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can bypass RLS for daily_stock_items" 
  ON daily_stock_items FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Políticas para stock_transactions
CREATE POLICY "Stock transactions are viewable by authenticated users" 
  ON stock_transactions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Stock transactions can be created by authenticated users" 
  ON stock_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can bypass RLS for stock_transactions" 
  ON stock_transactions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Políticas para farm_price_history
CREATE POLICY "Farm price history is viewable by authenticated users" 
  ON farm_price_history FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Farm price history can be created by authenticated users" 
  ON farm_price_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can bypass RLS for farm_price_history" 
  ON farm_price_history FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Políticas para operational_costs
CREATE POLICY "Operational costs are viewable by authenticated users" 
  ON operational_costs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Operational costs can be created by authenticated users" 
  ON operational_costs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can bypass RLS for operational_costs" 
  ON operational_costs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Políticas para daily_reports
CREATE POLICY "Daily reports are viewable by authenticated users" 
  ON daily_reports FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Daily reports can be created by authenticated users" 
  ON daily_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Daily reports can be updated by authenticated users" 
  ON daily_reports FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can bypass RLS for daily_reports" 
  ON daily_reports FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Inserir categorias padrão
INSERT INTO stock_categories (name, slug, unit_type, description) VALUES
  ('Frango', 'frango', 'kg', 'Produtos de frango vendidos por KG'),
  ('Carne Suína', 'carne-suina', 'kg', 'Produtos de carne suína vendidos por KG'),
  ('Carne Bovina', 'carne-bovina', 'kg', 'Produtos de carne bovina vendidos por KG'),
  ('Ovos', 'ovos', 'caixa', 'Caixas de ovos'),
  ('Linguiça', 'linguica', 'kg', 'Linguiças vendidas por KG'),
  ('Miúdos', 'miudos', 'kg', 'Miúdos vendidos por KG'),
  ('Produtos Congelados', 'produtos-congelados', 'kg', 'Produtos congelados vendidos por KG')
ON CONFLICT (slug) DO NOTHING;
