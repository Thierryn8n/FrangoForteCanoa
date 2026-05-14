# Frango Forte Canoa - E-commerce de Frango Fresco

Uma loja online moderna, rápida e responsiva para venda de frango fresco da região de Canoa Quebrada (Ceará), com painel administrativo CRM integrado.

## 🚀 Características Principais

- **Homepage Persuasiva**: Design moderno com hero section tropical inspirado em Canoa Quebrada
- **Catálogo de Produtos**: Frango inteiro, cortes nobres, asas, coxinhas e miúdos
- **Kits Promocionais**: Pacotes econômicos com desconto para maior ticket médio
- **Carrinho de Compras**: Gerenciamento intuitivo de itens
- **Checkout Rápido**: Integração com WhatsApp para pedidos simples e diretos
- **Pagamento PIX**: Integração com Stripe para pagamentos via PIX
- **Painel CRM Administrativo**: Gerencia produtos, pedidos, kits e configurações
- **Responsivo**: Mobile-first, otimizado para todos os dispositivos
- **Autenticação Segura**: Integrada com Supabase Auth

## 📋 Requisitos

- Node.js 18+
- pnpm ou npm
- Conta Supabase
- Conta Stripe (para PIX)

## 🔧 Instalação

```bash
# Clone o repositório
git clone <seu-repo>
cd frango-forte-canoa

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env.local

# Atualize .env.local com suas credenciais:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - STRIPE_PUBLIC_KEY
# - STRIPE_SECRET_KEY

# Rode o servidor de desenvolvimento
pnpm dev
```

## 📁 Estrutura do Projeto

```
├── app/
│   ├── (store)/           # Loja pública
│   │   ├── page.tsx       # Homepage
│   │   ├── checkout/      # Página de checkout
│   │   └── layout.tsx
│   ├── admin/             # Painel administrativo
│   │   ├── page.tsx       # Dashboard
│   │   ├── produtos/      # Gerenciar produtos
│   │   ├── pedidos/       # Gerenciar pedidos
│   │   ├── kits/          # Gerenciar kits
│   │   └── configuracoes/ # Configurações da loja
│   ├── api/               # APIs
│   │   └── stripe/        # Endpoints de pagamento
│   └── layout.tsx
├── components/
│   ├── store/             # Componentes da loja
│   └── admin/             # Componentes do admin
├── contexts/
│   └── cart-context.tsx   # Context do carrinho
├── lib/
│   ├── supabase/          # Cliente Supabase
│   └── types.ts           # Tipos TypeScript
└── public/                # Assets estáticos
```

## 🛍️ Como Usar

### Para Clientes

1. **Navegue pela loja**: Veja produtos, kits e ofertas
2. **Adicione ao carrinho**: Clique nos produtos desejados
3. **Checkout**: Revise seu pedido e dados de entrega
4. **Pagamento**: Escolha entre PIX, WhatsApp ou outras formas
5. **Confirmação**: Receba confirmação do pedido

### Para Administradores

1. **Acesse o painel**: `/admin`
2. **Dashboard**: Visão geral de vendas e pedidos
3. **Gerenciar Produtos**: CRUD de produtos
4. **Gerenciar Pedidos**: Acompanhe status e entrega
5. **Gerenciar Kits**: Crie promoções e pacotes
6. **Configurações**: Atualize dados da loja

## 💳 Integração com Stripe PIX

Para aceitar PIX:

1. Crie conta em [stripe.com](https://stripe.com)
2. Ative PIX nas configurações de pagamento
3. Copie sua chave pública e secreta
4. Configure em `.env.local`:
   ```
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
5. PIX estará disponível no checkout

## 🗄️ Banco de Dados

O projeto usa Supabase PostgreSQL com as seguintes tabelas principais:

- **products**: Catálogo de produtos
- **kits**: Pacotes promocionais
- **orders**: Pedidos dos clientes
- **customers**: Dados de clientes
- **admins**: Gerenciadores da loja

Todas as tabelas possuem RLS (Row Level Security) para segurança.

## 🎨 Cores da Marca

- **Laranja Principal**: #FF6600
- **Amarelo Ouro**: #FFD700
- **Branco**: #FFFFFF
- **Cinza Escuro**: #333333

## 📱 Responsividade

- **Mobile**: 320px+
- **Tablet**: 768px+
- **Desktop**: 1024px+
- **Wide**: 1280px+

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco
- Variáveis sensíveis em `.env.local`
- Validação de entrada em formulários
- HTTPS em produção

## 📞 Contato WhatsApp

O número de WhatsApp é configurável em:
- `.env.local`: `NEXT_PUBLIC_WHATSAPP_NUMBER`
- Admin: Configurações

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Conecte seu repositório no Vercel
vercel deploy

# Configure variáveis de ambiente no Vercel Dashboard
```

### Outros Serviços

Compatible com qualquer serviço que suporte Next.js 16+.

## 📚 Documentação

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/docs)
- [Stripe Payments](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)

## 📝 Licença

MIT - Use livremente!

## 🤝 Contribuições

Contribuições são bem-vindas! Entre em contato via WhatsApp para maiores informações.

---

**Desenvolvido com ❤️ para Frango Forte Canoa**
