import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingBag, Clock, Package, MapPin, Phone, CreditCard, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Order, OrderItem } from '@/lib/types'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  preparing: { label: 'Preparando', variant: 'default' },
  delivering: { label: 'Em Entrega', variant: 'default' },
  delivered: { label: 'Entregue', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
}

const paymentLabels: Record<string, string> = {
  pix: 'PIX',
  money: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
}

export default async function PedidosPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Fetch all orders with items
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const activeOrders = orders?.filter(o => ['pending', 'confirmed', 'preparing', 'delivering'].includes(o.status)) || []
  const completedOrders = orders?.filter(o => ['delivered', 'cancelled'].includes(o.status)) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Meus Pedidos</h1>
        <p className="text-muted-foreground mt-1">Acompanhe todos os seus pedidos</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Em Andamento ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Histórico ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length > 0 ? (
            activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} formatCurrency={formatCurrency} formatDate={formatDate} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">Nenhum pedido em andamento</h3>
                <p className="text-muted-foreground mb-4">
                  Você não tem pedidos ativos no momento.
                </p>
                <Button asChild>
                  <Link href="/#cardapio">Fazer um Pedido</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedOrders.length > 0 ? (
            completedOrders.map((order) => (
              <OrderCard key={order.id} order={order} formatCurrency={formatCurrency} formatDate={formatDate} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">Nenhum pedido no histórico</h3>
                <p className="text-muted-foreground mb-4">
                  Seu histórico de pedidos aparecerá aqui.
                </p>
                <Button asChild>
                  <Link href="/#cardapio">Fazer Primeiro Pedido</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface OrderCardProps {
  order: Order & { items: OrderItem[] }
  formatCurrency: (value: number) => string
  formatDate: (date: string) => string
}

function OrderCard({ order, formatCurrency, formatDate }: OrderCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4" />
                {formatDate(order.created_at)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusLabels[order.status]?.variant || 'secondary'} className="text-sm">
              {statusLabels[order.status]?.label || order.status}
            </Badge>
            <span className="text-xl font-bold text-primary">{formatCurrency(Number(order.total))}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Timeline */}
        <div className="relative">
          <div className="flex justify-between text-sm">
            {['pending', 'confirmed', 'preparing', 'delivering', 'delivered'].map((status, index) => {
              const currentIndex = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered'].indexOf(order.status)
              const isActive = index <= currentIndex
              const isCancelled = order.status === 'cancelled'
              
              return (
                <div key={status} className="flex flex-col items-center flex-1">
                  <div className={`w-4 h-4 rounded-full ${
                    isCancelled ? 'bg-destructive/30' :
                    isActive ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <span className={`text-xs mt-1 hidden md:block ${
                    isActive && !isCancelled ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {statusLabels[status]?.label}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="absolute top-2 left-0 right-0 h-0.5 bg-muted -z-10">
            <div 
              className={`h-full ${order.status === 'cancelled' ? 'bg-destructive/30' : 'bg-primary'} transition-all`}
              style={{ 
                width: order.status === 'cancelled' ? '100%' : 
                  `${(['pending', 'confirmed', 'preparing', 'delivering', 'delivered'].indexOf(order.status) / 4) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Endereço de Entrega</p>
              <p className="text-sm text-muted-foreground">
                {order.delivery_address}
                {order.delivery_neighborhood && `, ${order.delivery_neighborhood}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Contato</p>
              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Pagamento</p>
              <p className="text-sm text-muted-foreground">
                {paymentLabels[order.payment_method] || order.payment_method}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Itens do Pedido</p>
            <div className="space-y-2">
              {order.items.map((item: OrderItem) => (
                <div key={item.id} className="flex justify-between items-center text-sm bg-muted/50 p-3 rounded-lg">
                  <div>
                    <span className="font-medium">{item.quantity}x</span> {item.product_name}
                  </div>
                  <span className="font-medium">{formatCurrency(Number(item.total_price))}</span>
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Entrega</span>
                <span>{formatCurrency(Number(order.delivery_fee))}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {order.delivery_notes && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Observações</p>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {order.delivery_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
