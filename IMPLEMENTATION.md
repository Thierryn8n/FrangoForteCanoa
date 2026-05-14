# Frango Forte Canoa - Guia de Implementação

## ✅ O que foi desenvolvido

Desenvolvemos uma loja online **IDÊNTICA** às imagens fornecidas com todos os recursos necessários para vender frango fresco online com um painel administrativo completo.

---

## 🏪 LOJA E-COMMERCE

### 1. Homepage (`/`)
- **Header**: 
  - Barra laranja superior com informações de entrega e atendimento
  - Logo Frango Forte sem fundo preto (nova logo gerada)
  - Navegação completa (Início, Produtos, Kits e Ofertas, Quem Somos, Dúvidas, Contato)
  - Barra de busca integrada
  - Ícones de usuário, favoritos e carrinho
  - Menu mobile responsivo

- **Hero Section**: 
  - Fundo com imagem tropical de pôr do sol de Canoa Quebrada
  - Texto em branco e amarelo: "FRANGO ABATIDO NA HORA MAIS FRESCO, MAIS SAUDÁVEL, MAIS SABOROSO!"
  - CTA "FAÇA SEU PEDIDO" em branco com link WhatsApp
  - Badges com diferenciais (100% Fresco, Sem Conservantes, Entrega Rápida)
  - Imagem de frango em travessa de madeira

- **Grid de Produtos**: 
  - 5 produtos principais (Frango Inteiro, Coxa e Sobrecoxa, Peito, Asa, Miúdo)
  - Cards com imagem, nome, descrição, preço
  - Botões + e - para quantidade
  - Botão "Adicionar ao Carrinho" em laranja

- **Seção de Kits**: 
  - Fundo laranja com padrão diagonal
  - 3 kits promocionais (Família, Econômico, Churrasco)
  - Imagens dos kits em embalagens realistas
  - Preços com desconto destacados em amarelo
  - CTA "VER KITS E OFERTAS"

- **Seção de Depoimentos**: 
  - Carrossel de 5 depoimentos de clientes
  - Classificação em estrelas (5 estrelas)
  - Navegação com pontos (dots)

- **Footer**: 
  - Newsletter (cadastrar e-mail)
  - Links institucionais
  - Redes sociais (WhatsApp, Instagram, Facebook)
  - Endereço: Canoa Quebrada, Aracati/CE
  - Copyright

### 2. Página de Carrinho (`/checkout`)
- Resumo de itens do carrinho com imagens
- Formulário com dados do cliente (nome, telefone, email)
- Opção de entrega ou retirada no local
- Tipo de pagamento (PIX, Dinheiro, Cartão, Transferência)
- Campo de observações
- Resumo de preços (subtotal, taxa entrega, total)
- Botão de envio para WhatsApp
- Integração com PIX via Stripe

---

## 🛠️ PAINEL ADMINISTRATIVO CRM

### Acesso
- URL: `/admin`
- Autenticação obrigatória
- Função de admin verificada no banco

### 1. Dashboard (`/admin`)
- Métricas principais:
  - Total de vendas (mês/ano)
  - Número de pedidos
  - Clientes ativos
  - Ticket médio
- Gráficos de vendas
- Últimos pedidos
- Produtos mais vendidos

### 2. Gerenciar Produtos (`/admin/produtos`)
- Tabela com todos os produtos
- Colunas: Nome, Preço, Categoria, Stock, Status
- Botões: Editar, Deletar, Ativar/Desativar
- Formulário para adicionar novo produto
- Campos: Nome, Descrição, Preço, Categoria, Imagem, Stock

### 3. Gerenciar Pedidos (`/admin/pedidos`)
- Tabela com todos os pedidos
- Colunas: ID, Cliente, Total, Status, Data
- Status: Pendente, Confirmado, Em Entrega, Entregue, Cancelado
- Botões para alterar status
- Filtros por data e status
- Detalhes do pedido ao clicar

### 4. Gerenciar Kits (`/admin/kits`)
- Tabela de kits promocionais
- Campos: Nome, Preço, Conteúdo, Status
- Criar/editar/deletar kits
- Ativar/desativar promoções

### 5. Configurações (`/admin/configuracoes`)
- WhatsApp: (88) 99612-5274
- Instagram: @frangofortecanoa
- Email: contato@frangofortecanoa.com.br
- Endereço: Canoa Quebrada, Aracati/CE
- Taxa de entrega: R$ 5,00
- Pedido mínimo: R$ 30,00
- Horário de funcionamento

---

## 🗄️ BANCO DE DADOS (Supabase)

### Tabelas criadas

1. **categories**
   - id, name, slug, description, image_url, is_active, display_order

2. **products**
   - id, name, slug, description, price, original_price, unit
   - image_url, category_id, is_active, is_featured, stock_quantity

3. **kits**
   - id, name, slug, description, price, original_price
   - image_url, contents, is_active, is_featured

4. **customers**
   - id (FK auth.users), full_name, email, phone, cpf
   - address, neighborhood, city, state, zip_code

5. **orders**
   - id, customer_id, customer_name, customer_phone, email
   - delivery_address, subtotal, delivery_fee, total, payment_method, status

6. **order_items**
   - id, order_id (FK), product_id (FK), quantity, unit_price, total_price

