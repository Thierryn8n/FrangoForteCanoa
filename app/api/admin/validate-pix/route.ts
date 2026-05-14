import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { transactionId, orderId } = await request.json()

    if (!transactionId || !orderId) {
      return NextResponse.json(
        { error: 'ID da transação e ID do pedido são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Atualizar status da transação PIX
    const { data: pixTransaction, error: pixError } = await supabase
      .from('pix_transactions')
      .update({
        status: 'paid',
        transaction_id: transactionId,
        paid_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .select()
      .single()

    if (pixError) {
      console.error('Erro ao atualizar transação PIX:', pixError)
      return NextResponse.json(
        { error: 'Erro ao validar pagamento PIX' },
        { status: 500 }
      )
    }

    // Atualizar status do pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (orderError) {
      console.error('Erro ao atualizar pedido:', orderError)
      return NextResponse.json(
        { error: 'Erro ao confirmar pedido' },
        { status: 500 }
      )
    }

    // Registrar log de status
    const { error: logError } = await supabase
      .from('order_status_updates')
      .insert({
        order_id: orderId,
        old_status: 'pending',
        new_status: 'confirmed',
        updated_by: 'admin',
        notes: `Pagamento PIX validado manualmente. Transação: ${transactionId}`
      })

    if (logError) {
      console.error('Erro ao registrar log de status:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Pagamento PIX validado com sucesso',
      pixTransaction,
      order
    })

  } catch (error) {
    console.error('Erro na validação PIX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Buscar transação PIX do pedido
    const { data: pixTransaction, error } = await supabase
      .from('pix_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (error) {
      console.error('Erro ao buscar transação PIX:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar transação' },
        { status: 500 }
      )
    }

    if (!pixTransaction) {
      return NextResponse.json(
        { error: 'Transação PIX não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      pixTransaction
    })

  } catch (error) {
    console.error('Erro ao buscar transação PIX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
