import { createDailyStockOpening } from '@/lib/actions/stock'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { stockItems } = await request.json()

    if (!stockItems || !Array.isArray(stockItems)) {
      return NextResponse.json({ error: 'Stock items are required' }, { status: 400 })
    }

    const opening = await createDailyStockOpening(stockItems)
    return NextResponse.json(opening)
  } catch (error) {
    console.error('Error creating daily stock opening:', error)
    return NextResponse.json({ error: 'Failed to create stock opening' }, { status: 500 })
  }
}
