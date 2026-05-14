import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/print-jobs - Listar jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase.from('print_jobs').select('*')

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching print jobs:', error)
    return NextResponse.json(
      { error: 'Falha ao buscar jobs de impressão' },
      { status: 500 }
    )
  }
}

// POST /api/print-jobs - Criar novo job
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()

    const { data, error } = await supabase
      .from('print_jobs')
      .insert([
        {
          source_channel: body.source_channel || 'pos',
          source_order_id: body.source_order_id,
          status: 'queued',
          payload: body.payload,
          html_content: body.html_content,
          text_content: body.text_content
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating print job:', error)
    return NextResponse.json(
      { error: 'Falha ao criar job de impressão' },
      { status: 500 }
    )
  }
}

// PATCH /api/print-jobs/[id] - Atualizar status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do job não fornecido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const updates: any = {
      status: body.status
    }

    if (body.status === 'completed') {
      updates.printed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('print_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating print job:', error)
    return NextResponse.json(
      { error: 'Falha ao atualizar job de impressão' },
      { status: 500 }
    )
  }
}
