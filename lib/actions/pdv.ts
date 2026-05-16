'use server'

import { createClient } from '@supabase/supabase-js'
import { PdvProduct, PdvOrder, PdvOrderItem, PrintJob, Kit } from '@/lib/types'
import { generateReceiptText } from '@/lib/print-agent'
import { getTodayStockOpening, createStockTransaction, getDailyStockItems } from './stock'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// === PRODUTOS ===

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data as PdvProduct[]
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as PdvProduct
}

export async function createProduct(product: Partial<PdvProduct>) {
  console.log('Creating product:', JSON.stringify(product, null, 2))
  let result = await supabase
    .from('products')
    .insert([product])
    .select()
    .single()

  // Se falhou por colunas PDV inexistentes, tentar apenas com campos ecommerce
  if (result.error && (
    result.error.message?.includes('slug') ||
    result.error.message?.includes('product_kind') ||
    result.error.message?.includes('validity_days') ||
    result.error.message?.includes('requires_album_cover') ||
    result.error.message?.includes('cover_image_url')
  )) {
    console.log('Campos PDV ausentes, tentando com schema basico...')
    const { slug, product_kind, validity_days, requires_album_cover, cover_image_url, ...basicProduct } = product
    result = await supabase
      .from('products')
      .insert([basicProduct])
      .select()
      .single()
  }

  if (result.error) {
    console.error('Supabase insert error:', result.error)
    throw new Error(`Erro ao criar produto: ${result.error.message} (${result.error.code})`)
  }
  return result.data as PdvProduct
}

export async function updateProduct(id: string, product: Partial<PdvProduct>) {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PdvProduct
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// === CATEGORIAS ===

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function createCategory(category: { name: string; icon?: string; color?: string }) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(id: string, category: { name?: string; icon?: string; color?: string }) {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// === IMAGENS ===

export async function getProductImages(productId: string) {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order')

  if (error) throw error
  return data
}

export async function setPrimaryImage(productId: string, imageId: string) {
  // Remove primary de todas as imagens
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  // Define nova primary
  const { data: image, error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .select()
    .single()

  if (error) throw error

  // Atualiza cover_image_url do produto
  await supabase
    .from('products')
    .update({ cover_image_url: image.image_url })
    .eq('id', productId)

  return image
}

export async function deleteProductImage(imageId: string) {
  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (error) throw error
}

// === PEDIDOS PDV ===

export async function createPdvOrder(order: Partial<PdvOrder>, items: Partial<PdvOrderItem>[]) {
  try {
    console.log('createPdvOrder - input order:', JSON.stringify(order, null, 2))
    console.log('createPdvOrder - input items:', JSON.stringify(items, null, 2))

    // Mapear campos do PdvOrder para o schema da tabela orders
    const dbOrder = {
      customer_name: order.customer_name || 'Cliente',
      customer_phone: order.customer_phone || null,
      delivery_address: (order as any).customer_address || null,
      status: 'confirmed', // PDV inicia como confirmado, print-agent processa
      payment_method: order.payment_method === 'money' ? 'cash' : 
                      order.payment_method === 'pix' ? 'pix' : 
                      order.payment_method === 'credit' ? 'credit_card' : 
                      order.payment_method === 'debit' ? 'debit_card' : 'cash',
      payment_status: order.status === 'pending' ? 'pending' : 'paid',
      subtotal: order.subtotal || 0,
      delivery_fee: 0,
      total: order.total || 0,
      notes: order.notes || null,
      user_id: null // Importante: null para pedidos PDV (sem auth)
    }

    console.log('createPdvOrder - dbOrder:', JSON.stringify(dbOrder, null, 2))

    // Criar pedido
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([dbOrder])
      .select()
      .single()

    if (orderError) {
      console.error('createPdvOrder - orderError:', orderError)
      throw orderError
    }

    console.log('createPdvOrder - newOrder:', newOrder)

    // Mapear itens para o schema da tabela order_items
    if (items.length > 0) {
      const dbItems = items.map(item => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.price_per_kg || 0,
        quantity: Math.round((item.weight_kg || 1) * 1000), // converter kg para gramas como quantidade
        unit: 'kg',
        subtotal: item.total_price || 0
      }))

      console.log('createPdvOrder - dbItems:', JSON.stringify(dbItems, null, 2))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(dbItems)

      if (itemsError) {
        console.error('createPdvOrder - itemsError:', itemsError)
        throw itemsError
      }
    }

    // Criar print job para impressão automática (como no e-commerce)
    if (order.payment_method === 'pix' && order.status === 'completed') {
      try {
        const storeSettings = await getStoreSettings()
        const payload = {
          order_number: parseInt(newOrder.id?.slice(-8) || '0', 16),
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          items: items.map(i => ({
            product_name: i.product_name,
            weight_kg: i.weight_kg || 1,
            price_per_kg: i.price_per_kg || 0,
            total_price: i.total_price || 0
          })),
          subtotal: order.subtotal || 0,
          discount: order.discount || 0,
          total: order.total || 0,
          payment_method: order.payment_method || 'pix',
          created_at: newOrder.created_at
        }

        await createPrintJob({
          source_order_id: newOrder.id,
          text_content: generateReceiptText(payload as any, storeSettings)
        })
      } catch (printError) {
        console.error('createPdvOrder - printError:', printError)
        // Não falhar o pedido se a impressão falhar
      }
    }

    // Registrar transações de estoque automaticamente
    try {
      const todayOpening = await getTodayStockOpening()
      if (todayOpening) {
        const stockItems = await getDailyStockItems(todayOpening.id)
        
        for (const item of items) {
          // Encontrar o item de estoque correspondente
          const stockItem = stockItems.find(si => si.product_id === item.product_id)
          
          if (stockItem) {
            const weightKg = item.weight_kg || 1
            const unitPrice = item.price_per_kg || 0
            const totalValue = item.total_price || 0
            
            await createStockTransaction({
              opening_id: todayOpening.id,
              stock_item_id: stockItem.id,
              transaction_type: 'sale',
              quantity: weightKg,
              unit: 'kg',
              unit_price: unitPrice,
              total_value: totalValue,
              order_id: newOrder.id,
              notes: `Venda PDV - ${item.product_name}`
            })
          }
        }
      }
    } catch (stockError) {
      console.error('createPdvOrder - stockError:', stockError)
      // Não falhar o pedido se o registro de estoque falhar
    }

    return newOrder
  } catch (error) {
    console.error('createPdvOrder - final error:', error)
    throw error
  }
}

export async function getPdvOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export async function cancelPdvOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}

