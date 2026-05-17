import { NextRequest, NextResponse } from 'next/server'
import { fetchNfeDataFromSEFAZ } from '@/lib/actions/stock'

export async function POST(request: NextRequest) {
  try {
    const { accessKey } = await request.json()

    if (!accessKey || accessKey.length !== 44) {
      return NextResponse.json(
        { error: 'Chave de acesso inválida. Deve ter 44 dígitos.' },
        { status: 400 }
      )
    }

    console.log('Buscando dados da NF-e para chave:', accessKey)
    const nfeData = await fetchNfeDataFromSEFAZ(accessKey)
    console.log('Dados da NF-e obtidos com sucesso:', nfeData)

    return NextResponse.json({ data: nfeData })
  } catch (error: any) {
    console.error('Erro ao buscar dados da NF-e:', error)
    console.error('Detalhes do erro:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao buscar dados da NF-e',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
