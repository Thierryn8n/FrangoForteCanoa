'use server'

import { createClient } from '@supabase/supabase-js'
import { EcommerceOrder, EcommerceOrderItem, Coupon, DeliveryArea, PrintJob } from '@/lib/types'
import { createPrintJob } from '@/lib/actions/pdv'
import { generateReceiptHTML, generateReceiptText } from '@/lib/print-agent'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// === PEDIDOS E-COMMERCE ===

export async function createEcommerceOrder(
  order: Omit<EcommerceOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'items'>,
  items: Omit<EcommerceOrderItem, 'id' | 'order_id' | 'created_at'>[]
): Promise<EcommerceOrder> {
  const { data: newOrder, error: orderError } = await supabase
    .from('ecommerce_orders')
    .insert([order])
    .select()
    .single()

  if (orderError) throw orderError

  if (items.length > 0) {
    const itemsWithOrderId = items.map(item => ({ ...item, order_id: newOrder.id }))
    const { error: itemsError } = await supabase
      .from('ecommerce_order_items')
      .insert(itemsWithOrderId)
    if (itemsError) throw itemsError
  }

  // Incrementar uso do cupom se usado
  if (order.coupon_id) {
    await supabase.rpc('increment_coupon_usage', { coupon_uuid: order.coupon_id })
  }

  // Criar print job para impressão automática
  const storeSettings = await getStoreSettingsForPrint()
  const payload = {
    order_number: newOrder.order_number,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    items: items.map(i => ({
      product_name: i.product_name,
      weight_kg: i.weight_kg,
      price_per_kg: i.price_per_kg,
      total_price: i.total_price
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    delivery_fee: order.delivery_fee,
    total: order.total,
    payment_method: order.payment_method || 'online',
    tracking_code: order.tracking_code,
    created_at: newOrder.created_at
  }

  await createPrintJob({
    source_order_id: newOrder.id,
    text_content: generateReceiptText(payload as any, storeSettings)
  })

  return { ...newOrder, items: [] } as EcommerceOrder
}

export async function getEcommerceOrders(limit = 50): Promise<EcommerceOrder[]> {
  const { data, error } = await supabase
    .from('ecommerce_orders')
    .select('*, items:ecommerce_order_items(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as EcommerceOrder[]
}

export async function getEcommerceOrder(id: string): Promise<EcommerceOrder> {
  const { data, error } = await supabase
    .from('ecommerce_orders')
    .select('*, items:ecommerce_order_items(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as EcommerceOrder
}

export async function updateEcommerceOrderStatus(
  id: string,
  status: EcommerceOrder['status'],
  trackingCode?: string
): Promise<EcommerceOrder> {
  const updates: any = { status }
  if (trackingCode) updates.tracking_code = trackingCode

  const { data, error } = await supabase
    .from('ecommerce_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as EcommerceOrder
}

export async function cancelEcommerceOrder(id: string): Promise<EcommerceOrder> {
  return updateEcommerceOrderStatus(id, 'cancelled')
}

// === ÁREAS DE ENTREGA ===

export async function getDeliveryAreas(): Promise<DeliveryArea[]> {
  const { data, error } = await supabase
    .from('delivery_areas')
    .select('*')
    .eq('is_active', true)
    .order('neighborhood')

  if (error) throw error
  return data as DeliveryArea[]
}

export async function getAllDeliveryAreas(): Promise<DeliveryArea[]> {
  const { data, error } = await supabase
    .from('delivery_areas')
    .select('*')
    .order('neighborhood')

  if (error) throw error
  return data as DeliveryArea[]
}

export async function createDeliveryArea(
  area: Omit<DeliveryArea, 'id' | 'created_at'>
): Promise<DeliveryArea> {
  const { data, error } = await supabase
    .from('delivery_areas')
    .insert([area])
    .select()
    .single()

  if (error) throw error
  return data as DeliveryArea
}

export async function updateDeliveryArea(
  id: string,
  area: Partial<DeliveryArea>
): Promise<DeliveryArea> {
  const { data, error } = await supabase
    .from('delivery_areas')
    .update(area)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DeliveryArea
}

export async function deleteDeliveryArea(id: string): Promise<void> {
  const { error } = await supabase.from('delivery_areas').delete().eq('id', id)
  if (error) throw error
}

// === CUPONS ===

export async function getCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Coupon[]
}

export async function validateCoupon(
  code: string,
  orderTotal: number
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return { valid: false, error: 'Cupom não encontrado ou inativo.' }
  }

  const coupon = data as Coupon
  const now = new Date()

  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, error: 'Cupom ainda não está válido.' }
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, error: 'Cupom expirado.' }
  }

  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { valid: false, error: 'Cupom esgotado.' }
  }

  if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
    return {
      valid: false,
      error: `Pedido mínimo para este cupom: R$ ${coupon.min_order_value.toFixed(2)}`
    }
  }

  return { valid: true, coupon }
}

export async function createCoupon(
  coupon: Omit<Coupon, 'id' | 'current_uses' | 'created_at'>
): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .insert([{ ...coupon, code: coupon.code.toUpperCase(), current_uses: 0 }])
    .select()
    .single()

  if (error) throw error
  return data as Coupon
}

export async function updateCoupon(id: string, coupon: Partial<Coupon>): Promise<Coupon> {
  if (coupon.code) coupon.code = coupon.code.toUpperCase()

  const { data, error } = await supabase
    .from('coupons')
    .update(coupon)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Coupon
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw error
}

// === CÁLCULO DE FRETE ===

export async function calculateDelivery(
  areaId: string,
  subtotal: number
): Promise<{ fee: number; isFree: boolean; estimatedMinutes?: number }> {
  const { data: area } = await supabase
    .from('delivery_areas')
    .select('*')
    .eq('id', areaId)
    .single()

  if (!area) return { fee: 0, isFree: false }

  const { data: settings } = await supabase
    .from('store_settings')
    .select('shipping_settings')
    .single()

  const freeShippingMin = settings?.shipping_settings?.free_shipping_min_total ?? 0
  const isFree = freeShippingMin > 0 && subtotal >= freeShippingMin

  return {
    fee: isFree ? 0 : area.delivery_fee,
    isFree,
    estimatedMinutes: area.estimated_time_minutes
  }
}

// === STORE SETTINGS (helper interno) ===

async function getStoreSettingsForPrint() {
  const { data } = await supabase.from('store_settings').select('*').single()
  return data
}
