'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { PosOrderModal } from '@/components/caixa/pos-order-modal'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle, 
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Order {
  id: string
  order_number?: number
  customer_name: string
  customer_phone?: string
  customer_email?: string
  delivery_address?: string
  delivery_number?: string
  delivery_complement?: string
  delivery_neighborhood?: string
  delivery_city?: string
  delivery_state?: string
  delivery_zip?: string
  delivery_notes?: string
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  status: 'pending' | 'confirmed' | 'printing' | 'printed' | 'preparing' | 'ready' | 'left_for_delivery' | 'delivering' | 'delivered' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  tracking_code?: string
  tracking_url?: string
  printed_at?: string
  started_preparation_at?: string
  left_for_delivery_at?: string
  delivery_partner?: string
  estimated_delivery_minutes?: number
  order_items: {
    id: string
    product_name: string
    product_price: number
    quantity: number
    unit: string
    subtotal: number
  }[]
}

const statusConfig = {
  confirmed: {
    label: '💳 Pagamento Confirmado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    nextStatus: 'preparing'
  },
  preparing: {
    label: '👨‍🍳 Preparando',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Package,
    nextStatus: 'left_for_delivery'
  },
  left_for_delivery: {
    label: '🚚 Saindo para Entrega',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: Truck,
    nextStatus: 'delivered'
  },
  delivered: {
    label: '✅ Entregue',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    nextStatus: null
  },
  cancelled: {
    label: '❌ Cancelado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    nextStatus: null
  }
}

