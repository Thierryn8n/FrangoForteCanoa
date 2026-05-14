import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { orderId, agentId = 'PRINT-AGENT-01' } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados do pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name)
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // VALIDAÇÃO: Apenas PIX pagos podem ser impressos
    if (order.payment_method !== 'pix') {
      return NextResponse.json(
        { 
          error: 'Apenas pedidos com pagamento PIX podem ser impressos',
          payment_method: order.payment_method,
          payment_status: order.payment_status
        },
        { status: 400 }
      )
    }

    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { 
          error: 'Apenas pedidos PIX pagos podem ser impressos',
          payment_method: order.payment_method,
          payment_status: order.payment_status
        },
        { status: 400 }
      )
    }

    // Verificar se já existe job de impressão para este pedido
    const { data: existingJob } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('order_id', orderId)
      .in('status', ['queued', 'processing'])
      .single()

    if (existingJob) {
      return NextResponse.json(
        { error: 'Já existe um job de impressão para este pedido', job: existingJob },
        { status: 409 }
      )
    }

    // Gerar texto de impressão formatado
    const printText = generatePrintText(order)

    // Criar job de impressão
    const { data: printJob, error: printError } = await supabase
      .from('print_jobs')
      .insert({
        order_id: orderId,
        text_content: printText,
        agent_id: agentId,
        status: 'queued'
      })
      .select()
      .single()

    if (printError) {
      console.error('Erro ao criar job de impressão:', printError)
      return NextResponse.json(
        { error: 'Erro ao criar job de impressão' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      printJob,
      message: 'Job de impressão PIX criado com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de print job:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')

    let query = supabase
      .from('print_jobs')
      .select(`
        *,
        orders (
          id,
          customer_name,
          customer_phone,
          total,
          status,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar jobs de impressão:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar jobs de impressão' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      jobs: data || []
    })

  } catch (error) {
    console.error('Erro na API de print job (GET):', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function generatePrintText(order: any): string {
  const lines: string[] = []

  // Cabeçalho
  lines.push('FRANGO FORTE PDV')
  lines.push('COMPROVANTE DE PEDIDO')
  lines.push('----------------------------------------')
  lines.push(`Pedido: #${order.id?.toString().substring(0, 8) || 'N/A'}`)
  lines.push(`Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`)
  lines.push('Canal: ONLINE')
  lines.push('')

  // Dados do cliente
  lines.push('CLIENTE')
  lines.push(`Nome: ${order.customer_name || 'N/A'}`)
  if (order.customer_phone) {
    lines.push(`Telefone: ${order.customer_phone}`)
  }
  if (order.delivery_address) {
    lines.push(`Endereço: ${order.delivery_address}`)
  }
  lines.push('')

  // Itens do pedido
  lines.push('ITENS')
  
  if (order.order_items && order.order_items.length > 0) {
    let subtotal = 0
    
    order.order_items.forEach((item: any) => {
      const productName = item.products?.name || item.product_name || 'Produto'
      const itemTotal = item.quantity * item.product_price
      subtotal += itemTotal
      
      lines.push(
        `${productName} - ${item.quantity} x R$ ${item.product_price.toFixed(2)} = R$ ${itemTotal.toFixed(2)}`
      )
    })
    
    lines.push('----------------------------------------')
    lines.push(`Subtotal: R$ ${subtotal.toFixed(2)}`)
    lines.push(`Taxa Entrega: R$ ${order.delivery_fee.toFixed(2)}`)
    lines.push(`TOTAL: R$ ${order.total.toFixed(2)}`)
  } else {
    lines.push('Nenhum item encontrado')
  }
  
  lines.push('')

  // Pagamento
  lines.push('PAGAMENTO')
  lines.push(`Forma: ${getPaymentMethodLabel(order.payment_method)}`)
  lines.push(`Status: ${getPaymentStatusLabel(order.payment_status)}`)
  
  if (order.notes) {
    lines.push('')
    lines.push(`Observação: ${order.notes}`)
  }
  
  lines.push('----------------------------------------')
  lines.push('OBS: Apenas pedidos PIX são impressos')
  lines.push('Outros métodos já pagos não precisam de impressão')
  lines.push('----------------------------------------')
  lines.push('Documento não fiscal')
  lines.push('Obrigado pela preferência!')
  lines.push('')

  return lines.join('\n')
}

function getPaymentMethodLabel(method: string): string {
  const labels: { [key: string]: string } = {
    'pix': 'PIX',
    'credit_card': 'Cartão Crédito',
    'debit_card': 'Cartão Débito',
    'cash': 'Dinheiro',
    'money': 'Dinheiro',
    'credit': 'Crédito',
    'debit': 'Débito',
    'transfer': 'Transferência'
  }
  return labels[method] || method
}

function getPaymentStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'paid': 'PAGO',
    'pending': 'PENDENTE',
    'failed': 'FALHOU',
    'refunded': 'REEMBOLSADO'
  }
  return labels[status] || status
}
