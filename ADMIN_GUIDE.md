# Guia do Painel Administrativo - Frango Forte

Este documento descreve como usar o painel administrativo para gerenciar produtos, kits, pedidos e configurações da loja.

## Estrutura do Banco de Dados

### Tabelas Principais

- **categories**: Categorias de produtos
- **products**: Produtos individuais
- **kits**: Kits e ofertas promocionais
- **customers**: Perfis de clientes (vinculados a auth.users)
- **customer_addresses**: Endereços salvos de clientes
- **customer_favorites**: Favoritos (produtos ou kits)
- **orders**: Pedidos de clientes
- **order_items**: Itens dentro de cada pedido
- **testimonials**: Depoimentos de clientes
- **newsletter_subscribers**: Emails para newsletter
- **store_settings**: Configurações gerais da loja

### Buckets de Storage

- **product-images**: Imagens de produtos (5MB max)
- **kit-images**: Imagens de kits (5MB max)
- **category-images**: Imagens de categorias (5MB max)

## Como Usar o Painel

### 1. Adicionar Novo Produto

1. Navegue para **Admin > Produtos**
2. Clique em **"+ Novo Produto"**
3. Preencha as informações:
   - **Nome**: Nome do produto (obrigatório)
   - **Slug**: URL amigável (auto-preenchido baseado no nome)
   - **Descrição**: Texto longo para a página do produto
   - **Descrição Curta**: Texto resumido para listas
   - **Preço**: Valor em reais (obrigatório)
   - **Preço Original**: Para mostrar desconto (opcional)
   - **Unidade**: kg, unidade ou litro
   - **Imagem**: Faça upload de PNG, JPG ou WebP (até 5MB)
   - **Categoria**: Selecione a categoria do produto
   - **Estoque**: Quantidade disponível
   - **Min. Pedido**: Quantidade mínima que cliente pode pedir
   - **Destaque**: Marcar para aparecer em destaque na loja
   - **Ativo**: Marcar para aparecer na loja

4. Clique em **"Criar Produto"**

### 2. Editar Produto Existente

1. Navegue para **Admin > Produtos**
2. Clique em **"Editar"** no produto desejado
3. Modifique as informações necessárias
4. Clique em **"Atualizar Produto"**
5. Para excluir, clique em **"Excluir"** no canto superior direito

### 3. Adicionar Novo Kit

1. Navegue para **Admin > Kits e Ofertas**
2. Clique em **"+ Novo Kit"**
3. Preencha:
   - **Nome**: Nome do kit
   - **Descrição**: Descrição do kit
   - **Conteúdo**: O que vem no kit (ex: "2x Peito + 2x Coxa")
   - **Preço**: Valor em reais
   - **Preço Original**: Para calcular desconto (opcional)
   - **Imagem**: Upload da imagem do kit
   - **Destaque**: Para aparecer em destaque
   - **Ativo**: Para aparecer na loja

4. Clique em **"Criar Kit"**

### 4. Gerenciar Pedidos

1. Navegue para **Admin > Pedidos**
2. Veja lista de pedidos com status:
   - **Pendente**: Aguardando confirmação
   - **Confirmado**: Pedido confirmado
   - **Preparando**: Sendo preparado
   - **Em Entrega**: Saiu para entrega
   - **Entregue**: Entrega concluída
   - **Cancelado**: Pedido cancelado

3. Clique em um pedido para ver detalhes e atualizar status

### 5. Configurações da Loja

1. Navegue para **Admin > Configurações**
2. Atualize:
   - Nome da loja
   - Telefone
   - WhatsApp
   - Email
   - Taxa de entrega
   - Valor mínimo do pedido
   - Tempo de entrega estimado
   - Endereço da loja
   - Cidade e estado

## Tipos de Arquivo Suportados

### Imagens
- **Formatos**: PNG, JPG, WebP, GIF
- **Tamanho máximo**: 5MB
- **Recomendações**: 
  - Produtos: 800x600px ou superior
  - Kits: 1200x800px
  - Fundo transparente preferível

## Migrations SQL

Todos os arquivos de migração estão em `supabase/migrations/`:

1. `000_all_tables.sql` - Todas as tabelas e policies
2. `001_customers.sql` - Tabela de clientes
3. `002_customer_addresses.sql` - Endereços
4. `003_customer_favorites.sql` - Favoritos
5. `004_store_settings.sql` - Configurações
6. `005_seed_products_kits.sql` - Dados iniciais
7. `006_storage_rls_policies.sql` - Políticas de storage

## Autenticação e Permissões

- **Clientes**: Podem criar conta e fazer pedidos
- **Admins**: Acesso completo ao painel
- **Service Role**: Utilizado para operações de backend (uploads, criação de dados)

## Troubleshooting

### Erro ao fazer upload de imagem
- Verifique se o arquivo é uma imagem válida
- Confirme que o tamanho é menor que 5MB
- Tente usar PNG ou JPG

### Produto não aparece na loja
- Verifique se está marcado como "Ativo"
- Confirme que tem preço definido
- Verifique se a categoria está ativa

### Produtos aparecem com imagem quebrada
- Faça upload da imagem novamente
- Confirme que o bucket de storage está público
- Verifique as RLS policies de storage

## Próximos Passos

- Adicionar páginas de categorias
- Implementar sistema de cupons
- Dashboard com gráficos de vendas
- Integração com WhatsApp para notificações
- Sistema de avaliações de clientes
