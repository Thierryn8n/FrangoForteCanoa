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

  // Buscar o item atual primeiro
  const { data: currentItem } = await supabase
    .from('daily_stock_items')
    .select('current_quantity')
    .eq('id', transaction.stock_item_id)
    .single()

  if (currentItem) {
    const newQuantity = Number(currentItem.current_quantity) + quantityChange
    await supabase
      .from('daily_stock_items')
      .update({ current_quantity: newQuantity })
      .eq('id', transaction.stock_item_id)
  }

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

// === HISTÓRICO DE PREÇOS DA GRANJA ===

export async function getFarmPriceHistory(category?: string) {
  let query = supabase
    .from('farm_price_history')
    .select('*')
    .order('effective_date', { ascending: false })

  if (category) {
    query = query.eq('product_category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createFarmPriceRecord(record: {
  product_category: string
  price_per_kg: number
  price_change_type: 'increase' | 'decrease' | 'stable'
  previous_price?: number
  effective_date: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from('farm_price_history')
    .insert([record])
    .select()
    .single()

  if (error) throw error
  return data
}

// === CUSTOS OPERACIONAIS ===

export async function getOperationalCosts(startDate?: string, endDate?: string) {
  let query = supabase
    .from('operational_costs')
    .select('*')
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createOperationalCost(cost: {
  cost_type: 'labor' | 'transport' | 'slaughter' | 'energy' | 'packaging' | 'other'
  description: string
  amount: number
  date: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from('operational_costs')
    .insert([cost])
    .select()
    .single()

  if (error) throw error
  return data
}

// === RELATÓRIOS ===

export async function generateDailyReport(date: string) {
  // Buscar abertura de estoque do dia
  const { data: opening } = await supabase
    .from('daily_stock_opening')
    .select('*')
    .eq('opening_date', date)
    .single()

  if (!opening) return null

  // Buscar itens de estoque
  const { data: stockItems } = await supabase
    .from('daily_stock_items')
    .select('*')
    .eq('opening_id', opening.id)

  // Buscar transações
  const { data: transactions } = await supabase
    .from('stock_transactions')
    .select('*')
    .eq('opening_id', opening.id)

  // Buscar custos operacionais do dia
  const { data: operationalCosts } = await supabase
    .from('operational_costs')
    .select('*')
    .eq('date', date)

  // Calcular totais
  const totalSales = transactions?.reduce((sum, t) => sum + (Number(t.total_value) || 0), 0) || 0
  const totalQuantitySold = transactions?.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0) || 0
  const totalCost = stockItems?.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0) || 0
  const operationalCost = operationalCosts?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0
  const totalCostWithOperational = totalCost + operationalCost
  const grossProfit = totalSales - totalCost
  const netProfit = grossProfit - operationalCost

  // Criar ou atualizar relatório diário
  const { data: report } = await supabase
    .from('daily_reports')
    .upsert({
      report_date: date,
      opening_id: opening.id,
      total_sales: totalSales,
      total_cost: totalCostWithOperational,
      gross_profit: grossProfit,
      net_profit: netProfit,
      total_quantity_sold: totalQuantitySold,
      products_sold_count: transactions?.length || 0
    })
    .select()
    .single()

  return report
}

export async function getDailyReport(date: string) {
  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('report_date', date)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

export async function getWeeklyReports(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .gte('report_date', startDate)
    .lte('report_date', endDate)
    .order('report_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getMonthlyReports(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`

  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .gte('report_date', startDate)
    .lte('report_date', endDate)
    .order('report_date', { ascending: true })

  if (error) throw error
  return data
}

// === ALERTAS AUTOMÁTICOS ===

export async function createAlert(alert: {
  alert_type: 'low_stock' | 'out_of_stock' | 'price_change' | 'loss' | 'warning'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: any
}) {
  const { data, error } = await supabase
    .from('alerts')
    .insert([alert])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAlerts(unreadOnly: boolean = false) {
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function markAlertAsRead(alertId: string) {
  const { error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', alertId)

  if (error) throw error
}

export async function resolveAlert(alertId: string) {
  const { error } = await supabase
    .from('alerts')
    .update({ 
      is_resolved: true,
      resolved_at: new Date().toISOString()
    })
    .eq('id', alertId)

  if (error) throw error
}

export async function checkLowStockAlerts() {
  const today = new Date().toISOString().split('T')[0]
  const { data: opening } = await supabase
    .from('daily_stock_opening')
    .select('*')
    .eq('opening_date', today)
    .single()

  if (!opening) return

  const { data: stockItems } = await supabase
    .from('daily_stock_items')
    .select('*, stock_categories(name)')
    .eq('opening_id', opening.id)

  if (!stockItems) return

  // Verificar estoque baixo (menos de 20% do inicial)
  stockItems.forEach((item: any) => {
    const initialQuantity = Number(item.initial_quantity)
    const currentQuantity = Number(item.current_quantity)
    const percentage = initialQuantity > 0 ? (currentQuantity / initialQuantity) * 100 : 0

    if (percentage < 20 && percentage > 0) {
      createAlert({
        alert_type: 'low_stock',
        title: `Estoque baixo: ${item.stock_categories?.name}`,
        message: `O estoque de ${item.stock_categories?.name} está com apenas ${percentage.toFixed(1)}% do inicial (${currentQuantity.toFixed(2)} KG de ${initialQuantity.toFixed(2)} KG)`,
        severity: 'medium',
        metadata: { stock_item_id: item.id, percentage }
      })
    } else if (percentage === 0) {
      createAlert({
        alert_type: 'out_of_stock',
        title: `Produto esgotado: ${item.stock_categories?.name}`,
        message: `O estoque de ${item.stock_categories?.name} está esgotado`,
        severity: 'critical',
        metadata: { stock_item_id: item.id }
      })
    }
  })
}

export async function checkLossAlerts() {
  const today = new Date().toISOString().split('T')[0]
  const { data: report } = await getDailyReport(today)

  if (report && Number(report.net_profit) < 0) {
    createAlert({
      alert_type: 'loss',
      title: 'Prejuízo detectado',
      message: `O lucro líquido de hoje está negativo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(report.net_profit))}`,
      severity: 'high',
      metadata: { report_id: report.id, net_profit: report.net_profit }
    })
  }
}
