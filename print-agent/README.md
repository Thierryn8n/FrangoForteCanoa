# FRANGO PRINT AGENT (COM INTERFACE)

Aplicativo local para Windows com painel de configuração, status e logs.

Ele escuta a tabela `print_jobs` em **tempo real** e imprime automaticamente sem clicar em botão.

## 🎯 Regras de Impressão

### **✅ O que é impresso:**
- **Apenas pedidos PIX pagos** são impressos automaticamente
- Pedidos com status `payment_method = 'pix'` E `payment_status = 'paid'`

### **❌ O que NÃO é impresso:**
- **Dinheiro, Cartão, Transferência** → Passam livres sem impressão
- **PIX não pago** → Aguarda pagamento, não imprime
- **PIX pendente** → Aguarda aprovação, não imprime

## 1. Configurar

Pelo painel do app, preencha:

```env
# Configurações obrigatórias
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY

# Configurações opcionais
PRINTER_NAME=Nome exato da impressora (opcional)
POLL_MS=5000
AGENT_ID=PRINT-AGENT-01

# Configurações de impressão (novas)
PRINT_ONLY_PAID_PIX=true
PRINT_TIMEOUT=30
```

### **📋 Descrição das Configurações:**
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase
- `PRINTER_NAME`: Nome da impressora (opcional, usa padrão se vazio)
- `POLL_MS`: Intervalo de verificação em milissegundos
- `AGENT_ID`: Identificador único do agente
- `PRINT_ONLY_PAID_PIX`: Apenas PIX pagos são impressos
- `PRINT_TIMEOUT`: Timeout de impressão em segundos

## 2. Rodar com interface (dev)

```bash
cd print-agent
npm install
npm start
```

## 3. Fluxo de Funcionamento

### **🖨️ Para PIX Pago:**
1. Cliente faz pedido com PIX
2. Admin aprova pagamento PIX
3. Admin arrasta pedido para status "printing"
4. Sistema cria job de impressão automaticamente
5. Print-agent detecta e imprime

### **📋 Para Outros Métodos:**
1. Cliente faz pedido (dinheiro, cartão, etc)
2. Admin confirma pedido
3. Admin arrasta para status "printing"
4. Sistema detecta método ≠ PIX
5. **Nenhum job criado** → pedido fica livre sem impressão

### **📄 Formato de Impressão:**
```
FRANGO FORTE PDV
COMPROVANTE DE PEDIDO
----------------------------------------
Pedido: #12345678
Data: 05/05/2026 22:30
Canal: ONLINE

CLIENTE
Nome: João da Silva
Telefone: (88) 99612-5274
Endereço: Rua 7 de Abril, 16 - Centro

ITENS
PEITO DE FRANGO - 2.500 x R$ 19.90 = R$ 49.75
COXA E SOBRECOXA - 1.200 x R$ 15.90 = R$ 19.08
----------------------------------------
Subtotal: R$ 68.83
Taxa Entrega: R$ 5.00
TOTAL: R$ 73.83

PAGAMENTO
Forma: PIX
Status: PAGO
----------------------------------------
OBS: Apenas pedidos PIX são impressos
Outros métodos já pagos não precisam de impressão
----------------------------------------
Documento não fiscal
Obrigado pela preferência!
```

## 4. Interface do Aplicativo

### **📊 Painel Principal:**
- **Status**: Conectado/Desconectado
- **Agente**: ID do agente ativo
- **Impressora**: Nome da impressora configurada
- **Jobs**: Contador de jobs processados

### **📋 Logs em Tempo Real:**
- Jobs criados
- Status de processamento
- Erros de impressão
- Timestamp detalhados

### **⚙️ Configurações:**
- URL do Supabase
- Chave de serviço
- Nome da impressora
- Intervalo de polling

## 5. Troubleshooting

### **🔧 Problemas Comuns:**

**❌ Não está imprimindo PIX:**
- Verifique se `payment_status = 'paid'`
- Verifique se `payment_method = 'pix'`
- Confira configuração `PRINT_ONLY_PAID_PIX=true`

**❌ Erro de conexão:**
- Verifique `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- Confira se o serviço Supabase está online

**❌ Impressora não encontrada:**
- Verifique `PRINTER_NAME` exato
- Deixe vazio para usar impressora padrão
- Confira se impressora está ligada

### **📞 Suporte:**
- Logs detalhados no aplicativo
- Status em tempo real dos jobs
- Interface amigável para diagnóstico

## 3. Gerar instalador `.exe` (setup)

```bash
cd print-agent
npm install
npm run build:exe
```

Saída (normalmente):

- `print-agent/dist/FRANGO PRINT AGENT Setup x.x.x.exe`

## 4. Como funciona

- Escuta `INSERT` em `public.print_jobs` via Supabase Realtime.
- Faz lock do job (`queued` -> `processing`) para evitar impressão duplicada.
- Imprime `text_content` automaticamente usando PowerShell `Out-Printer`.
- Atualiza status:
  - `done` quando imprime.
  - `error` quando falha (com mensagem).
- Também executa polling periódico como fallback.

## 5. Recomendação de produção

- Instalar via setup e colocar o app na inicialização do Windows.
- Definir impressora padrão dedicada para a térmica.
- Testar com pedidos de `caixa` e `online`.
