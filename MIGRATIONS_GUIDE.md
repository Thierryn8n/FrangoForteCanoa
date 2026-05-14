# Guia de Execução das Migrations - Supabase

Este guia explica como executar todos os arquivos SQL para configurar o banco de dados completo.

## 📍 Pré-requisitos

1. Projeto Supabase criado
2. Variáveis de ambiente configuradas
3. Acesso ao Supabase Dashboard

## 🚀 Passo a Passo

### Opção 1: Usando o Supabase Dashboard (Recomendado)

#### 1. Acessar SQL Editor

1. Vá para [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Clique em **"SQL Editor"** no menu lateral esquerdo
4. Clique em **"New Query"**

#### 2. Executar Migration Principal

1. Abra o arquivo `/supabase/migrations/000_all_tables.sql`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou Ctrl+Enter)
5. Aguarde conclusão (deve mostrar ✓ verde)

```sql
-- Conteúdo do arquivo 000_all_tables.sql
-- (todas as tabelas, RLS policies e seed data)
```

**Verificação**: Você deve ver estas tabelas em "Database" > "Tables":
- categories
- products
- kits
- customers
- customer_addresses
- customer_favorites
- orders
- order_items
- testimonials
- newsletter_subscribers
- store_settings

#### 3. Executar Policies do Storage

1. Clique em **"New Query"** novamente
2. Abra o arquivo `/supabase/migrations/006_storage_rls_policies.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **"Run"**

**Verificação**: Não deve haver erros

#### 4. Verificar Buckets

1. Vá para **"Storage"** no menu lateral
2. Você deve ver 3 buckets:
   - `product-images` (público, 5MB)
   - `kit-images` (público, 5MB)
   - `category-images` (público, 5MB)

Se os buckets não existirem, execute esta query:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('kit-images', 'kit-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
```

---

### Opção 2: Usando Supabase CLI (Avançado)

Se você tem o CLI instalado:

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link ao projeto
supabase link --project-ref seu-project-ref

# 4. Executar migrations
supabase db push

# 5. Verificar status
supabase migration list
```

---

## ✅ Checklist de Verificação

Após executar as migrations, verifique:

### Tabelas
- [ ] `categories` (4 registros)
- [ ] `products` (0 registros inicialmente)
- [ ] `kits` (0 registros inicialmente)
- [ ] `customers` (vazio)
- [ ] `customer_addresses` (vazio)
- [ ] `customer_favorites` (vazio)
- [ ] `orders` (vazio)
- [ ] `order_items` (vazio)
- [ ] `testimonials` (3 registros)
- [ ] `newsletter_subscribers` (vazio)
- [ ] `store_settings` (10 registros)

### Storage Buckets
- [ ] `product-images` (público)
- [ ] `kit-images` (público)
- [ ] `category-images` (público)

### RLS Policies

**Categories**: 
- [ ] `categories_public_read`
- [ ] `categories_admin_all`

**Products**:
- [ ] `products_public_read`
- [ ] `products_admin_all`

**Storage**:
- [ ] `Product images are publicly readable`
- [ ] `Authenticated users can upload product images`
- [ ] `Service role can delete product images`

(E similares para kit-images e category-images)

---

## 🐛 Troubleshooting

### Erro: "Relation already exists"

**Causa**: As tabelas já foram criadas anteriormente

**Solução**: 
1. Vá para Database > Tables
2. Delete as tabelas existentes (ou use `DROP TABLE ... CASCADE;`)
3. Execute novamente a migration

### Erro: "Permission denied"

**Causa**: Falta de permissão para criar políticas

**Solução**:
1. Verifique se sua conta é admin do projeto
2. Tente desabilitar o verificador de políticas temporariamente:
   - Projeto Settings > SQL Extensions
3. Execute a migration novamente

### Bucket não foi criado

**Causa**: SQL de bucket não foi executado ou já existe

**Solução**:
1. Vá para Storage > Buckets
2. Se o bucket existir mas estiver privado, edite para público
3. Se não existir, copie e execute a query de criação de buckets

### Imagens não salvam

**Causa**: RLS policies não foram aplicadas

**Solução**:
1. Execute `006_storage_rls_policies.sql`
2. Vá para Storage > Policies
3. Verifique se as 3 policies existem para cada bucket

---

## 📝 Dados Iniciais (Seed)

A migration `000_all_tables.sql` já insere:

### Categories (4)
- Frango Inteiro
- Cortes
- Miúdos
- Kits

### Testimonials (3)
- Maria Silva - ⭐⭐⭐⭐⭐
- João Santos - ⭐⭐⭐⭐⭐
- Ana Oliveira - ⭐⭐⭐⭐⭐

### Store Settings (10)
- store_name: "Frango Forte"
- store_phone: "(11) 99999-9999"
- store_whatsapp: "5511999999999"
- store_email: "contato@frangoforte.com.br"
- delivery_fee: "5.00"
- min_order_value: "30.00"
- delivery_time: "30-45 min"
- store_address: "Rua das Aves, 123 - Centro"
- store_city: "São Paulo"
- store_state: "SP"

---

## 🔄 Atualizando Dados

Para adicionar produtos e kits depois:

```sql
-- Inserir novo produto
INSERT INTO products (name, slug, description, short_description, price, unit, category_id, is_active)
VALUES (
  'Peito de Frango',
  'peito-frango',
  'Peito de frango fresco',
  'Peito fresco',
  25.00,
  'kg',
  (SELECT id FROM categories WHERE slug = 'cortes'),
  true
);

-- Inserir novo kit
INSERT INTO kits (name, slug, description, price, is_active)
VALUES (
  'Kit Churrasco',
  'kit-churrasco',
  'Kit completo para churrasco',
  89.90,
  true
);
```

---

## 🔑 Importante: Variáveis de Ambiente

Após as migrations, as seguintes variáveis devem estar no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Se não tiver:
1. Vá para Project Settings > API
2. Copie a URL do projeto
3. Copie a `anon` key (não use a `service_role` key publicamente!)

---

## 📞 Próximos Passos

Após executar as migrations:

1. ✅ Banco de dados configurado
2. ✅ Tabelas criadas
3. ✅ RLS policies aplicadas
4. ✅ Storage buckets prontos
5. 👉 **Agora você pode**: Testar upload de imagens no painel admin
6. 👉 **Depois**: Adicionar dados de verdade (produtos, kits, etc)

---

## 🎓 Referência de SQL

Se precisar modificar algo depois:

```sql
-- Ver todas as tabelas
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Ver RLS policies de uma tabela
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Ver buckets
SELECT * FROM storage.buckets;

-- Ver policies de storage
SELECT * FROM storage.s3_multipart_uploads LIMIT 1; -- Verificar permissões

-- Contar registros
SELECT count(*) FROM products;
SELECT count(*) FROM categories;
```

---

## 🎉 Conclusão

Após seguir este guia, seu banco de dados estará **100% configurado** e pronto para usar!

Dúvidas? Verifique o `ADMIN_GUIDE.md` ou `IMPLEMENTATION_SUMMARY.md`.