7. **testimonials**
   - id, customer_name, content, rating, is_active

8. **newsletter_subscribers**
   - id, email, is_active

9. **store_settings**
   - id, key, value (para configurações da loja)

10. **admins**
    - id (FK auth.users), email, full_name, role

### Row Level Security (RLS)
- Público: leitura de produtos, kits, categorias, depoimentos
- Clientes: apenas seus próprios dados
- Admins: acesso completo para gerenciar

---

## 💳 INTEGRAÇÃO COM STRIPE PIX

### Configuração
```
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### Endpoints criados

1. **POST /api/stripe/checkout**
   - Cria sessão de checkout
   - Retorna session ID para redirecionamento

2. **POST /api/stripe/pix**
   - Cria intent de pagamento para PIX
   - Retorna clientSecret e QR code

3. **PUT /api/stripe/pix**
   - Webhook para confirmar pagamento
   - Atualiza status do pedido

### Fluxo PIX
1. Cliente seleciona PIX no checkout
2. Sistema gera código PIX + QR code
3. Cliente copia código ou scaneia QR
4. Realiza transferência no banco
5. Sistema recebe confirmação automaticamente
6. Pedido é atualizado para confirmado

---

## 📱 RESPONSIVIDADE

### Mobile-First Design
- **Mobile (< 768px)**:
  - Menu hambúrguer
  - Layout single column
  - Botões grandes (touchable)
  - Texto legível

- **Tablet (768px - 1024px)**:
  - Grid 2 colunas
  - Menu visível
  - Imagens otimizadas

- **Desktop (> 1024px)**:
  - Grid 3+ colunas
  - Menu completo
  - Imagens em alta resolução
  - Hover effects

---

## 🎨 DESIGN & CORES

### Paleta de Cores
- **Laranja Primário**: #FF6600
- **Amarelo Ouro**: #FFD700
- **Branco**: #FFFFFF
- **Cinza Escuro**: #333333
- **Cinza Claro**: #F5F5F5

### Typography
- **Font**: Geist (sem-serif)
- **Títulos**: Bold, 24px - 48px
- **Corpo**: Regular, 14px - 16px
- **Pequeno**: 12px - 13px

### Imagens Geradas
- `/public/logo.png` - Logo sem fundo preto
- `/public/hero-chicken.png` - Frango hero section
- `/public/canoa-sunset.jpg` - Fundo pôr do sol
- `/public/frango-inteiro.jpg` - Produto 1
- `/public/coxa-sobrecoxa.jpg` - Produto 2
- `/public/peito-frango.jpg` - Produto 3
- `/public/asa-frango.jpg` - Produto 4
- `/public/miudo-frango.jpg` - Produto 5
- `/public/kit-familia.jpg` - Kit 1
- `/public/kit-economico.jpg` - Kit 2
- `/public/kit-churrasco.jpg` - Kit 3

---

## 🔐 AUTENTICAÇÃO & SEGURANÇA

### Supabase Auth
- Registro e login via email/senha
- Perfis de usuário (cliente, admin)
- Session cookies (HTTP-only)
- Token refresh automático

### Segurança
- RLS em todas as tabelas
- Validação de entrada
- HTTPS em produção
- CSRF protection
- Variáveis sensíveis em .env

---

## 📊 CONTEXTO E HOOKS

### CartContext
- `items`: array de itens do carrinho
- `subtotal`: soma dos produtos
- `deliveryFee`: taxa de entrega (R$ 5)
- `total`: subtotal + taxa
- `addItem()`: adicionar ao carrinho
- `removeItem()`: remover do carrinho
- `updateQuantity()`: alterar quantidade
- `clearCart()`: limpar carrinho

### Custom Hooks
- `useCart()`: acesso ao contexto do carrinho
- `useAuth()`: acesso aos dados do usuário

---

## 📦 DEPENDÊNCIAS PRINCIPAIS

```json
{
  "next": "16.x",
  "react": "19.x",
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.x",
  "stripe": "^15.x",
  "@stripe/stripe-js": "^3.x",
  "tailwindcss": "^4.x",
  "lucide-react": "latest"
}
```

---

## 🚀 PRÓXIMOS PASSOS

### Para colocar em produção:

1. **Configurar Supabase**
   - Criar projeto em supabase.com
   - Copiar URL e chaves
   - Colocar em .env.local

2. **Configurar Stripe**
   - Criar conta em stripe.com
   - Ativar PIX
   - Copiar chaves públicas/secretas
   - Colocar em .env.local

3. **Deploy no Vercel**
   - Conectar repositório
   - Configurar variáveis de ambiente
   - Deploy automático

4. **Testes**
   - Testar produtos e carrinho
   - Testar checkout WhatsApp
   - Testar pagamento PIX (modo teste)
   - Testar painel admin

5. **Customização**
   - Adicionar seus produtos reais
   - Configurar horários de funcionamento
   - Adicionar depoimentos reais
   - Ajustar preços e taxas

---

## 📞 SUPORTE

- **WhatsApp**: (88) 99612-5274
- **Email**: contato@frangofortecanoa.com.br
- **Instagram**: @frangofortecanoa

---

**Desenvolvido com sucesso! Parabéns pela nova loja!** 🎉
