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

    const nfeData = await fetchNfeDataFromSEFAZ(accessKey)

    return NextResponse.json({ data: nfeData })
  } catch (error: any) {
    console.error('Erro ao buscar dados da NF-e:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dados da NF-e' },
      { status: 500 }
    )
  }
}
