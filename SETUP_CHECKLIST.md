# Checklist de Configuração - Frango Forte Canoa

## ✅ Fase 1: Configuração Inicial

### Supabase
- [ ] Criar conta em [supabase.com](https://supabase.com)
- [ ] Criar novo projeto
- [ ] Copiar URL do projeto
- [ ] Copiar Anon Key (públicakey)
- [ ] Adicionar em `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=sua_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
  ```
- [ ] Verificar se as tabelas foram criadas corretamente
- [ ] Testar conexão com o banco

### Stripe
- [ ] Criar conta em [stripe.com](https://stripe.com)
- [ ] Ativar PIX nas configurações
- [ ] Copiar chave pública (pk_live_...)
- [ ] Copiar chave secreta (sk_live_...)
- [ ] Adicionar em `.env.local`:
  ```
  STRIPE_PUBLIC_KEY=pk_live_...
  STRIPE_SECRET_KEY=sk_live_...
  ```
- [ ] Testar pagamento em modo teste (use `4242 4242 4242 4242`)

### Variáveis de Ambiente
- [ ] Copiar `.env.example` para `.env.local`
- [ ] Preencher todas as variáveis obrigatórias
- [ ] Verificar se não há erros de autenticação

---

## ✅ Fase 2: Instalação Local

### Projeto
- [ ] Clonar repositório
- [ ] Rodar `pnpm install`
- [ ] Rodar `pnpm dev`
- [ ] Abrir em `http://localhost:3000`

### Testes Básicos
- [ ] Página inicial carrega corretamente
- [ ] Logo aparece sem fundo preto
- [ ] Hero section mostra imagem tropical
- [ ] Grid de produtos aparece
- [ ] Kits aparecem com imagens
- [ ] Footer tem informações corretas

---

## ✅ Fase 3: Testes de Funcionalidade

### Carrinho
- [ ] Adicionar produto ao carrinho
- [ ] Quantidade aumenta corretamente
- [ ] Remover item do carrinho funciona
- [ ] Total é calculado corretamente
- [ ] Contador no header atualiza

### Checkout
- [ ] Preenchimento de dados funciona
- [ ] Validação de campos obrigatórios
- [ ] Entrega vs Retirada alterna corretamente
- [ ] Taxa de entrega aparece quando entrega
- [ ] Formas de pagamento podem ser selecionadas

### WhatsApp
- [ ] Botão "FAÇA SEU PEDIDO" no hero funciona
- [ ] Clique abre WhatsApp Web/App
- [ ] Mensagem pré-preenchida corretamente
- [ ] Botão de envio no checkout funciona
- [ ] Dados do pedido aparecem na mensagem

### PIX
- [ ] Seleção de PIX no checkout funciona
- [ ] Modal de pagamento PIX aparece
- [ ] Código PIX pode ser copiado
- [ ] QR code é exibido
- [ ] Botão de confirmação funciona

---

## ✅ Fase 4: Painel Administrativo

### Acesso
- [x] Criar usuário admin no Supabase
- [x] Fazer login com admin
- [x] Acessar `/admin`
- [x] Dashboard aparece corretamente

### Produtos
- [x] Ver lista de produtos
- [x] Adicionar novo produto (com upload de imagem)
- [x] Editar produto existente (com upload de imagem)
- [x] Deletar produto
- [x] Ativar/desativar produto
- [x] Imagens carregam corretamente
- [x] Upload no bucket `product-images`

### Pedidos
- [x] Ver lista de pedidos
- [ ] Filtrar por status (em progresso)
- [ ] Alterar status de pedido (em progresso)
- [x] Ver detalhes do pedido
- [x] Dados do cliente aparecem

### Kits
- [x] Ver lista de kits
- [x] Adicionar novo kit (com upload de imagem)
- [x] Editar kit (com upload de imagem)
- [x] Deletar kit
- [x] Imagens carregam
- [x] Upload no bucket `kit-images`

### Configurações
- [x] Ver todas as configurações
- [ ] Editar WhatsApp (em progresso)
- [ ] Editar Instagram (em progresso)
- [ ] Editar email (em progresso)
- [ ] Editar endereço (em progresso)
- [ ] Editar horários (em progresso)

### Categorias (Pendente)
- [ ] Ver lista de categorias
- [ ] Adicionar nova categoria
- [ ] Editar categoria
- [ ] Deletar categoria
- [ ] Upload de imagem

---

## ✅ Fase 5: Responsividade

### Mobile (iPhone/Android)
- [ ] Header se ajusta ao mobile
- [ ] Menu hamburger aparece
- [ ] Hero section é legível
- [ ] Produtos em grid 1 coluna
- [ ] Botões são grandes (touch-friendly)
- [ ] Checkout é utilizável

### Tablet
- [ ] Layout em 2 colunas
- [ ] Imagens mantêm proporção
- [ ] Navegação visível
- [ ] Checkout em 1 coluna

### Desktop
- [ ] Layout completo
- [ ] Hoverers funcionam
- [ ] Navegação completa
- [ ] Sidebar do admin funciona

---

## ✅ Fase 6: SEO & Performance

### Meta Tags
- [ ] Title: "Frango Forte Canoa - Frango Fresco em Canoa Quebrada"
- [ ] Description: "Compre frango fresco abatido na hora. Entrega rápida em Canoa Quebrada e região. 100% natural, sem conservantes."
- [ ] OG Image: Logo ou hero image
- [ ] Favicon: Logo redonda

### Performance
- [ ] Imagens otimizadas (WebP)
- [ ] Lazy loading de imagens
- [ ] Cache de assets estáticos
- [ ] Minificação de CSS/JS

### Acessibilidade
- [ ] Alt text em todas as imagens
- [ ] Contraste de cores (WCAG AA)
- [ ] Navegação por teclado funciona
- [ ] Screen readers funcionam

---

## ✅ Fase 7: Conteúdo

### Produtos
- [ ] 5+ produtos adicionados
- [ ] Descrições detalhadas
- [ ] Preços corretos
- [ ] Imagens de qualidade
- [ ] Stock atualizado

### Kits
- [ ] 3 kits criados
- [ ] Preços com desconto
- [ ] Conteúdo descrito
- [ ] Imagens atratativas

### Depoimentos
- [ ] 5+ depoimentos cadastrados
- [ ] Clientes reais
- [ ] Classificações 5 estrelas

### Informações da Loja
- [ ] WhatsApp correto: (88) 99612-5274
- [ ] Email correto
- [ ] Endereço: Canoa Quebrada, Aracati/CE
- [ ] Horário de funcionamento
- [ ] Redes sociais

---

## ✅ Fase 8: Segurança & Testes

### Supabase RLS
- [ ] Público acesso a produtos/kits
- [ ] Clientes veem apenas seus dados
- [ ] Admins gerenciam tudo

### Testes de Segurança
- [ ] Não há dados sensíveis em URLs
- [ ] Variáveis secretas em .env
- [ ] HTTPS em produção
- [ ] Cookies HTTP-only

### Testes de Fluxo
- [ ] Cliente novo: Sign up → Compra → Checkout
- [ ] Cliente retorno: Login → Compra → Checkout
- [ ] Admin: Login → Gerencia → Atualiza

---

## ✅ Fase 9: Deploy

### Vercel
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente
- [ ] Deploy automático ativado
- [ ] Domínio customizado (opcional)
- [ ] SSL automático

### DNS (Opcional)
- [ ] Registrar domínio `.com.br`
- [ ] Apontar para Vercel
- [ ] Email customizado (opcional)

### Monitoramento
- [ ] Vercel Analytics configurado
- [ ] Logs de erro monitorados
- [ ] Uptime monitorado

---

## ✅ Fase 10: Pós-Lançamento

### Marketing
- [ ] Instagram atualizado
- [ ] WhatsApp Business configurado
- [ ] Catálogo WhatsApp criado
- [ ] Promoções planejadas

### Suporte
- [ ] Plano de atendimento
- [ ] Resposta rápida no WhatsApp
- [ ] FAQ preparado
- [ ] Documentação de produtos

### Manutenção
- [ ] Backup diário do banco
- [ ] Monitoramento de performance
- [ ] Updates de segurança
- [ ] Novas funcionalidades planejadas

---

## 📞 Contato de Suporte

Caso tenha dúvidas durante a configuração:

- **WhatsApp**: (88) 99612-5274
- **Email**: contato@frangofortecanoa.com.br
- **Instagram**: @frangofortecanoa

---

## 🎉 Parabéns!

Quando todos os itens estiverem checados, sua loja estará **100% funcional** e pronta para vender!

**Sucesso! 🚀**
