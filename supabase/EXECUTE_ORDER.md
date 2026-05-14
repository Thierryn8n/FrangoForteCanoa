# Ordem de Execucao dos SQLs

Execute os arquivos SQL no Supabase SQL Editor nesta ordem:

## Tabelas que voce JA tem:
- categories
- kits  
- newsletter_subscribers
- order_items
- orders
- products
- testimonials

## O que precisa executar:

### 1. Tabelas Faltantes (OBRIGATORIO)
```
supabase/migrations/008_missing_tables.sql
```
Cria:
- customers (perfil de clientes)
- customer_addresses (enderecos de entrega)
- customer_favorites (produtos favoritos)
- store_settings (configuracoes da loja)
- Trigger para auto-criar perfil no signup

### 2. RLS Policies do Storage (OBRIGATORIO)
```
supabase/migrations/006_storage_rls_policies.sql
```
Permite:
- Leitura publica das imagens
- Upload por usuarios autenticados
- Delete por usuarios autenticados

### 3. Atualizar Imagens para PNG (OPCIONAL)
```
supabase/migrations/007_update_product_images_to_png.sql
```
Atualiza os caminhos das imagens de .jpg para .png

---

## Verificacao Final

Apos executar, voce deve ter essas 11 tabelas:
1. categories
2. customers
3. customer_addresses
4. customer_favorites
5. kits
6. newsletter_subscribers
7. order_items
8. orders
9. products
10. store_settings
11. testimonials

E esses 3 buckets no Storage:
1. product-images
2. kit-images
3. category-images