export default function CaixaPage() {
  const { user, customer } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  // Acesso totalmente liberado - sem verificação de autenticação

  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [showPosOrderModal, setShowPosOrderModal] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [itemsPerView] = useState(4)
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null)
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)
  const dragCounter = useRef(0)

  useEffect(() => {
    fetchOrders()
  }, [user, supabase])

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
      // Se der erro de autenticação, tenta com acesso público
      try {
        const { data: publicData, error: publicError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .order('created_at', { ascending: false })

        if (!publicError && publicData) {
          setOrders(publicData)
        }
      } catch (publicError) {
        console.error('Erro ao buscar pedidos públicos:', publicError)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel(`caixa_orders-${Date.now()}`) // Adicionar timestamp para evitar cache
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔄 Realtime update:', payload)
          
          if (payload.eventType === 'UPDATE') {
            setOrders(prev => 
              prev.map(order => 
                order.id === payload.new.id 
                  ? { ...order, ...payload.new } as Order
                  : order
              )
            )
          } else if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev])
          }
          
          // Forçar refresh completo a cada update para evitar cache
          setTimeout(() => {
            fetchOrders()
          }, 2000)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado ao caixa')
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('⚠️ Realtime desconectado, reconectando...')
          setTimeout(() => {
            fetchOrders()
          }, 3000)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Auto-update para Entregue após 30 minutos
  useEffect(() => {
    const checkAutoDeliver = async () => {
      const now = new Date()
      
      for (const order of orders) {
        if (order.status === 'left_for_delivery' && order.left_for_delivery_at) {
          const deliveryTime = new Date(order.left_for_delivery_at)
          const minutesSinceDelivery = (now.getTime() - deliveryTime.getTime()) / (1000 * 60)
          
          // Se passou 30 minutos, marcar como entregue
          if (minutesSinceDelivery >= 30) {
            console.log(`🚚 Pedido ${order.id} entregue automaticamente após 30 minutos`)
            
            try {
              const { error } = await supabase
                .from('orders')
                .update({
                  status: 'delivered',
                  delivered_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', order.id)
              
              if (error) {
                console.error('Erro ao marcar pedido como entregue:', error)
              }
            } catch (error) {
              console.error('Erro no auto-delivery:', error)
            }
          }
        }
      }
    }

    // Verificar a cada minuto
    const interval = setInterval(checkAutoDeliver, 60000)
    
    // Verificar imediatamente
    checkAutoDeliver()

    return () => clearInterval(interval)
  }, [orders, supabase])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    console.log('Atualizando status:', orderId, 'para', newStatus)
    setUpdatingOrder(orderId)
    
    // Salvar status antigo para reverter se necessário
    const oldOrder = orders.find(order => order.id === orderId)
    const oldStatus = oldOrder?.status
    
    // Atualizar localmente imediatamente para garantir feedback visual
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus as Order['status'], updated_at: new Date().toISOString() }
        : order
    ))
    
    // Preparar dados de atualização
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Adicionar timestamp específico para left_for_delivery
    if (newStatus === 'left_for_delivery') {
      updateData.left_for_delivery_at = new Date().toISOString()
    }

    // Tentar atualizar no banco em background (não bloquear interface)
    try {
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) {
        console.error('Erro ao atualizar status:', error)
        // Reverter estado local se deu erro
        if (oldStatus) {
          setOrders(prev => 
            prev.map(order => 
              order.id === orderId 
                ? { ...order, status: oldStatus }
                : order
            )
          )
        }
        setUpdatingOrder(null)
        return
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
    
    // Se status for "printing", criar job de impressão automaticamente
    if (newStatus === 'printing') {
        try {
          // Buscar dados do pedido para verificar método de pagamento
          const { data: orderData } = await supabase
            .from('orders')
            .select('payment_method, payment_status')
            .eq('id', orderId)
            .single()

          if (orderData) {
            // Apenas PIX precisa de aprovação e impressão
            // Outros métodos (dinheiro, cartão, etc) passam livres sem impressão
            if (orderData.payment_method === 'pix' && orderData.payment_status === 'paid') {
              const response = await fetch('/api/print-job', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId: orderId,
                  agentId: 'PRINT-AGENT-01'
                })
              })

              if (response.ok) {
                const result = await response.json()
                console.log('Job de impressão criado para PIX:', result)
              } else {
                console.error('Erro ao criar job de impressão PIX:', await response.text())
              }
            } else if (orderData.payment_method !== 'pix') {
              console.log(`Pedido ${orderId} com pagamento ${orderData.payment_method} não precisa de impressão`)
            } else {
              console.log(`Pedido ${orderId} com PIX ainda não pago, status: ${orderData.payment_status}`)
            }
          }
        } catch (printError) {
          console.error('Erro ao verificar método de pagamento:', printError)
        }
      }

      // Atualizar status localmente
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as Order['status'] }
            : order
        )
      )
      
      setUpdatingOrder(null)
  }

  // Funções de navegação do carrossel
  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => Math.max(0, prev - itemsPerView))
  }

  const handleNextCarousel = () => {
    const maxIndex = Math.max(0, statusColumns.length - itemsPerView)
    setCarouselIndex((prev) => Math.min(maxIndex, prev + itemsPerView))
  }

  // Funções de drag/drop com navegação automática do carrossel
  const handleDragStart = (e: React.DragEvent, order: Order) => {
    console.log('Drag start:', order.id)
    setDraggedOrder(order)
    dragCounter.current = 0
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', order.id)
  }

  const handleDragEnd = () => {
    setDraggedOrder(null)
    setDragDirection(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Detectar direção do drag
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    
    if (x < width * 0.1) {
      setDragDirection('left')
    } else if (x > width * 0.9) {
      setDragDirection('right')
    } else {
      setDragDirection(null)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      e.currentTarget.classList.remove('bg-primary/10')
      setDragDirection(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-primary/10')
    dragCounter.current = 0
    setDragDirection(null)

    if (draggedOrder && draggedOrder.status !== targetStatus) {
      // Admin pode arrastar qualquer pedido para o status exato de destino
      updateOrderStatus(draggedOrder.id, targetStatus)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.currentTarget.classList.add('bg-primary/10')
    dragCounter.current++
  }

  const filteredOrders = orders.filter(order => {
    const matchesFilter = statusFilter === 'all' || order.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm)
    
    return matchesFilter && matchesSearch
  })

  const statusColumns = Object.entries(statusConfig).map(([status, config]) => ({
    status,
    ...config,
    orders: filteredOrders.filter(order => order.status === status)
  }))

  // Auto-navegação do carrossel ao arrastar para bordas
  useEffect(() => {
    if (dragDirection === 'left' && carouselIndex > 0) {
      const timer = setTimeout(() => {
        handlePrevCarousel()
      }, 500)
      return () => clearTimeout(timer)
    } else if (dragDirection === 'right' && carouselIndex < statusColumns.length - itemsPerView) {
      const timer = setTimeout(() => {
        handleNextCarousel()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [dragDirection, carouselIndex, statusColumns.length, itemsPerView])

  // Removida verificação de acesso - página totalmente liberada

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Organizar Pedidos
              </h1>
              <p className="text-muted-foreground">
                Gerencie status dos pedidos em tempo real
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.open('/caixa', '_blank')}
                className="gap-2"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Voltar ao Caixa
              </Button>
              <Button 
                onClick={() => setShowPosOrderModal(true)}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Pedido PDV
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pos">Pedidos PDV</SelectItem>
                  <SelectItem value="online">Pedidos Online</SelectItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={fetchOrders}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="flex flex-wrap gap-2 mb-4">
          {statusColumns.map(({ status, label, color, icon: Icon, orders }) => (
            <Card key={status} className="flex-1 min-w-[120px] hover:shadow-md transition-shadow border-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${color} shadow-sm`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-bold text-foreground leading-tight">
                      {orders.length}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban Board - Carrossel Horizontal com 4 Colunas */}
        <div className="relative">
          {/* Navegação do Carrossel */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevCarousel}
              disabled={carouselIndex === 0}
              className="shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">
                Painel do Caixa
              </h2>
              <p className="text-sm text-muted-foreground">
                {Math.floor(carouselIndex / itemsPerView) + 1} de {Math.ceil(statusColumns.length / itemsPerView)}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextCarousel}
              disabled={carouselIndex >= statusColumns.length - itemsPerView}
              className="shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Indicadores do Carrossel */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: Math.ceil(statusColumns.length / itemsPerView) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCarouselIndex(index * itemsPerView)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(carouselIndex / itemsPerView) === index ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Grid com 4 Colunas Visíveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden">
            {statusColumns.slice(carouselIndex, carouselIndex + itemsPerView).map(({ status, label, color, icon: StatusIcon, orders }) => (
              <div key={status} className="space-y-4">
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg shadow-sm">
                  <StatusIcon className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm text-foreground flex-1">
                    {label}
                  </h3>
                  <Badge variant="outline" className="ml-auto text-xs px-2 py-0.5 h-5 bg-background/80">
                    {orders.length}
                  </Badge>
                </div>

                <div 
                  className={`min-h-[350px] p-2 bg-gradient-to-b from-background to-muted/10 rounded-lg border ${
                    dragDirection === 'left' ? 'border-l-4 border-l-blue-500 border-dashed' : 
                    dragDirection === 'right' ? 'border-r-4 border-r-blue-500 border-dashed' : 
                    'border-dashed border-muted/50'
                  } shadow-inner`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDragEnter={handleDragEnter}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <Card 
                        key={order.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-move hover:shadow-md transition-shadow ${
                          (order as any).source === 'pos' 
                            ? 'border-2 border-green-500 bg-green-50' 
                            : (order as any).source === 'online'
                            ? 'border-2 border-blue-500 bg-blue-50'
                            : ''
                        } ${updatingOrder === order.id ? 'opacity-50' : ''} ${
                          draggedOrder?.id === order.id ? 'opacity-30' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">
                                #{order.id.slice(-8)}
                              </p>
                              {(order as any).source === 'pos' && (
                                <Badge className="bg-green-600 text-white text-xs">
                                  PDV
                                </Badge>
                              )}
                              {(order as any).source === 'online' && (
                                <Badge className="bg-blue-600 text-white text-xs">
                                  Online
                                </Badge>
                              )}
                            </div>
                            <Badge className={color}>
                              {label}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{order.customer_name}</p>
                            {order.customer_phone && (
                              <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(order.created_at)}
                            </p>
                            <p className="text-sm font-bold text-primary">
                              {formatPrice(order.total)}
                            </p>
                          </div>
                          <div className="mt-2 space-y-1">
                            {order.order_items?.slice(0, 2).map((item, index) => (
                              <p key={index} className="text-xs text-muted-foreground">
                                {item.quantity}x {item.product_name}
                              </p>
                            ))}
                            {order.order_items && order.order_items.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{order.order_items.length - 2} itens
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    
    {/* Modal de Pedido PDV */}
    {showPosOrderModal && (
      <PosOrderModal
        onClose={() => setShowPosOrderModal(false)}
        onSuccess={(order) => {
          setShowPosOrderModal(false)
          fetchOrders() // Atualizar lista de pedidos
        }}
      />
    )}
    </div>
  </div>
  )
}
