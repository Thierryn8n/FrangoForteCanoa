import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface PosOrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface PosOrder {
  customer_name: string
  customer_phone?: string
  delivery_address?: string
  payment_method: 'cash' | 'credit' | 'debit' | 'transfer'
  payment_status: 'paid' | 'pending'
  subtotal: number
  delivery_fee: number
  total: number
  notes?: string
  items: PosOrderItem[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const orderData: PosOrder = await request.json()

    // Validações básicas
    if (!orderData.customer_name || !orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Dados do pedido incompletos' },
        { status: 400 }
      )
    }

    // Gerar ID único para o pedido do PDV
    const orderNumber = `PDV-${Date.now().toString().slice(-6)}`
    
    // Criar o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone || null,
        delivery_address: orderData.delivery_address || null,
        payment_method: orderData.payment_method,
        payment_status: orderData.payment_status || 'paid',
        subtotal: orderData.subtotal,
        delivery_fee: orderData.delivery_fee,
        total: orderData.total,
        notes: orderData.notes || null,
        source: 'pos', // Identificar que veio do PDV
        order_number: orderNumber
      })
      .select()
      .single()

    if (orderError) {
      console.error('Erro ao criar pedido PDV:', orderError)
      return NextResponse.json(
        { error: 'Erro ao criar pedido' },
        { status: 500 }
      )
    }

    // Criar os itens do pedido
    const itemsToInsert = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      product_price: item.unit_price,
      subtotal: item.subtotal
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Erro ao criar itens do pedido PDV:', itemsError)
      return NextResponse.json(
        { error: 'Erro ao criar itens do pedido' },
        { status: 500 }
      )
    }

    // Criar job de impressão automaticamente para pedidos do PDV
    // (não precisa verificar método de pagamento, pois é pedido direto da loja)
    const printText = generatePosPrintText(orderData, orderNumber)
    
    const { data: printJob, error: printError } = await supabase
      .from('print_jobs')
      .insert({
        order_id: order.id,
        text_content: printText,
        agent_id: 'PRINT-AGENT-01',
        status: 'queued'
      })
      .select()
      .single()

    if (printError) {
      console.error('Erro ao criar job de impressão PDV:', printError)
      // Não retorna erro, pois o pedido foi criado com sucesso
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: orderData.items,
        order_number: orderNumber
      },
      printJob,
      message: 'Pedido PDV criado com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de pedido PDV:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function generatePosPrintText(order: PosOrder, orderNumber: string): string {
  const lines: string[] = []

  // Cabeçalho
  lines.push('FRANGO FORTE PDV')
  lines.push('COMPROVANTE DE PEDIDO - LOJA')
  lines.push('----------------------------------------')
  lines.push(`Pedido: ${orderNumber}`)
  lines.push(`Data: ${new Date().toLocaleString('pt-BR')}`)
  lines.push('Canal: LOJA')
  lines.push('')

  // Dados do cliente
  lines.push('CLIENTE')
  lines.push(`Nome: ${order.customer_name}`)
  if (order.customer_phone) {
    lines.push(`Telefone: ${order.customer_phone}`)
  }
  if (order.delivery_address) {
    lines.push(`Endereço: ${order.delivery_address}`)
  }
  lines.push('')

  // Itens do pedido
  lines.push('ITENS')
  
  order.items.forEach(item => {
    lines.push(
      `${item.product_name} - ${item.quantity} x R$ ${item.unit_price.toFixed(2)} = R$ ${item.subtotal.toFixed(2)}`
    )
  })
  
  lines.push('----------------------------------------')
  lines.push(`Subtotal: R$ ${order.subtotal.toFixed(2)}`)
  lines.push(`Taxa Entrega: R$ ${order.delivery_fee.toFixed(2)}`)
  lines.push(`TOTAL: R$ ${order.total.toFixed(2)}`)
  lines.push('')

  // Pagamento
  lines.push('PAGAMENTO')
  lines.push(`Forma: ${getPaymentMethodLabel(order.payment_method)}`)
  lines.push(`Status: ${order.payment_status === 'paid' ? 'PAGO' : 'PENDENTE'}`)
  
  if (order.notes) {
    lines.push('')
    lines.push(`Observação: ${order.notes}`)
  }
  
  lines.push('----------------------------------------')
  lines.push('NOTA FISCAL - PEDIDO DA LOJA')
  lines.push('Obrigado pela preferência!')
  lines.push('')

  return lines.join('\n')
}

function getPaymentMethodLabel(method: string): string {
  const labels: { [key: string]: string } = {
    'cash': 'Dinheiro',
    'credit': 'Cartão Crédito',
    'debit': 'Cartão Débito',
    'transfer': 'Transferência'
  }
  return labels[method] || method
}
