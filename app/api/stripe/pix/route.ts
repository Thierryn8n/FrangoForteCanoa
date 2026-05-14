import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { items, customer } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Carrinho vazio' },
        { status: 400 }
      )
    }

    // Calculate total
    const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

    // Create payment intent for PIX
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'brl',
      payment_method_types: ['klarna'], // Stripe in Brazil supports PIX via Bank Integration
      statement_descriptor: 'FRANGO FORTE CANOA',
      metadata: {
        customer_name: customer?.name || 'Cliente',
        customer_phone: customer?.phone || '',
        customer_email: customer?.email || '',
        customer_address: customer?.address || '',
        customer_neighborhood: customer?.neighborhood || '',
        delivery_notes: customer?.delivery_notes || '',
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}

// Webhook para atualizar status de pedido
export async function PUT(request: NextRequest) {
  try {
    const { paymentIntentId, orderData } = await request.json()

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      // TODO: Update order in Supabase
      console.log('Pagamento confirmado:', orderData)
      
      return NextResponse.json({
        success: true,
        message: 'Pagamento processado com sucesso',
      })
    }

    return NextResponse.json(
      { error: 'Pagamento não confirmado' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
