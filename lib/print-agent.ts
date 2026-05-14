// Print Agent - Serviço para gerenciar impressão em tempo real
// Este arquivo será usado tanto pelo servidor quanto pelo agente de impressão (Electron)

import { PrintJob } from '@/lib/types'

export interface PrintJobPayload {
  order_number: number
  customer_name?: string
  customer_phone?: string
  items: Array<{
    product_name: string
    weight_kg: number
    price_per_kg: number
    total_price: number
  }>
  subtotal: number
  discount: number
  total: number
  payment_method: string
  created_at: string
}

export function generateReceiptHTML(
  payload: PrintJobPayload,
  storeSettings: any
): string {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
  }

  // Gerar HTML otimizado para impressoras térmicas Epson
  // Usando fonte de largura fixa com peso extra-bold e anti-aliasing desligado
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Imprimir Pedido #${payload.order_number}</title>
  <style>
    @page {
      margin: 0;
      size: 80mm auto;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Courier New', 'Courier', monospace;
      font-size: 14px;
      font-weight: 900;
      line-height: 1.3;
      color: #000;
      background: #fff;
      width: 80mm;
      padding: 8px;
      -webkit-font-smoothing: none;
      -moz-osx-font-smoothing: unset;
      text-rendering: geometricPrecision;
    }
    
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 900; }
    .bolder { 
      font-weight: 900;
      text-shadow: 0.5px 0 0 #000, -0.5px 0 0 #000, 0 0.5px 0 #000, 0 -0.5px 0 #000;
    }
    
    .line {
      border-top: 3px solid #000;
      margin: 6px 0;
    }
    
    .dashed {
      border-top: 2px dashed #000;
      margin: 6px 0;
    }
    
    .spacer { height: 8px; }
    
    .item { 
      margin-bottom: 8px; 
      font-weight: 900;
    }
    
    .total-row {
      font-weight: 900;
      font-size: 15px;
    }
    
    .store-name {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1px;
    }
    
    @media print {
      body { 
        margin: 0; 
        padding: 5px;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="center store-name bolder">${storeSettings?.store_name || 'FRANGO FORTE'}</div>
  <div class="spacer"></div>
  <div class="center bold">COMPROVANTE DE PEDIDO</div>
  <div class="line"></div>
  
  <div class="bold">Pedido: #${payload.order_number}</div>
  <div>${formatDate(payload.created_at)}</div>
  <div class="dashed"></div>
  
  ${payload.customer_name || payload.customer_phone ? `
  <div class="bold">CLIENTE</div>
  ${payload.customer_name ? `<div>${payload.customer_name}</div>` : ''}
  ${payload.customer_phone ? `<div>Fone: ${payload.customer_phone}</div>` : ''}
  <div class="dashed"></div>
  ` : ''}
  
  <div class="bold">ITENS</div>
  <div class="dashed"></div>
  
  ${payload.items.map(item => `
  <div class="item">
    <div class="bold">${item.product_name}</div>
    <div>${item.weight_kg.toFixed(3)}kg x ${formatCurrency(item.price_per_kg)}/kg</div>
    <div class="right bold">= ${formatCurrency(item.total_price)}</div>
  </div>
  `).join('')}
  
  <div class="dashed"></div>
  <div class="bold">RESUMO</div>
  <div class="dashed"></div>
  
  <div>Subtotal: <span class="right">${formatCurrency(payload.subtotal)}</span></div>
  ${payload.discount > 0 ? `<div>Desconto: <span class="right">-${formatCurrency(payload.discount)}</span></div>` : ''}
  <div class="total-row">TOTAL: <span class="right">${formatCurrency(payload.total)}</span></div>
  
  <div class="line"></div>
  <div class="bold">PAGAMENTO</div>
  <div>Forma: ${payload.payment_method?.toUpperCase()}</div>
  <div>Status: PAGO</div>
  <div class="line"></div>
  
  <div class="center" style="font-size: 11px;">Documento não fiscal</div>
  <div class="center bold">Obrigado pela preferência!</div>
  <div class="spacer"></div>
  <div class="spacer"></div>
</body>
</html>`;

  return html;
}

export function generateReceiptText(
  payload: PrintJobPayload,
  storeSettings: any
): string {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
  }

  const line = '-'.repeat(40)
  let text = ''

  text += `\n${(storeSettings?.store_name || 'LOJA').padStart(20)}\n`
  text += line + '\n'

  if (storeSettings?.address) {
    text += storeSettings.address + '\n'
  }
  if (storeSettings?.phone) {
    text += `Tel: ${storeSettings.phone}\n`
  }

  text += line + '\n'
  text += `Pedido #${payload.order_number}\n`
  text += `${formatDate(payload.created_at)}\n`

  if (payload.customer_name || payload.customer_phone) {
    text += line + '\n'
    if (payload.customer_name) text += `Cliente: ${payload.customer_name}\n`
    if (payload.customer_phone) text += `Tel: ${payload.customer_phone}\n`
  }

  text += line + '\n'
  text += 'ITENS\n'
  text += line + '\n'

  payload.items.forEach(item => {
    text += `${item.product_name} ${item.weight_kg.toFixed(3)}kg\n`
    text += `@${formatCurrency(item.price_per_kg)}/kg = ${formatCurrency(item.total_price)}\n`
  })

  text += line + '\n'
  text += `SUBTOTAL: ${formatCurrency(payload.subtotal)}\n`
  if (payload.discount > 0) {
    text += `DESCONTO: -${formatCurrency(payload.discount)}\n`
  }
  text += `TOTAL: ${formatCurrency(payload.total)}\n`
  text += line + '\n'
  text += `Pagamento: ${payload.payment_method?.toUpperCase()}\n`
  text += '\nOBRIGADO!\n'
  text += 'Volte sempre\n'

  return text
}

// Configuração para o agente Electron
export const PRINT_AGENT_CONFIG = {
  printerName: 'thermal-80mm', // Nome padrão da impressora térmica 80mm
  pageWidth: 80, // 80mm
  pageHeight: 'auto',
  dpi: 203, // DPI padrão para térmica
  copies: 1,
  timeout: 30000 // 30 segundos timeout
}
