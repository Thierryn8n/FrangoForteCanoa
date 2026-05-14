export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price: number
  price_per_kg: number
  original_price: number | null
  unit: string
  image_url: string | null
  category_id: string | null
  is_active: boolean
  is_featured: boolean
  stock_quantity: number
  min_order_quantity: number
  created_at: string
  updated_at: string
  category?: Category
}

export interface Kit {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  original_price: number | null
  image_url: string | null
  contents: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  cpf: string | null
  address: string | null
  address_number: string | null
  address_complement: string | null
  neighborhood: string | null
  city: string
  state: string
  zip_code: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number?: number
  customer_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_address: string
  delivery_number: string | null
  delivery_complement: string | null
  delivery_neighborhood: string
  delivery_city: string
  delivery_state: string
  delivery_zip: string | null
  delivery_notes: string | null
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  payment_method: string | null
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  status: 'pending' | 'confirmed' | 'printing' | 'printed' | 'preparing' | 'ready' | 'left_for_delivery' | 'delivering' | 'delivered' | 'cancelled'
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  kit_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  product?: Product
  kit?: Kit
}

export interface Testimonial {
  id: string
  customer_name: string
  content: string
  rating: number
  is_active: boolean
  created_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  is_active: boolean
  created_at: string
}

export interface StoreSetting {
  id: string
  key: string
  value: string | null
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

export interface CartItem {
  id: string
  type: 'product' | 'kit'
  name: string
  price: number
  quantity: number
  unit: string
  image_url: string | null
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  total: number
}

export interface CustomerAddress {
  id: string
  customer_id: string
  label: string
  address: string
  address_number: string | null
  address_complement: string | null
  neighborhood: string | null
  city: string
  state: string
  zip_code: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CustomerFavorite {
  id: string
  customer_id: string
  product_id: string | null
  kit_id: string | null
  created_at: string
  product?: Product
  kit?: Kit
}

// === PDV/CAIXA SYSTEM ===

export interface PdvProduct {
  id: string
  name: string
  slug: string
  description?: string
  short_description?: string
  price: number
  price_per_kg: number
  original_price?: number
  unit?: string
  category_id?: string
  validity_days?: number
  image_url?: string
  cover_image_url?: string
  product_kind: 'regular' | 'audio'
  requires_album_cover: boolean
  is_active: boolean
  stock_quantity?: number
  min_order_quantity?: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  image_variants?: { thumbnail?: string; medium?: string; large?: string }
  title?: string
  sort_order: number
  is_primary: boolean
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface PdvCategory {
  id: string
  name: string
  icon?: string
  color?: string
  created_at: string
}

// Pedidos PDV
export interface PdvOrder {
  id: string
  order_number: number
  customer_name?: string
  customer_phone?: string
  subtotal: number
  discount: number
  total: number
  payment_method: 'money' | 'credit' | 'debit' | 'pix'
  status: 'pending' | 'completed' | 'cancelled'
  notes?: string
  cashier_id?: string
  created_at: string
  updated_at: string
  items?: PdvOrderItem[]
}

export interface PdvOrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  weight_kg: number
  price_per_kg: number
  total_price: number
  validity_date?: string
  created_at: string
}

// Pedidos E-commerce
export interface EcommerceOrder {
  id: string
  order_number: number
  customer_id?: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_tax_id?: string
  delivery_address_id?: string
  delivery_street?: string
  delivery_number?: string
  delivery_complement?: string
  delivery_neighborhood?: string
  delivery_city?: string
  delivery_state?: string
  delivery_zip_code?: string
  subtotal: number
  delivery_fee: number
  discount: number
  coupon_code?: string
  coupon_id?: string
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  tracking_code?: string
  payment_method?: string
  payment_id?: string
  created_at: string
  updated_at: string
  items?: EcommerceOrderItem[]
}

export interface EcommerceOrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  weight_kg: number
  price_per_kg: number
  total_price: number
  created_at: string
}

// Configurações
export interface StoreSettings {
  id: string
  store_name?: string
  cnpj?: string
  address?: string
  phone?: string
  logo_url?: string
  description?: string
  payment_settings?: {
    gateway?: string
    pix_enabled?: boolean
    card_enabled?: boolean
    transaction_fee_percent?: number
    stripe_enabled?: boolean
    stripe_test_mode?: boolean
    stripe_public_key?: string
    stripe_secret_key?: string
    stripe_webhook_secret?: string
    pix_key?: string
    pix_qr_code_url?: string
  }
  shipping_settings?: {
    carrier_name?: string
    default_deadline_days?: number
    default_price?: number
    free_shipping_min_total?: number
    express_shipping_enabled?: boolean
    express_shipping_price?: number
    express_shipping_deadline?: number
  }
  general_settings?: {
    currency?: string
    language?: string
    timezone?: string
    contact_email?: string
    contact_phone?: string
    whatsapp_number?: string
    facebook_url?: string
    instagram_url?: string
    meta_title?: string
    meta_description?: string
  }
  owner_id?: string
  created_at: string
  updated_at: string
}

export interface DeliveryArea {
  id: string
  neighborhood: string
  delivery_fee: number
  estimated_time_minutes?: number
  is_active: boolean
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_value?: number
  max_uses?: number
  current_uses: number
  valid_from?: string
  valid_until?: string
  is_active: boolean
  created_at: string
}

// Print Agent
export interface PrintJob {
  id: string
  source_channel: 'pos' | 'online'
  source_order_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  payload?: any
  html_content?: string
  text_content?: string
  created_at: string
  printed_at?: string
}

// Usuário
export interface Profile {
  id: string
  email?: string
  name?: string
  phone?: string
  role: 'admin' | 'owner' | 'cashier'
  is_active: boolean
  created_at: string
  updated_at: string
}

// Cart Item Local
export interface PdvCartItem {
  id: string
  product: PdvProduct
  weight_kg: number
  price_per_kg: number
  total_price: number
}
