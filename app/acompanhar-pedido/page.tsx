'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  FileText,
  Phone,
  ArrowLeft
} from 'lucide-react'

interface Order {
  id: string
  order_number?: number
  customer_name: string
  customer_phone?: string
  status: 'pending' | 'confirmed' | 'printing' | 'printed' | 'preparing' | 'ready' | 'left_for_delivery' | 'delivering' | 'delivered' | 'cancelled'
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  subtotal: number
  delivery_fee: number
  total: number
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
  pending: {
    label: 'Pedido Recebido',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Seu pedido foi recebido e está aguardando confirmação.'
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    description: 'Pagamento confirmado! Seu pedido está sendo preparado.'
  },
  printing: {
    label: 'Imprimindo',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: FileText,
    description: 'Seu cupom fiscal está sendo emitido.'
  },
  printed: {
    label: 'Impresso',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: CheckCircle,
    description: 'Cupom fiscal emitido com sucesso!'
  },
  preparing: {
    label: 'Preparando',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Package,
    description: 'Seu pedido está sendo preparado com cuidado.'
  },
  ready: {
    label: 'Pronto',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Seu pedido está pronto para entrega!'
  },
  left_for_delivery: {
    label: 'Saiu para Entrega',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: Truck,
    description: 'Seu pedido saiu para entrega!'
  },
  delivering: {
    label: 'Em Rota de Entrega',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Truck,
    description: 'Seu pedido está em rota de entrega!'
  },
  delivered: {
    label: 'Entregue',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Seu pedido foi entregue com sucesso!'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Clock,
    description: 'Seu pedido foi cancelado.'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function OrderTrackingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = searchParams.get('order')

  useEffect(() => {
    if (!orderId) {
      setError('ID do pedido não fornecido')
      setLoading(false)
      return
    }

    fetchOrder()
    
    // Configurar realtime para atualizações
    const supabase = createClient()
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrder(payload.new as Order)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      if (!data) throw new Error('Pedido não encontrado')
      
      setOrder(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppTrack = () => {
    if (!order) return
    
    const message = `Olá! Gostaria de acompanhar meu pedido #${order.id.slice(-8)}.\n\n` +
      `📦 Pedido: #${order.id.slice(-8)}\n` +
      `👤 Cliente: ${order.customer_name}\n` +
      `📱 Telefone: ${order.customer_phone || 'Não informado'}\n\n` +
      `Qual o status do meu pedido?`
    
    const whatsappUrl = `https://wa.me/558598888777?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações do pedido...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Pedido Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Não conseguimos encontrar as informações deste pedido.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStatus = statusConfig[order.status]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Acompanhar Pedido 🎯
          </h1>
          <p className="text-muted-foreground">
            Acompanhe em tempo real o status do seu pedido
          </p>
        </div>

        {/* Status do Pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <currentStatus.icon className="w-5 h-5" />
              Status do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`text-sm ${currentStatus.color}`}>
                {currentStatus.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                #{order.id.slice(-8)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {currentStatus.description}
            </p>
            
            {/* Timeline de Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Pedido recebido</span>
              </div>
              {order.status !== 'pending' && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    {order.payment_method === 'pix' 
                      ? (order.payment_status === 'paid' ? 'Pagamento PIX confirmado' : 'Aguardando pagamento PIX')
                      : (order.payment_status === 'paid' ? 'Pagamento confirmado' : 'Pagamento na entrega')
                    }
                  </span>
                </div>
              )}
              {['preparing', 'printing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status) && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Pedido em preparação</span>
                </div>
              )}
              {['ready', 'out_for_delivery', 'delivered'].includes(order.status) && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Pedido pronto</span>
                </div>
              )}
              {['out_for_delivery', 'delivered'].includes(order.status) && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Saiu para entrega</span>
                </div>
              )}
              {order.status === 'delivered' && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Pedido entregue</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Pedido */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Número do Pedido</p>
                <p className="font-medium">#{order.id.slice(-8)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data do Pedido</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <p className="font-medium capitalize">
                  {order.payment_method === 'pix' ? 'PIX' : 
                   order.payment_method === 'credit' ? 'Cartão de Crédito' :
                   order.payment_method === 'debit' ? 'Cartão de Débito' :
                   order.payment_method === 'money' ? 'Dinheiro' : 'Não informado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status do Pagamento</p>
                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {order.payment_status === 'paid' ? 'Pago' : 
                   order.payment_method === 'pix' ? 'Aguardando PIX' : 'Pagar na Entrega'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="font-medium">R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Taxa de Entrega</span>
                  <span className="font-medium">R$ {order.delivery_fee.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Desconto</span>
                  <span className="font-medium text-green-600">-R$ {order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">R$ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Itens do Pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit} × R$ {item.product_price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-medium">R$ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-4">
          <Button onClick={() => router.push('/')} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Início
          </Button>
          <Button onClick={handleWhatsAppTrack} variant="outline" className="flex-1">
            <Phone className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  )
}
