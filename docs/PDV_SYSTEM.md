# Sistema PDV/Caixa - Documentação Completa

## 📋 Visão Geral

Sistema completo de Point of Sale (PDV) com:
- **Página `/caixa`** - Interface de vendas com grid de produtos, carrinho lateral, voice input
- **Gestão de Produtos** - CRUD com upload de múltiplas imagens
- **Checkout** - Múltiplas formas de pagamento (dinheiro, crédito, débito, PIX)
- **Print Agent** - Sistema de impressão em tempo real para impressora térmica 80mm
- **Voice Commands** - Adicionar itens via comando de voz em português

---

## 📁 Estrutura de Arquivos

```
/app
  /caixa                          # Página do PDV
    page.tsx
  /api
    /print-jobs
      route.ts                    # API para gerenciar jobs de impressão

/components
  /pdv
    voice-input.tsx              # Componente de entrada por voz
    product-grid.tsx             # Grid de produtos com filtros
    cart-sidebar.tsx             # Carrinho lateral
    checkout.tsx                 # Modal de checkout
    receipt.tsx                  # Componente de recibo

/lib
  types.ts                        # Tipos TypeScript (adicionar ao existente)
  hooks.ts                        # Hooks React SWR
  voice-processor.ts             # Lógica de processamento de voz
  print-agent.ts                 # Lógica de formatação de recibos
  actions/
    pdv.ts                       # Server actions

/supabase
  /migrations
    001_pdv_caixa_system.sql    # Criação de tabelas

/docs
  PRINT_AGENT_SETUP.md          # Guia de setup do Print Agent
  PDV_SYSTEM.md                 # Este arquivo
```

---

## 🗄️ Banco de Dados

### Tabelas Criadas

#### `products`
Produtos da loja
```sql
- id (UUID)
- name (VARCHAR)
- price_per_kg (DECIMAL)
- category_id (UUID FK)
- image_url (VARCHAR)
- product_kind ('regular' | 'audio')
- requires_album_cover (BOOLEAN)
- is_active (BOOLEAN)
```

#### `product_images`
Imagens de produtos
```sql
- id (UUID)
- product_id (UUID FK)
- image_url (VARCHAR)
- image_variants (JSONB)
- is_primary (BOOLEAN)
- sort_order (INTEGER)
```

#### `categories`
Categorias de produtos
```sql
- id (UUID)
- name (VARCHAR)
- icon (VARCHAR)
- color (VARCHAR)
```

#### `orders` (PDV)
Pedidos do caixa
```sql
- id (UUID)
- order_number (BIGSERIAL)
- customer_name (VARCHAR)
- customer_phone (VARCHAR)
- subtotal (DECIMAL)
- discount (DECIMAL)
- total (DECIMAL)
- payment_method ('money'|'credit'|'debit'|'pix')
- status ('pending'|'completed'|'cancelled')
- created_at (TIMESTAMP)
```

#### `order_items` (PDV)
Itens do pedido
```sql
- id (UUID)
- order_id (UUID FK)
- product_id (UUID FK)
- product_name (VARCHAR)
- weight_kg (DECIMAL)
- price_per_kg (DECIMAL)
- total_price (DECIMAL)
```

#### `print_jobs`
Fila de impressão
```sql
- id (UUID)
- source_channel ('pos'|'online')
- source_order_id (UUID FK)
- status ('queued'|'processing'|'completed'|'failed')
- payload (JSONB)
- html_content (TEXT)
- text_content (TEXT)
- created_at (TIMESTAMP)
- printed_at (TIMESTAMP)
```

#### `store_settings`
Configurações da loja
```sql
- id (UUID)
- store_name (VARCHAR)
- cnpj (VARCHAR)
- address (TEXT)
- phone (VARCHAR)
- logo_url (VARCHAR)
- payment_settings (JSONB)
- shipping_settings (JSONB)
- general_settings (JSONB)
```

---

## 🎯 Fluxo de Vendas

