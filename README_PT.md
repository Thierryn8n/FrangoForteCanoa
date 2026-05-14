# 🐔 Frango Forte Canoa - Painel Administrativo com Upload de Imagens

> Sistema completo para gerenciar produtos, kits e pedidos com upload de imagens para Supabase Storage

## ✨ O Que Foi Implementado

### 📦 Componentes Criados

#### Páginas do Admin
- **`/admin/produtos/novo`** - Criar novo produto com upload de imagem
- **`/admin/produtos/[id]`** - Editar/deletar produto existente
- **`/admin/kits/novo`** - Criar novo kit com upload de imagem
- **`/admin/kits/[id]`** - Editar/deletar kit existente

#### Componentes Reutilizáveis
- **`ImageUpload`** - Upload de imagem com drag & drop, preview e validação

### 🗄️ Banco de Dados

#### Tabelas Criadas
1. **categories** - Categorias de produtos
2. **products** - Produtos com imagens
3. **kits** - Kits promocionais com imagens
4. **customers** - Clientes (vinculado a auth.users)
5. **customer_addresses** - Endereços de entrega
6. **customer_favorites** - Favoritos de clientes
7. **orders** - Pedidos realizados
8. **order_items** - Itens de cada pedido
9. **testimonials** - Depoimentos de clientes
10. **newsletter_subscribers** - Inscritos na newsletter
11. **store_settings** - Configurações da loja

#### Storage Buckets
- **product-images** - Imagens de produtos (público, 5MB)
- **kit-images** - Imagens de kits (público, 5MB)
- **category-images** - Imagens de categorias (público, 5MB)

### 🔐 Segurança
- ✅ RLS (Row Level Security) em todas as tabelas
- ✅ Leitura pública de produtos/kits/categorias
- ✅ Clientes veem apenas seus dados (pedidos, endereços)
- ✅ Upload apenas com service_role (backend)
- ✅ Políticas de storage para leitura pública e delete restrito

---

## 🚀 Como Usar

### 1️⃣ Configurar Banco de Dados

```bash
# 1. Vá para Supabase Dashboard
# 2. Clique em "SQL Editor"
# 3. Copie todo conteúdo de: supabase/migrations/000_all_tables.sql
# 4. Cole e execute (Ctrl+Enter)
# 5. Aguarde conclusão (✓ verde)
```

Isso criará:
- ✅ 11 tabelas
- ✅ RLS policies
- ✅ Trigger de auto-create de perfil
- ✅ Dados iniciais (categorias, depoimentos, configurações)

### 2️⃣ Configurar Storage

```bash
# 1. No SQL Editor, copie: supabase/migrations/006_storage_rls_policies.sql
# 2. Cole e execute
# 3. Vá para "Storage" para verificar os 3 buckets
```

### 3️⃣ Testar Upload

```bash
# 1. Inicie dev server
npm run dev

# 2. Vá para http://localhost:3000/admin/produtos/novo

# 3. Preencha:
# - Nome: "Peito de Frango"
# - Descrição: "Peito fresco"
# - Preço: 25.00
# - Upload imagem PNG/JPG (até 5MB)

# 4. Clique "Criar Produto"

# 5. Verifique em http://localhost:3000/admin/produtos
```

---

## 📋 Estrutura de Arquivos

```
app/admin/
├── produtos/
│   ├── page.tsx ✓ (listagem)
│   ├── novo/
│   │   └── page.tsx ✨ NOVO (criar com upload)
│   └── [id]/
│       └── page.tsx ✨ NOVO (editar com upload)
└── kits/
    ├── page.tsx ✓ (listagem)
    ├── novo/
    │   └── page.tsx ✨ NOVO (criar com upload)
    └── [id]/
        └── page.tsx ✨ NOVO (editar com upload)

components/admin/
└── image-upload.tsx ✨ NOVO (componente reutilizável)

supabase/migrations/
├── 000_all_tables.sql (150 linhas - tabelas + RLS)
├── 001_customers.sql
├── 002_customer_addresses.sql
├── 003_customer_favorites.sql
├── 004_store_settings.sql
├── 005_seed_products_kits.sql
└── 006_storage_rls_policies.sql (61 linhas - políticas storage)
```

---

## 🎯 Guias Disponíveis

| Documento | Para Quem | Tempo |
|-----------|-----------|-------|
| **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** | Todos | 2 min |
| **[MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)** | Desenvolvedores | 10 min |
| **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** | Admins/Gerentes | 5 min |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | Arquitetos | 20 min |
| **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** | Project Managers | 30 min |

---

## 💻 Fluxo de Adição de Produto

```
Admin clica em "Novo Produto"
        ↓
Preenche formulário (nome, preço, etc)
        ↓
Faz drag & drop de imagem PNG/JPG
        ↓
Imagem é validada (tipo + tamanho 5MB)
        ↓
Preview aparece para confirmação
        ↓
Admin clica "Criar Produto"
        ↓
Imagem é uploadada para bucket (product-images)
        ↓
Produto é salvo no banco com URL da imagem
        ↓
Redirecionado para /admin/produtos
        ↓
Produto aparece na listagem com imagem
```

