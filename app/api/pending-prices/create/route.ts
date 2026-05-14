import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { product_id, product_name, notes } = await request.json()
    
    if (!product_id || !product_name) {
      return NextResponse.json(
        { error: 'ID do produto e nome são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verificar se já existe pendência para este produto
    const { data: existing } = await supabase
      .from('pending_prices')
      .select('*')
      .eq('product_id', product_id)
      .eq('status', 'pending')
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe uma pendência de preço para este produto' },
        { status: 400 }
      )
    }

    // Criar nova pendência
    const { data, error } = await supabase
      .from('pending_prices')
      .insert({
        product_id,
        product_name,
        created_by: 'voice_system',
        status: 'pending',
        notes: notes || 'Produto criado por comando de voz - preço pendente de definição'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar pendência:', error)
      return NextResponse.json(
        { error: 'Erro ao criar pendência de preço' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