### 1. Produto → Carrinho
```
Usuário clica no produto
  ↓
Modal de peso abre
  ↓
Define peso e clica "Adicionar ao Carrinho"
  ↓
Item adicionado (ou quantidade atualizada se produto já existe)
  ↓
Toast de confirmação
```

### 2. Carrinho → Checkout
```
Usuário clica "Ir para Checkout"
  ↓
Modal de checkout abre
  ↓
Preenche dados do cliente (opcional)
  ↓
Seleciona forma de pagamento
  ↓
Clica "Finalizar"
```

### 3. Checkout → Recibo
```
Pedido criado no banco
  ↓
PrintJob inserido automaticamente
  ↓
Recibo exibido
  ↓
Usuário clica "Imprimir"
  ↓
Print Agent processa (se Electron rodando)
  ↓
Impressora térmica imprime
```

---

## 🎙️ Voice Input (Comando de Voz)

### Exemplos de Comandos
```
"1 quilo de coxa e sobrecoxa"           → 1kg Coxa e Sobrecoxa
"500 gramas de peito"                   → 0.5kg Peito
"2 quilos de asa"                       → 2kg Asa
"meio quilo de filé de peito"          → 0.5kg Filé de Peito
"1.5 kg coxa"                           → 1.5kg Coxa
```

### Processamento
1. **Parse**: Extrair quantidade e unidade
   - Padrão: `{número} {unidade} de {produto}`
   - Converter gramas para kg (÷1000)
   - Meio/meia = 0.5

2. **Match**: Buscar produto similar
   - Fuzzy matching com score >= 60%
   - Se score >= 70% → adicionar
   - Se score < 70% → mostrar sugestões

3. **Feedback**: Toast de confirmação

### Arquivo Principal
`lib/voice-processor.ts`
- `parseVoiceCommand()` - Parse do transcript
- `findClosestProduct()` - Fuzzy matching
- `calculateSimilarity()` - Levenshtein distance

---

## 🖨️ Print Agent (Impressora Térmica)

### Arquitetura
```
Pedido criado (PDV)
  ↓
INSERT into print_jobs (status='queued')
  ↓
Print Agent (Electron) detecta
  ↓
Renderiza HTML invisível
  ↓
Envia para impressora térmica 80mm
  ↓
UPDATE print_jobs (status='completed')
```

### Formatos
- **HTML**: Layout formatado para impressora
- **Text**: Versão texto-puro como fallback

### Conteúdo do Recibo
```
┌─────────────────────────┐
│      LOGO E NOME        │
├─────────────────────────┤
│   Endereço e Telefone   │
├─────────────────────────┤
│ Pedido #123             │
│ 15/03/2025 14:30:45     │
├─────────────────────────┤
│ Cliente: João Silva     │
│ Tel: (11) 98765-4321    │
├─────────────────────────┤
│ ITENS                   │
│ Coxa 1.500kg            │
│ @R$25,00/kg R$37,50     │
│ Peito 0.750kg           │
│ @R$22,00/kg R$16,50     │
├─────────────────────────┤
│ SUBTOTAL      R$54,00   │
│ DESCONTO      -R$5,00   │
│ TOTAL         R$49,00   │
├─────────────────────────┤
│ Pagamento: DINHEIRO     │
├─────────────────────────┤
│      OBRIGADO!          │
│      Volte sempre       │
└─────────────────────────┘
```

### Setup
Ver arquivo `/docs/PRINT_AGENT_SETUP.md`

---

## 💾 Server Actions

### Produtos
```typescript
getProducts()                    // Lista produtos ativos
getProduct(id)                   // Um produto
createProduct(data)              // Criar
updateProduct(id, data)          // Atualizar
deleteProduct(id)                // Deletar
```

### Pedidos PDV
```typescript
createPdvOrder(order, items)    // Criar pedido + PrintJob
getPdvOrders()                   // Listar últimos 50
cancelPdvOrder(id)               // Cancelar
```

### Print Jobs
```typescript
createPrintJob(job)              // Criar job
getPrintJobs(status?)            // Listar
updatePrintJobStatus(id, status) // Atualizar status
```

