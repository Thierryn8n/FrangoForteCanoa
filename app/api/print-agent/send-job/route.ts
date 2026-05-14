import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { text_content, order_id, agent_id } = await request.json()

    if (!text_content || !order_id || !agent_id) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: text_content, order_id, agent_id' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Inserir job de impressão na fila
    const { data, error } = await supabase
      .from('print_jobs')
      .insert({
        text_content,
        order_id,
        agent_id,
        status: 'queued',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar print job:', error)
      return NextResponse.json(
        { error: 'Erro ao criar job de impressão' },
        { status: 500 }
      )
    }

    console.log(`Print job criado: ${data.id} para order: ${order_id}`)
    
    return NextResponse.json({
      success: true,
      job_id: data.id,
      message: 'Job enviado para impressão automática'
    })

  } catch (error) {
    console.error('Erro no endpoint de print job:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
