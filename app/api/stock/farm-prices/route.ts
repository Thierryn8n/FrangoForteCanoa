import { createFarmPriceRecord } from '@/lib/actions/stock'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const record = await request.json()
    const newRecord = await createFarmPriceRecord(record)
    return NextResponse.json(newRecord)
  } catch (error) {
    console.error('Error creating farm price record:', error)
    return NextResponse.json({ error: 'Failed to create price record' }, { status: 500 })
  }
}
