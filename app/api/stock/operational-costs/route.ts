import { createOperationalCost } from '@/lib/actions/stock'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cost = await request.json()
    const newCost = await createOperationalCost(cost)
    return NextResponse.json(newCost)
  } catch (error) {
    console.error('Error creating operational cost:', error)
    return NextResponse.json({ error: 'Failed to create operational cost' }, { status: 500 })
  }
}
