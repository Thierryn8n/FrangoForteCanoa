import { getStockCategories } from '@/lib/actions/stock'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await getStockCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching stock categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
