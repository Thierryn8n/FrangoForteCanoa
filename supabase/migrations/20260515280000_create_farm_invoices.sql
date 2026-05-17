-- Tabela para controle de notas fiscais de entrada de frango
CREATE TABLE IF NOT EXISTS farm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da nota fiscal
  access_key VARCHAR(44) UNIQUE NOT NULL, -- Chave de acesso da NF-e (44 dígitos)
  invoice_number VARCHAR(20) NOT NULL,
  invoice_series VARCHAR(5) NOT NULL,
  invoice_date DATE NOT NULL,
  authorization_date TIMESTAMP WITH TIME ZONE,
  authorization_protocol VARCHAR(50),
  
  -- Dados do fornecedor
  supplier_name VARCHAR(255) NOT NULL,
  supplier_cnpj VARCHAR(20),
  supplier_address TEXT,
  supplier_city VARCHAR(100),
  supplier_state VARCHAR(2),
  supplier_phone VARCHAR(20),
  
  -- Dados do produto
  product_code VARCHAR(20),
  product_description VARCHAR(255),
  product_ncm VARCHAR(10),
  unit VARCHAR(10),
  quantity_kg DECIMAL(10, 3) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_value DECIMAL(10, 2) NOT NULL,
  
  -- Dados de controle interno
  live_chicken_count INTEGER, -- Quantidade de aves vivas recebidas
  average_weight_per_chicken DECIMAL(10, 3), -- Peso médio por ave
  average_price_per_chicken DECIMAL(10, 2), -- Preço médio por ave
  
  -- Status
  status VARCHAR(20) DEFAULT 'received', -- received, processing, completed
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_farm_invoices_access_key ON farm_invoices(access_key);
CREATE INDEX IF NOT EXISTS idx_farm_invoices_invoice_date ON farm_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_farm_invoices_supplier_name ON farm_invoices(supplier_name);
CREATE INDEX IF NOT EXISTS idx_farm_invoices_status ON farm_invoices(status);

-- Tabela para controle de estoque de aves vivas
CREATE TABLE IF NOT EXISTS live_chicken_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência à nota fiscal
  farm_invoice_id UUID REFERENCES farm_invoices(id),
  
  -- Quantidades
  total_received INTEGER NOT NULL, -- Total de aves recebidas
  total_slaughtered INTEGER DEFAULT 0, -- Total de aves abatidas
  remaining_chickens INTEGER NOT NULL, -- Aves restantes
  
  -- Pesos
  total_weight_kg DECIMAL(10, 3) NOT NULL, -- Peso total recebido
  average_weight_per_chicken DECIMAL(10, 3), -- Peso médio por ave
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_live_chicken_stock_farm_invoice_id ON live_chicken_stock(farm_invoice_id);
CREATE INDEX IF NOT EXISTS idx_live_chicken_stock_status ON live_chicken_stock(status);

-- Tabela para controle de abate diário
CREATE TABLE IF NOT EXISTS daily_slaughter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao estoque de aves vivas
  live_chicken_stock_id UUID REFERENCES live_chicken_stock(id),
  
  -- Dados do abate
  slaughter_date DATE NOT NULL,
  chickens_slaughtered INTEGER NOT NULL, -- Quantidade de aves abatidas
  total_weight_kg DECIMAL(10, 3) NOT NULL, -- Peso total abatido
  average_weight_per_chicken DECIMAL(10, 3), -- Peso médio por ave abatida
  
  -- Metas
  daily_target_kg DECIMAL(10, 3) DEFAULT 200, -- Meta diária em KG
  target_achieved BOOLEAN DEFAULT false, -- Meta alcançada
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_daily_slaughter_live_chicken_stock_id ON daily_slaughter(live_chicken_stock_id);
CREATE INDEX IF NOT EXISTS idx_daily_slaughter_slaughter_date ON daily_slaughter(slaughter_date);
CREATE INDEX IF NOT EXISTS idx_daily_slaughter_target_achieved ON daily_slaughter(target_achieved);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_farm_invoices_updated_at BEFORE UPDATE ON farm_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_chicken_stock_updated_at BEFORE UPDATE ON live_chicken_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_slaughter_updated_at BEFORE UPDATE ON daily_slaughter
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE farm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chicken_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_slaughter ENABLE ROW LEVEL SECURITY;

-- Política para service role bypass
CREATE POLICY "Service role can do everything on farm_invoices" ON farm_invoices
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can do everything on live_chicken_stock" ON live_chicken_stock
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can do everything on daily_slaughter" ON daily_slaughter
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
