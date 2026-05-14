import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const { product_id, price_per_kg } = await request.json()
    
    if (!product_id || !price_per_kg || price_per_kg <= 0) {
      return NextResponse.json(
        { error: 'ID do produto e preço válido são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Atualizar preço do produto
    const { data, error } = await supabase
      .from('products')
      .update({ 
        price_per_kg,
        has_pending_price: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar preço:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar preço do produto' },
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
