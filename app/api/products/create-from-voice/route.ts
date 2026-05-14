import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { name, source } = await request.json()
    
    if (!name) {
      return NextResponse.json(
        { error: 'Nome do produto é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Criar produto com preço 0 (pendente)
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        price_per_kg: 0,
        unit: 'kg',
        is_active: true,
        category_id: null,
        image_url: null,
        has_pending_price: true,
        created_by: source || 'voice_system'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar produto:', error)
      return NextResponse.json(
        { error: 'Erro ao criar produto' },
        { status: 500 }
      )
    }

    // Criar pendência de preço
    const { error: pendingError } = await supabase
      .from('pending_prices')
      .insert({
        product_id: product.id,
        product_name: product.name,
        created_by: source || 'voice_system',
        status: 'pending',
        notes: 'Produto criado por comando de voz - preço pendente de definição'
      })

    if (pendingError) {
      console.error('Erro ao criar pendência de preço:', pendingError)
      // Não falhar completamente se apenas a pendência falhar
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
