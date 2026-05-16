-- Sistema Avançado de Custos Operacionais
-- Migration para criar tabelas de categorias de custos e atualizar tabela operational_costs

-- Tabela de categorias de custos operacionais personalizáveis
CREATE TABLE IF NOT EXISTS operational_cost_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_operational_cost_categories_updated_at
  BEFORE UPDATE ON operational_cost_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para operational_cost_categories
ALTER TABLE operational_cost_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operational cost categories are viewable by authenticated users"
  ON operational_cost_categories FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Operational cost categories can be created by authenticated users"
  ON operational_cost_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Operational cost categories can be updated by authenticated users"
  ON operational_cost_categories FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Operational cost categories can be deleted by authenticated users"
  ON operational_cost_categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can bypass RLS for operational_cost_categories"
  ON operational_cost_categories FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Atualizar tabela operational_costs com campos detalhados
ALTER TABLE operational_costs
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES operational_cost_categories(id),
  ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'onetime')),
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'pix', 'transfer', 'boleto')),
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_payment_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS quantity_purchased NUMERIC,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_mileage INTEGER,
  ADD COLUMN IF NOT EXISTS average_consumption NUMERIC;

-- Tabela de histórico de preços para custos operacionais
CREATE TABLE IF NOT EXISTS operational_cost_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_id UUID NOT NULL REFERENCES operational_costs(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  quantity NUMERIC,
  unit_price NUMERIC,
  purchase_date DATE NOT NULL,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_operational_cost_price_history_cost_id ON operational_cost_price_history(cost_id);
CREATE INDEX IF NOT EXISTS idx_operational_cost_price_history_purchase_date ON operational_cost_price_history(purchase_date);
CREATE INDEX IF NOT EXISTS idx_operational_costs_category_id ON operational_costs(category_id);
CREATE INDEX IF NOT EXISTS idx_operational_costs_frequency ON operational_costs(frequency);
CREATE INDEX IF NOT EXISTS idx_operational_costs_next_payment ON operational_costs(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_operational_costs_is_recurring ON operational_costs(is_recurring);

-- RLS Policies para operational_cost_price_history
ALTER TABLE operational_cost_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operational cost price history is viewable by authenticated users"
  ON operational_cost_price_history FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Operational cost price history can be created by authenticated users"
  ON operational_cost_price_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can bypass RLS for operational_cost_price_history"
  ON operational_cost_price_history FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Inserir categorias padrão
INSERT INTO operational_cost_categories (name, slug, description, icon, color) VALUES
  ('Gás', 'gas', 'Gás para uso comercial e residencial', 'flame', '#ef4444'),
  ('Gasolina', 'gasolina', 'Combustível para veículos', 'fuel', '#f97316'),
  ('Energia', 'energia', 'Energia elétrica', 'zap', '#eab308'),
  ('Água', 'agua', 'Fornecimento de água', 'droplet', '#3b82f6'),
  ('Funcionários', 'funcionarios', 'Salários e benefícios', 'users', '#8b5cf6'),
  ('Embalagens', 'embalagens', 'Materiais de embalagem', 'package', '#ec4899'),
  ('Transporte', 'transporte', 'Custos de transporte e logística', 'truck', '#14b8a6'),
  ('Ração', 'racao', 'Ração para animais', 'wheat', '#a3a3a3'),
  ('Manutenção', 'manutencao', 'Manutenção de equipamentos e instalações', 'wrench', '#6366f1'),
  ('Limpeza', 'limpeza', 'Produtos e serviços de limpeza', 'sparkles', '#22c55e'),
  ('Equipamentos', 'equipamentos', 'Compra e manutenção de equipamentos', 'settings', '#f59e0b'),
  ('Fretes', 'fretes', 'Custos de frete e entrega', 'truck', '#0ea5e9'),
  ('Impostos', 'impostos', 'Impostos e taxas governamentais', 'file-text', '#dc2626')
ON CONFLICT (slug) DO NOTHING;
