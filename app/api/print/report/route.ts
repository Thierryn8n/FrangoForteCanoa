import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { reportData, reportType } = await request.json()
    
    // Formatar relatório para impressão térmica
    const printContent = formatReportForPrint(reportData, reportType)
    
    // Criar job de impressão
    const { data: printJob, error } = await supabase
      .from('print_jobs')
      .insert([{
        text_content: printContent,
        status: 'queued',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      jobId: printJob.id,
      message: 'Relatório enviado para impressão' 
    })
    
  } catch (error) {
    console.error('Erro ao enviar relatório para impressão:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha ao enviar relatório para impressão' 
    }, { status: 500 })
  }
}

function formatReportForPrint(data: any, type: string): string {
  const date = new Date().toLocaleDateString('pt-BR')
  const time = new Date().toLocaleTimeString('pt-BR')
  
  let content = ''
  
  content += '================================\n'
  content += 'FRANGO FORTE CANOA\n'
  content += 'RELATÓRIO DE VENDAS\n'
  content += '================================\n'
  content += `Data: ${date} às ${time}\n`
  content += `Tipo: ${type.toUpperCase()}\n`
  content += '================================\n\n'
  
  if (type === 'diario' && data.dailyReport) {
    const r = data.dailyReport
    content += 'RESUMO DO DIA\n'
    content += '--------------------------------\n'
    content += `Vendas Totais: R$ ${Number(r.total_sales).toFixed(2)}\n`
    content += `Custo Total: R$ ${Number(r.total_cost).toFixed(2)}\n`
    content += `Lucro Bruto: R$ ${Number(r.gross_profit).toFixed(2)}\n`
    content += `Lucro Líquido: R$ ${Number(r.net_profit).toFixed(2)}\n`
    content += `Qtd. Vendida: ${Number(r.total_quantity_sold).toFixed(2)} KG\n`
    content += `Produtos: ${r.products_sold_count}\n`
  } else if (type === 'semanal' && data.weeklyTotal) {
    const w = data.weeklyTotal
    content += 'RESUMO DA SEMANA\n'
    content += '--------------------------------\n'
    content += `Vendas Totais: R$ ${w.sales.toFixed(2)}\n`
    content += `Custo Total: R$ ${w.cost.toFixed(2)}\n`
    content += `Lucro Bruto: R$ ${w.grossProfit.toFixed(2)}\n`
    content += `Lucro Líquido: R$ ${w.netProfit.toFixed(2)}\n`
    content += `Qtd. Vendida: ${w.quantity.toFixed(2)} KG\n`
  }
  
  content += '\n================================\n'
  content += 'Documento não fiscal\n'
  content += '================================\n'
  
  return content
}