// === PRINT JOBS ===

export async function createPrintJob(job: Partial<PrintJob>) {
  // Inserir diretamente na tabela print_jobs com campos validos do schema
  const { data, error } = await supabase
    .from('print_jobs')
    .insert([{
      order_id: job.source_order_id || null,
      text_content: job.text_content || '',
      status: 'queued',
      agent_id: 'PRINT-AGENT-01'
    }])
    .select()
    .single()

  if (error) throw error
  return data as PrintJob
}

export async function getPrintJobs(status?: string) {
  let query = supabase.from('print_jobs').select('*')

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data as PrintJob[]
}

export async function updatePrintJobStatus(jobId: string, status: string, printed_at?: string) {
  const updates: any = { status }
  if (printed_at) updates.printed_at = printed_at

  const { data, error } = await supabase
    .from('print_jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw error
  return data as PrintJob
}

// === CONFIGURAÇÕES ===

export async function getStoreSettings() {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar store_settings:', error)
    throw new Error('Erro ao buscar configuracoes: ' + error.message)
  }

  if (!data) {
    // Se não existe nenhuma linha, criar padrão
    console.log('Nenhuma configuracao encontrada, criando padrao...')
    const { data: newSettings, error: insertError } = await supabase
      .from('store_settings')
      .insert([{
        store_name: 'Frango Forte Canoa',
        shipping_settings: { default_price: 5, free_shipping_min_total: 150 },
        payment_settings: { gateway: 'manual', pix_enabled: true, card_enabled: true }
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar configuracao padrao:', insertError)
      throw new Error('Erro ao criar configuracao padrao: ' + insertError.message)
    }
    return newSettings
  }

  return data
}

export async function updateStoreSettings(settings: any) {
  // Se não tem ID, buscar o primeiro registro para pegar o ID
  let targetId = settings.id
  if (!targetId) {
    const { data: existing } = await supabase
      .from('store_settings')
      .select('id')
      .limit(1)
      .single()
    if (existing?.id) {
      targetId = existing.id
    } else {
      throw new Error('Nenhuma configuracao encontrada no banco de dados.')
    }
  }

  const { data, error } = await supabase
    .from('store_settings')
    .update(settings)
    .eq('id', targetId)
    .select()

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Nenhuma linha foi atualizada. Verifique se o ID existe.')
  }
  return data[0]
}

// === KITS ===

export async function getKits(onlyFeatured = false) {
  let query = supabase
    .from('kits')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (onlyFeatured) {
    query = query.eq('is_featured', true).limit(3)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createKit(kit: Partial<Kit>) {
  const { data, error } = await supabase
    .from('kits')
    .insert([kit])
    .select()
    .single()

  if (error) throw error
  return data as Kit
}

export async function updateKit(id: string, kit: Partial<Kit>) {
  const { data, error } = await supabase
    .from('kits')
    .update(kit)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Kit
}

export async function deleteKit(id: string) {
  const { error } = await supabase.from('kits').delete().eq('id', id)
  if (error) throw error
}

// === NEWSLETTER ===

export async function subscribeNewsletter(email: string) {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert([{ email }], { onConflict: 'email' })

  if (error) throw error
  return { success: true }
}

export async function getNewsletterSubscribers() {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
