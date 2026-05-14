import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const { pending_price_id } = await request.json()
    
    if (!pending_price_id) {
      return NextResponse.json(
        { error: 'ID da pendência é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Atualizar status da pendência
    const { data, error } = await supabase
      .from('pending_prices')
      .update({ 
        status: 'cancelled',
        resolved_at: new Date().toISOString(),
        resolved_by: 'admin'
      })
      .eq('id', pending_price_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao cancelar pendência:', error)
      return NextResponse.json(
        { error: 'Erro ao cancelar pendência' },
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
