'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// === ABERTURA DE ESTOQUE DIÁRIO ===

export async function getTodayStockOpening() {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('daily_stock_opening')
    .select('*')
    .eq('opening_date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

export async function createDailyStockOpening(stockItems: any[]) {
  const today = new Date().toISOString().split('T')[0]
  
  // Criar abertura de estoque
  const { data: opening, error: openingError } = await supabase
    .from('daily_stock_opening')
    .insert([{
      opening_date: today,
      status: 'open'
    }])
    .select()
    .single()

  if (openingError) throw openingError

  // Criar itens de estoque
  const itemsToInsert = stockItems.map(item => ({
    opening_id: opening.id,
    category_id: item.category_id,
    product_id: item.product_id,
    initial_quantity: item.quantity,
    current_quantity: item.quantity,
    unit: item.unit,
    cost_per_unit: item.cost_per_unit || 0,
    total_cost: (item.quantity || 0) * (item.cost_per_unit || 0)
  }))

  const { error: itemsError } = await supabase
    .from('daily_stock_items')
    .insert(itemsToInsert)

  if (itemsError) throw itemsError

  return opening
}

export async function getDailyStockItems(openingId: string) {
  const { data, error } = await supabase
    .from('daily_stock_items')
    .select(`
      *,
      stock_categories (
        id,
        name,
        unit_type
      ),
      products (
        id,
        name
      )
    `)
    .eq('opening_id', openingId)

  if (error) throw error
  return data
}

export async function closeDailyStockOpening(openingId: string) {
  const { error } = await supabase
    .from('daily_stock_opening')
    .update({ status: 'closed' })
    .eq('id', openingId)

  if (error) throw error
}

// === CATEGORIAS DE ESTOQUE ===

export async function getStockCategories() {
  const { data, error } = await supabase
    .from('stock_categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

export async function createStockCategory(category: { name: string; slug: string; unit_type: string; description?: string }) {
  const { data, error } = await supabase
    .from('stock_categories')
    .insert([category])
    .select()
    .single()

  if (error) throw error
  return data
}

// === TRANSAÇÕES DE ESTOQUE ===

export async function createStockTransaction(transaction: {
  opening_id: string
  stock_item_id: string
  transaction_type: 'sale' | 'return' | 'adjustment' | 'waste'
  quantity: number
  unit: string
  unit_price: number
  total_value: number
  order_id?: string
  user_id?: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from('stock_transactions')
    .insert([transaction])
    .select()
    .single()

  if (error) throw error

  // Atualizar quantidade atual do item de estoque
  const quantityChange = transaction.transaction_type === 'sale' || transaction.transaction_type === 'waste' 
    ? -transaction.quantity 
    : transaction.quantity

  await supabase
    .from('daily_stock_items')
    .update({
      current_quantity: supabase.raw(`current_quantity + ${quantityChange}`)
    })
    .eq('id', transaction.stock_item_id)

  return data
}

export async function getStockTransactions(openingId: string) {
  const { data, error } = await supabase
    .from('stock_transactions')
    .select('*')
    .eq('opening_id', openingId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
