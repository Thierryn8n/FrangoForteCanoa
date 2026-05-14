/* eslint-disable no-console */
const { EventEmitter } = require('node:events');
const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { exec } = require('node:child_process');

function toPsSingleQuoted(value) {
  return String(value || '').replace(/'/g, "''");
}

function runPowerShell(command) {
  return new Promise((resolve, reject) => {
    exec(
      `powershell -NoProfile -NonInteractive -Command "${command}"`,
      { windowsHide: true, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

class PrintAgent extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      supabaseUrl: '',
      serviceRoleKey: '',
      printerName: '',
      pollMs: 5000,
      agentId: 'PRINT-AGENT-01',
      ...options,
    };
    this.running = false;
    this.supabase = null;
    this.realtimeChannel = null;
    this.reconnectTimer = null;
    this.pollTimer = null;
    this.processingOrders = new Set();
  }

  log(...args) {
    const message = args.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' ');
    this.emit('log', message);
  }

  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config,
      pollMs: Number(config.pollMs || this.config.pollMs || 5000),
    };
  }

  getStatus() {
    return {
      running: this.running,
      agentId: this.config.agentId,
      printerName: this.config.printerName || '(padrao do Windows)',
      pollMs: this.config.pollMs,
    };
  }

  async listPrinters() {
    const { stdout } = await runPowerShell('Get-Printer | Select-Object -ExpandProperty Name | ConvertTo-Json');
    const parsed = JSON.parse((stdout || '[]').trim() || '[]');
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string' && parsed) return [parsed];
    return [];
  }

  async printText(text) {
    const tempFile = path.join(os.tmpdir(), `frango-receipt-${Date.now()}.txt`);
    
    // Comandos ESC/POS agressivos para impressão térmica com fonte grande e negrito
    let formattedText = '';
    
    // Reset e inicialização
    formattedText += '\x1B@';           // Reset da impressora
    
    // Configurar modo de impressão em negrito e fonte grande
    formattedText += '\x1B!\x38';       // Fonte A + dupla largura + dupla altura + negrito (0x38 = 56)
    formattedText += '\x1B\x45\x01';     // Negrito ON (ESC E 1)
    formattedText += '\x1B\x47\x01';     // Double-strike ON (ESC G 1) - mais escuro ainda
    formattedText += '\x1B\x4D\x01';     // Densidade de impressão alta (ESC M 1)
    
    // Adicionar espaçamento entre linhas para melhor legibilidade
    formattedText += '\x1B\x33\x20';    // Espaçamento entre linhas (32 dots)
    
    formattedText += text;
    
    // Reset dos comandos no final
    formattedText += '\x1B\x45\x00';     // Negrito OFF
    formattedText += '\x1B\x47\x00';     // Double-strike OFF
    formattedText += '\x1B\x4D\x00';     // Densidade normal
    formattedText += '\x1B!\x00';        // Fonte normal
    formattedText += '\x1B\x33\x00';     // Espaçamento normal
    
    // Adicionar linhas para corte
    formattedText += '\n\n\n\n';

    // Escrever arquivo em modo binário para preservar comandos ESC/POS
    await fs.writeFile(tempFile, formattedText, 'binary');
    
    try {
      // Usar comando direto para impressora térmica sem abrir diálogo
      const printerName = this.config.printerName || 'Microsoft Print to PDF';
      
      // Comando otimizado para impressão ESC/POS com encoding correto
      const psCommand = `
        $printer = Get-Printer -Name '${toPsSingleQuoted(printerName)}' -ErrorAction SilentlyContinue
        if ($printer) {
          # Ler arquivo em modo binário para preservar comandos ESC/POS
          $content = Get-Content -Path '${toPsSingleQuoted(tempFile)}' -Raw -Encoding Default
          $content | Out-Printer -Name '${toPsSingleQuoted(printerName)}' -ErrorAction SilentlyContinue
        } else {
          # Fallback: tenta imprimir na impressora padrão
          $content = Get-Content -Path '${toPsSingleQuoted(tempFile)}' -Raw -Encoding Default
          $content | Out-Printer -ErrorAction SilentlyContinue
        }
      `;
      
      await runPowerShell(psCommand.trim());
    } catch (error) {
      this.log('[printText] erro na impressão:', error.message);
      throw error;
    } finally {
      await fs.unlink(tempFile).catch(() => {});
    }
  }

  async testPrint() {
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR');
    const orderNumber = `PDV-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const items = [
      { name: 'PEITO DE FRANGO', qty: 2.5, unit: 19.9 },
      { name: 'COXA E SOBRECOXA', qty: 1.2, unit: 15.9 },
      { name: 'FIGADO DE FRANGO', qty: 0.8, unit: 13.5 },
    ];
    const subtotal = items.reduce((acc, item) => acc + item.qty * item.unit, 0);
    const deliveryFee = 5.0;
    const total = subtotal + deliveryFee;
    const lines = items.map((item) => {
      const lineTotal = item.qty * item.unit;
      return `${item.name}\n  ${item.qty.toFixed(3)}kg x R$ ${item.unit.toFixed(2)} = R$ ${lineTotal.toFixed(2)}`;
    });
    const testText = [
      'FRANGO FORTE PDV',
      'COMPROVANTE DE PEDIDO - TESTE',
      `Impressora: ${this.config.printerName || 'padrao do Windows'}`,
      '----------------------------------------',
      `Pedido: ${orderNumber}`,
      `Data: ${date} ${time}`,
      'Canal: ONLINE',
      '',
      'CLIENTE',
      'Nome: Joao da Silva',
      'CPF/CNPJ: 123.456.789-00',
      'Telefone: (85) 99730-6525',
      'Endereco: Rua 7 de Abril, 16 - Centro',
      '',
      'ITENS',
      ...lines,
      '----------------------------------------',
      `Subtotal: R$ ${subtotal.toFixed(2)}`,
      `Taxa Entrega: R$ ${deliveryFee.toFixed(2)}`,
      `TOTAL: R$ ${total.toFixed(2)}`,
      '',
      'PAGAMENTO',
      'Forma: PIX',
      'Status: PAGO',
      'TxID: TESTE-PIX-0001',
      '',
      'Observacao: sem pimenta',
      '----------------------------------------',
      'Documento nao fiscal',
      'Obrigado pela preferencia!',
      '',
    ].join('\n');
    await this.printText(testText);
  }

  // ============ RECIBO A PARTIR DE ORDER ============

  generateReceiptText(order) {
    const formatCurrency = (value) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const line = '='.repeat(32);
    let text = '';

    // Cabeçalho maior e mais destacado
    text += line + '\n';
    text += '*** FRANGO FORTE ***\n';
    text += '    LANCHONETE\n';
    text += '\n';
    text += 'Rua das Acacias, 1234\n';
    text += 'Centro - Fortaleza/CE\n';
    text += 'Tel: (85) 98765-4321\n';
    text += '\n';

    // Info do pedido com destaque
    text += line + '\n';
    text += 'COMPROVANTE DE PEDIDO\n';
    text += line + '\n';
    text += `Nº: ${order.id?.slice(-8).toUpperCase() || 'N/A'}\n`;
    text += `Data: ${formatDate(order.created_at)}\n`;
    text += '\n';

    // Cliente
    text += 'CLIENTE:\n';
    text += `${(order.customer_name || 'N/A').toUpperCase()}\n`;
    if (order.customer_phone) {
      text += `Fone: ${order.customer_phone}\n`;
    }
    text += '\n';

    // Endereço de entrega (se houver)
    if (order.delivery_address) {
      text += 'ENDEREÇO DE ENTREGA:\n';
      text += `${order.delivery_address}\n`;
      if (order.delivery_neighborhood) {
        text += `${order.delivery_neighborhood}\n`;
      }
      text += '\n';
    }

    // Itens do pedido
    text += 'ITENS DO PEDIDO:\n';
    text += '-'.repeat(32) + '\n';
    
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach(item => {
        const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
        text += `${(item.product_name || 'Produto').toUpperCase()}\n`;
        text += `  ${item.quantity} x ${formatCurrency(item.unit_price)}\n`;
        text += `  = ${formatCurrency(itemTotal)}\n`;
        text += '\n';
      });
    } else {
      text += 'NENHUM ITEM\n';
      text += '\n';
    }
    
    text += '-'.repeat(32) + '\n';

    // Totais com destaque
    text += 'RESUMO DOS VALORES:\n';
    text += '-'.repeat(32) + '\n';
    text += `Subtotal:........${formatCurrency(order.subtotal || 0)}\n`;
    text += `Taxa Entrega:....${formatCurrency(order.delivery_fee || 0)}\n`;
    text += '-'.repeat(32) + '\n';
    text += `TOTAL PAGAR:.....${formatCurrency(order.total || 0)}\n`;
    text += '-'.repeat(32) + '\n';
    text += '\n';

    // Pagamento
    text += 'FORMA DE PAGAMENTO:\n';
    text += '-'.repeat(32) + '\n';
    text += `${(order.payment_method || 'N/A').toUpperCase()}\n`;
    text += `Status: ${(order.payment_status || 'N/A').toUpperCase()}\n`;
    
    if (order.payment_method === 'pix' && order.pix_key) {
      text += `Chave PIX: ${order.pix_key}\n`;
    }
    
    text += '\n';

    // Observações
    if (order.notes) {
      text += 'OBSERVAÇÕES:\n';
      text += '-'.repeat(32) + '\n';
      text += `${order.notes}\n`;
      text += '\n';
    }

    // Rodapé
    text += line + '\n';
    text += '*** NÃO É DOCUMENTO FISCAL ***\n';
    text += '\n';
    text += 'OBRIGADO PELA PREFERÊNCIA!\n';
    text += 'VOLTE SEMPRE!\n';
    text += '\n';

    return text;
  }

  // ============ ORDERS (tabela principal) ============

  async lockOrder(orderId) {
    if (this.processingOrders.has(orderId)) return null;
    this.processingOrders.add(orderId);

    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('orders')
      .update({
        status: 'printing',
        updated_at: now,
      })
      .eq('id', orderId)
      .is('printed_at', null)
      .select('*, order_items(*)')
      .maybeSingle();

    if (error || !data) {
      this.processingOrders.delete(orderId);
      if (error) this.log('[lockOrder] erro:', error.message);
      return null;
    }
    return data;
  }

  async markOrderPrinted(orderId) {
    const now = new Date().toISOString();
    const { error } = await this.supabase
      .from('orders')
      .update({ 
        status: 'delivered', 
        delivered_at: now, 
        printed_at: now, 
        updated_at: now 
      })
      .eq('id', orderId);

    this.processingOrders.delete(orderId);
    if (error) this.log('[markOrderPrinted] erro:', error.message);
  }

  async markOrderError(orderId, message) {
    const now = new Date().toISOString();
    const { error } = await this.supabase
      .from('orders')
      .update({ updated_at: now })
      .eq('id', orderId);

    this.processingOrders.delete(orderId);
    if (error) this.log('[markOrderError] erro:', error.message);
  }

  async processOrder(rawOrder) {
    const order = await this.lockOrder(rawOrder.id);
    if (!order) return;

    try {
      const receiptText = this.generateReceiptText(order);
      if (!receiptText.trim()) throw new Error('recibo vazio');
      await this.printText(receiptText);
      await this.markOrderPrinted(order.id);
      this.log(`[OK] impresso pedido ${order.id} - ${order.customer_name || 'Cliente'}`);
    } catch (err) {
      await this.markOrderError(order.id, err.message || String(err));
      this.log(`[ERRO] pedido ${order.id}:`, err.message || err);
    }
  }

  async pollOrders() {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(*)')
      .is('printed_at', null)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      this.log('[pollOrders] erro:', error.message);
      return;
    }

    for (const order of data || []) {
      if (this.processingOrders.has(order.id)) continue;
      await this.processOrder(order);
    }
  }

  // ============ PRINT_JOBS (fallback compatibilidade) ============

  async lockJob(jobId) {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('print_jobs')
      .update({
        status: 'processing',
        processed_at: now,
        updated_at: now,
        retry_count: 1,
        printer_name: this.config.printerName || null,
        error_message: null,
      })
      .eq('id', jobId)
      .eq('status', 'queued')
      .select('*')
      .maybeSingle();

    if (error) {
      this.log('[lockJob] erro:', error.message);
      return null;
    }
    return data || null;
  }

  async markDone(jobId) {
    const now = new Date().toISOString();
    const { error } = await this.supabase
      .from('print_jobs')
      .update({ status: 'done', printed_at: now, updated_at: now, error_message: null })
      .eq('id', jobId);

    if (error) this.log('[markDone] erro:', error.message);
  }

  async markError(jobId, message) {
    const now = new Date().toISOString();
    const { error } = await this.supabase
      .from('print_jobs')
      .update({ status: 'error', updated_at: now, error_message: String(message || 'erro de impressao') })
      .eq('id', jobId);

    if (error) this.log('[markError] erro:', error.message);
  }

  async processJob(rawJob) {
    const job = await this.lockJob(rawJob.id);
    if (!job) return;

    try {
      const textContent = job.text_content || '';
      if (!textContent.trim()) throw new Error('text_content vazio no job');
      await this.printText(textContent);
      await this.markDone(job.id);
      this.log(`[OK] impresso job ${job.id}`);
    } catch (err) {
      await this.markError(job.id, err.message || String(err));
      this.log(`[ERRO] job ${job.id}:`, err.message || err);
    }
  }

  async pollQueuedJobs() {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from('print_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      this.log('[pollQueuedJobs] erro:', error.message);
      return;
    }

    for (const job of data || []) {
      await this.processJob(job);
    }
  }

  // ============ REALTIME ============

  startRealtime() {
    if (!this.supabase) return;

    if (this.realtimeChannel) {
      try {
        this.supabase.removeChannel(this.realtimeChannel);
      } catch {}
      this.realtimeChannel = null;
    }

    this.realtimeChannel = this.supabase
      .channel(`print-agent-${this.config.agentId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new;
          if (!order || order.printed_at !== null) return;
          await this.processOrder(order);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new;
          if (!order || order.printed_at !== null) return;
          if (this.processingOrders.has(order.id)) return;
          await this.processOrder(order);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'print_jobs' },
        async (payload) => {
          const job = payload.new;
          if (!job || job.status !== 'queued') return;
          await this.processJob(job);
        }
      )
      .subscribe((status) => {
        this.log(`[Realtime] status: ${status}`);

        if (status === 'SUBSCRIBED') {
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          return;
        }

        if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          if (!this.reconnectTimer && this.running) {
            this.reconnectTimer = setTimeout(() => {
              this.reconnectTimer = null;
              this.startRealtime();
            }, 3000);
          }
        }
      });
  }

  // ============ START/STOP ============

  async start() {
    if (this.running) return;
    if (!this.config.supabaseUrl || !this.config.serviceRoleKey) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias');
    }

    this.supabase = createClient(this.config.supabaseUrl, this.config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    this.running = true;
    this.log('==============================');
    this.log('FRANGO PRINT AGENT iniciado');
    this.log(`Agent: ${this.config.agentId}`);
    this.log(`Printer: ${this.config.printerName || '(padrao do Windows)'}`);
    this.log(`Poll: ${this.config.pollMs}ms`);
    this.log('==============================');

    this.startRealtime();
    await this.pollOrders();
    await this.pollQueuedJobs();
    this.pollTimer = setInterval(() => {
      this.pollOrders();
      this.pollQueuedJobs();
    }, this.config.pollMs);
  }

  stop() {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.realtimeChannel && this.supabase) {
      try {
        this.supabase.removeChannel(this.realtimeChannel);
      } catch {}
    }
    this.realtimeChannel = null;
    this.supabase = null;
    this.processingOrders.clear();
    this.log('Agente parado.');
  }
}

module.exports = { PrintAgent };
