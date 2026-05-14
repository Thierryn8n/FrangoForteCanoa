# ORDEM DE INSTALAÇÃO NO SUPABASE

Execute estes arquivos na ordem abaixo no SQL Editor do Supabase:

## FASE 1: STORAGE BUCKETS (Execute primeiro)
1. **buket_storage_fixed.sql** (arquivo corrigido abaixo)
   - Cria os buckets de storage para imagens

## FASE 2: TABELAS INDEPENDENTES (Sem dependências)
2. **009_categories.sql**
   - Cria tabela de categorias
   - Seed de categorias iniciais

3. **011_kits.sql**
   - Cria tabela de kits
   - Seed de kits iniciais

4. **001_pdv_caixa_system.sql**
   - Cria: categories*, products*, product_images, orders (PDV), order_items (PDV)
   - Cria: ecommerce_orders, ecommerce_order_items, store_settings*, delivery_areas
   - Cria: coupons, print_jobs
   - *Nota: Estas tabelas podem já existir dos arquivos anteriores (usar IF NOT EXISTS)

5. **20260105000001_create_admins_table.sql**
   - Cria tabela de administradores
   - Funções para setup inicial do admin

## FASE 3: TABELAS COM DEPENDÊNCIAS
6. **010_products.sql**
   - Depende de: categories
   - Cria tabela de produtos com RLS
   - Seed de produtos iniciais

7. **008_missing_tables.sql** (ou execute partes separadas)
   - Depende de: auth.users (para customers)
   - Cria: customers, customer_addresses, customer_favorites
   - Cria: store_settings (se não existir)
   - Trigger para auto-criar customer no signup

## FASE 4: TABELAS DE PEDIDOS (Dependem de customers e products)
8. **012_orders.sql**
   - Depende de: customers
   - Cria tabela de pedidos com RLS

9. **013_order_items.sql**
   - Depende de: orders, products, kits
   - Cria tabela de itens do pedido

## FASE 5: OUTRAS TABELAS
10. **014_testimonials.sql**
    - Depende de: customers, orders
    - Cria tabela de depoimentos
    - Seed de depoimentos iniciais

11. **016_vitrine_settings.sql**
    - Altera store_settings (adiciona colunas de vitrine)
    - Cria newsletter_subscribers
    - Seed de kits (se necessário)

## FASE 6: RLS E REALTIME
12. **015_rls_realtime_print_jobs.sql**
    - Habilita Realtime em print_jobs, orders, ecommerce_orders
    - Configura RLS em todas as tabelas PDV
    - Cria triggers para updated_at
    - Seed de store_settings (se não existir)

## FASE 7: STORAGE RLS POLICIES
13. **006_storage_rls_policies.sql**
    - Configura políticas de acesso para os buckets de storage
    - Execute APÓS criar os buckets

## FASE 8: SEED DATA (Opcional - execute após todas as tabelas)
14. **005_seed_products_kits.sql**
    - Atualiza imagens para PNG
    - Insere/atualiza produtos e kits

15. **007_update_product_images_to_png.sql**
    - Atualiza URLs de imagens existentes para PNG

---

## ARQUIVOS QUE NÃO PRECISAM SER EXECUTADOS (Redundantes)

Estes arquivos criam tabelas que já são criadas em outros arquivos:

- ❌ **000_all_tables.sql** - Redundante (covered por 008 + 012 + 013 + 014)
- ❌ **001_customers.sql** - Redundante (covered por 008_missing_tables.sql)
- ❌ **002_customer_addresses.sql** - Redundante (covered por 008_missing_tables.sql)
- ❌ **003_customer_favorites.sql** - Redundante (covered por 008_missing_tables.sql)
- ❌ **004_store_settings.sql** - Redundante (covered por 001_pdv_caixa_system.sql ou 008)

---

## ARQUIVO CORRIGIDO: buket_storage_fixed.sql

```sql
-- Criar bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para imagens de kits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kit-images',
  'kit-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para imagens de categorias
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
```

---

## COMANDO RÁPIDO (Para copiar e colar no SQL Editor)

Execute na ordem:

```sql
-- 1. Criar storage buckets (cole o código acima)
-- 2. 009_categories.sql
-- 3. 011_kits.sql  
-- 4. 001_pdv_caixa_system.sql
-- 5. 20260105000001_create_admins_table.sql
-- 6. 010_products.sql
-- 7. 008_missing_tables.sql
-- 8. 012_orders.sql
-- 9. 013_order_items.sql
-- 10. 014_testimonials.sql
-- 11. 016_vitrine_settings.sql
-- 12. 015_rls_realtime_print_jobs.sql
-- 13. 006_storage_rls_policies.sql
-- 14. 005_seed_products_kits.sql (opcional)
-- 15. 007_update_product_images_to_png.sql (opcional)
```

---

## RESUMO DAS DEPENDÊNCIAS

```
Storage Buckets (independente)
    ↓
Categories, Kits, Store Settings, Admins (independentes)
    ↓
Products (depende de Categories)
    ↓
Customers (depende de auth.users) → Customer Addresses, Favorites
    ↓
Orders (depende de Customers) → Order Items (depende de Orders + Products + Kits)
    ↓
Testimonials (depende de Customers + Orders)
    ↓
RLS Policies + Realtime
    ↓
Seed Data
```
