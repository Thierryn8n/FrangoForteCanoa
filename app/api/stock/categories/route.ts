import { getStockCategories, createStockCategory } from '@/lib/actions/stock'
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

export async function POST(request: Request) {
  try {
    const category = await request.json()
    console.log('Creating category:', category)
    const newCategory = await createStockCategory(category)
    return NextResponse.json(newCategory)
  } catch (error: any) {
    console.error('Error creating stock category:', error)
    return NextResponse.json({ 
      error: 'Failed to create category',
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}
