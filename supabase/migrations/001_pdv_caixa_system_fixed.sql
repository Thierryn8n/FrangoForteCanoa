-- ============================================================
-- PDV E CAIXA SYSTEM - CORRIGIDO COM IF NOT EXISTS
-- Execute este arquivo em vez do 001_pdv_caixa_system.sql original
-- ============================================================

-- Categorias (já pode existir do 009_categories.sql)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(255),
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT now()
);

-- Produtos (estrutura PDV - diferente da tabela products do ecommerce)
-- NOTA: Se você já executou 010_products.sql, esta tabela vai conflitar!
-- Descomente apenas se NÃO for usar o sistema de products do ecommerce
/*
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_per_kg DECIMAL(10, 2) NOT NULL CHECK (price_per_kg > 0),
  category_id UUID REFERENCES categories(id),
  validity_days INTEGER,
  image_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  product_kind VARCHAR(20) DEFAULT 'regular' CHECK (product_kind IN ('regular', 'audio')),
  requires_album_cover BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
*/

-- Imagens de Produtos
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_variants JSONB,
  title VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Pedidos PDV
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGSERIAL UNIQUE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('money', 'credit', 'debit', 'pix')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  cashier_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Itens do Pedido PDV
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  weight_kg DECIMAL(10, 3) NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  validity_date DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- Pedidos E-commerce
CREATE TABLE IF NOT EXISTS ecommerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGSERIAL UNIQUE,
  customer_id UUID,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_tax_id VARCHAR(20),
  delivery_address_id UUID,
  delivery_street VARCHAR(255),
  delivery_number VARCHAR(20),
  delivery_complement VARCHAR(255),
  delivery_neighborhood VARCHAR(255),
  delivery_city VARCHAR(255),
  delivery_state VARCHAR(2),
  delivery_zip_code VARCHAR(10),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  coupon_code VARCHAR(50),
  coupon_id UUID,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  tracking_code VARCHAR(100),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Itens E-commerce
CREATE TABLE IF NOT EXISTS ecommerce_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  weight_kg DECIMAL(10, 3) NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Configurações da Loja
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name VARCHAR(255),
  cnpj VARCHAR(20),
  address TEXT,
  phone VARCHAR(20),
  logo_url VARCHAR(500),
  description TEXT,
  payment_settings JSONB DEFAULT '{}'::jsonb,
  shipping_settings JSONB DEFAULT '{}'::jsonb,
  general_settings JSONB DEFAULT '{}'::jsonb,
  owner_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Áreas de Entrega
CREATE TABLE IF NOT EXISTS delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood VARCHAR(255) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL,
  estimated_time_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Cupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_value DECIMAL(10, 2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Print Jobs (Real-time para impressora térmica)
CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_channel VARCHAR(20) CHECK (source_channel IN ('pos', 'online')),
  source_order_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  payload JSONB,
  html_content TEXT,
  text_content TEXT,
  created_at TIMESTAMP DEFAULT now(),
  printed_at TIMESTAMP
);

-- Índices para performance (usando IF NOT EXISTS onde possível)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_items_order ON ecommerce_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created ON print_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_created ON ecommerce_orders(created_at);