---

## 🎨 Tipos de Arquivo Suportados

| Tipo | Tamanho Máx | Recomendação |
|------|------------|-------------|
| PNG | 5 MB | ✅ Recomendado (fundo transparente) |
| JPG | 5 MB | ✅ Excelente qualidade |
| WebP | 5 MB | ✅ Moderno |
| GIF | 5 MB | ⚠️ Usar raramente |

**Dica**: Use PNG com fundo transparente para melhor visualização!

---

## ✅ Checklist Rápido

### Antes de Usar
- [ ] Supabase criado e projeto ativo
- [ ] Variáveis de ambiente configuradas
- [ ] `.env.local` com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] `npm install` executado

### Primeiro Setup
- [ ] Executar 000_all_tables.sql
- [ ] Executar 006_storage_rls_policies.sql
- [ ] Verificar 3 buckets em Storage
- [ ] Verificar 11 tabelas em Database

### Testar
- [ ] Ir para /admin/produtos/novo
- [ ] Criar produto com imagem
- [ ] Ver em /admin/produtos
- [ ] Editar produto
- [ ] Deletar produto

### Produção
- [ ] Adicionar categorias
- [ ] Adicionar 5+ produtos com imagens
- [ ] Adicionar 3+ kits com imagens
- [ ] Testar checkout (se implementado)
- [ ] Deploy no Vercel

---

## 🔧 Variáveis de Ambiente

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Não exponha a `service_role` key! Use sempre `anon` key no frontend.**

---

## 🐛 Troubleshooting

### Erro: "Cannot find product-images bucket"
**Solução**: Execute 006_storage_rls_policies.sql no SQL Editor

### Erro: "Failed to upload image"
**Solução**:
1. Verifique se o arquivo é PNG/JPG/WebP
2. Verifique se tem menos de 5MB
3. Verifique se o bucket é público
4. Teste com arquivo diferente

### Produto não aparece na listagem
**Solução**:
1. Recarregue a página (F5)
2. Verifique se `is_active` está marcado
3. Verifique se está na categoria correta
4. Verifique se o banco recebeu os dados (Supabase Dashboard)

### Imagem quebrada no admin
**Solução**:
1. Verifique se tem imagem_url no banco
2. Copie a URL do Supabase Storage
3. Cole em novo browser tab para testar
4. Verifique se o bucket é público

---

## 📊 Dados Iniciais (Seed)

A migração cria automaticamente:

```sql
-- 4 Categorias
- Frango Inteiro
- Cortes  
- Miúdos
- Kits

-- 3 Depoimentos
- Maria Silva (5 estrelas)
- João Santos (5 estrelas)
- Ana Oliveira (5 estrelas)

-- 10 Configurações
- Nome, telefone, email, endereço, etc
```

---

## 🚀 Próximas Melhorias

- [ ] Gerenciar categorias (novo/editar)
- [ ] Atualizar status de pedidos
- [ ] CRUD de configurações
- [ ] Paginação em listagens
- [ ] Busca em tempo real
- [ ] Bulk actions (deletar vários)
- [ ] Compressão automática de imagens
- [ ] Notificações por email
- [ ] Dashboard com gráficos
- [ ] Integração WhatsApp

---

## 📞 Suporte

Dúvidas frequentes? Veja:
- **Como usar admin?** → Leia [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)
- **Como fazer setup?** → Leia [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)
- **Qual a arquitetura?** → Leia [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Índice geral?** → Leia [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## 📈 Estatísticas

| Métrica | Quantidade |
|---------|-----------|
| Arquivos criados | 11 |
| Linhas de código | 2000+ |
| Páginas do admin | 4 novas |
| Componentes | 1 novo |
| Tabelas de banco | 11 |
| Storage buckets | 3 |
| Migrations SQL | 7 |
| Documentação | 5 arquivos |

---

## 🎓 Stack Técnico

- **Frontend**: Next.js 16 (App Router)
- **Estilo**: Tailwind CSS + shadcn/ui
- **Banco**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Autenticação**: Supabase Auth
- **ORM**: Nenhum (queries diretas com @supabase/supabase-js)
- **Ícones**: Lucide Icons

---

## 📄 Licença

Projeto privado para Frango Forte Canoa

---

## 🎉 Pronto para Começar?

```bash
# 1. Configurar banco de dados
# Vá para MIGRATIONS_GUIDE.md

# 2. Testar painel admin
# Vá para ADMIN_GUIDE.md

# 3. Entender a arquitetura
# Vá para IMPLEMENTATION_SUMMARY.md

# 4. Usar o checklist
# Vá para SETUP_CHECKLIST.md
```

**Boa sorte! 🚀**

---

**Última atualização**: 2026-05-04  
**Versão**: 1.0.0  
**Status**: ✅ Produção Pronta
