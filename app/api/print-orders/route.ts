import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar pedidos que precisam ser impressos
    // Pedidos com status 'printing' (enviados para impressora)
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('status', 'printing')
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar pedidos para impressão:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      )
    }

    // Formatar pedidos para impressão
    const formattedOrders = orders?.map(order => {
      // Formatar texto de impressão
      const printLines = [
        'FRANGO FORTE PDV',
        'COMPROVANTE DE PEDIDO',
        '='.repeat(40),
        `Pedido: #${order.id.slice(-8)}`,
        `Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`,
        `Canal: CAIXA`,
        '',
        'CLIENTE',
        `Nome: ${order.customer_name || 'N/A'}`,
        order.customer_phone ? `Telefone: ${order.customer_phone}` : '',
        order.customer_address ? `Endereço: ${order.customer_address}` : '',
        '',
        'ITENS'
      ]

      let subtotal = 0
      order.order_items?.forEach((item: any) => {
        const itemTotal = (item.quantity || 1) * (item.product_price || 0)
        subtotal += itemTotal
        printLines.push(
          `${item.product_name} - ${item.quantity || 1} x R$ ${(item.product_price || 0).toFixed(2)} = R$ ${itemTotal.toFixed(2)}`
        )
      })

      printLines.push('='.repeat(40))
      printLines.push(`Subtotal: R$ ${subtotal.toFixed(2)}`)
      printLines.push(`Taxa Entrega: R$ ${(order.delivery_fee || 0).toFixed(2)}`)
      printLines.push(`TOTAL: R$ ${(order.total || 0).toFixed(2)}`)
      printLines.push('')
      printLines.push('PAGAMENTO')
      
      const paymentMethod = order.payment_method === 'pix' ? 'PIX' :
                         order.payment_method === 'credit' ? 'Crédito' :
                         order.payment_method === 'debit' ? 'Débito' :
                         order.payment_method === 'money' ? 'Dinheiro' :
                         order.payment_method || 'N/A'
      
      printLines.push(`Forma: ${paymentMethod}`)
      
      const paymentStatus = order.payment_status === 'paid' ? 'PAGO' : 'PENDENTE'
      printLines.push(`Status: ${paymentStatus}`)
      
      if (order.notes) {
        printLines.push('')
        printLines.push(`Obs: ${order.notes}`)
      }
      
      printLines.push('='.repeat(40))
      printLines.push('Documento não fiscal')
      printLines.push('Obrigado pela preferência!')
      printLines.push('')

      return {
        ...order,
        print_content: printLines.join('\n'),
        formatted_date: new Date(order.created_at).toLocaleString('pt-BR'),
        payment_method_label: paymentMethod,
        payment_status_label: paymentStatus
      }
    }) || []

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      total: formattedOrders.length,
      message: `${formattedOrders.length} pedidos encontrados para impressão`
    })

  } catch (error) {
    console.error('Erro no endpoint de pedidos para impressão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { order_ids, mark_as_printed } = await request.json()

    if (!order_ids || !Array.isArray(order_ids)) {
      return NextResponse.json(
        { error: 'order_ids deve ser um array' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let updateData: any = {
      status: 'printed',
      updated_at: new Date().toISOString()
    }
    if (mark_as_printed) {
      updateData.printed_at = new Date().toISOString()
    }

    // Marcar pedidos como impressos (status 'printed')
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .in('id', order_ids)
      .select()

    if (error) {
      console.error('Erro ao atualizar pedidos:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar pedidos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated_orders: data,
      message: `${data?.length || 0} pedidos atualizados com sucesso`
    })

  } catch (error) {
    console.error('Erro no endpoint de atualização de pedidos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