### Configurações
```typescript
getStoreSettings()               // Buscar
updateStoreSettings(data)        // Atualizar
```

---

## 🎨 Componentes

### ProductGrid
- Grid responsivo (2 colunas mobile, 4 desktop)
- Busca por nome
- Filtro por categoria (tabs)
- Modal de peso
- Preview de preço em tempo real

### CartSidebar
- List slide-in
- Botões +/- para peso
- Remove item
- Subtotal
- Botão "Ir para Checkout"

### Checkout
- Dados do cliente (opcional)
- 4 formas de pagamento:
  - **Dinheiro**: calcula troco
  - **Crédito/Débito**: taxa configurável
  - **PIX**: QR code dinâmico
- Desconto (R$ ou %)

### VoiceInput
- Botão mic com animação
- Transcript em tempo real
- Sugestões de produtos
- Toast de feedback

### Receipt
- Formatado para 80mm
- HTML + Text
- Logo da loja
- Dados do cliente
- Itens, subtotal, total

---

## 🔗 Hooks React

```typescript
useProducts()              // Retorna products, isLoading, error
useCategories()            // Retorna categories
usePdvOrders()            // Retorna orders
usePrintJobs(status?)     // Retorna jobs filtrados
useStoreSettings()        // Retorna settings
```

---

## 📱 Página `/caixa`

### Layout
```
┌─────────────────────────────────────┐
│ Loja | Carrinho (N) [Button]        │
├─────────────────────────────────────┤
│ Voice Input Component               │
├─────────────────────────────────────┤
│                                     │
│  Product Grid (filtrado/categorizado)│
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Estados
- `cart` - Itens do carrinho
- `isCartOpen` - Mostrar/esconder sidebar
- `isCheckoutOpen` - Mostrar/esconder modal
- `isReceiptOpen` - Mostrar/esconder recibo
- `lastOrder` - Pedido finalizado
- `isProcessing` - Loading durante finalização

### Fluxo
1. Produtos carregam via `useProducts()`
2. Usuário clica em produto → `handleAddItem()`
3. Clica em "Ir para Checkout" → `setIsCheckoutOpen(true)`
4. Preenche formulário e confirma → `createPdvOrder()`
5. Recibo exibido → usuário clica "Imprimir"

---

## 🔐 Segurança

### RLS (Row Level Security)
Por implementar em `supabase/policies.sql`:
```sql
-- Apenas proprietário pode gerenciar produtos
-- Apenas caixa pode criar pedidos
-- Apenas admin pode ver relatórios
```

### Validações
- Peso > 0
- Total = subtotal - desconto
- Pagamento com dinheiro: moneyReceived >= total

---

## 📊 API Endpoints

### GET /api/print-jobs
Lista jobs de impressão
```
Query params:
- status: 'queued' | 'processing' | 'completed' | 'failed'

Response:
[
  {
    id: string,
    status: string,
    created_at: string,
    printed_at?: string
  }
]
```

### POST /api/print-jobs
Criar job
```
Body:
{
  source_channel: 'pos' | 'online',
  source_order_id: string,
  payload: object,
  html_content?: string,
  text_content?: string
}
```

### PATCH /api/print-jobs?id=...
Atualizar status
```
Body:
{
  status: 'completed' | 'failed',
}
```

---

## 🐛 Troubleshooting

### Carrinho não atualiza
- Verificar `useProducts()` hook
- Garantir que `onAddItem` chama `setCart()`

### Voice input não funciona
- Verificar browser (Chrome/Edge suportam)
- Ativar microfone na página
- Ver console para erros

### Print job fica em "queued"
- Print Agent não está rodando
- Verificar logs do Electron
- Testar impressora manualmente

### Produto não encontrado (voice)
- Fuzzy score < 60%
- Tentar comando mais específico
- Listar produtos similares

---

## 🚀 Próximos Passos

1. Testar migrações no Supabase
2. Configurar impressora térmica
3. Implementar RLS policies
4. Build do Print Agent (Electron)
5. Testes de carga
6. Deploy em produção
