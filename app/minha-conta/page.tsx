import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Heart, MapPin, TrendingUp, Clock, Package } from 'lucide-react'
import Link from 'next/link'
import type { Order, CustomerFavorite, CustomerAddress } from '@/lib/types'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  preparing: { label: 'Preparando', variant: 'default' },
  delivering: { label: 'Em Entrega', variant: 'default' },
  delivered: { label: 'Entregue', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
}

export default async function MinhaContaPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Fetch customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch favorites count
  const { count: favoritesCount } = await supabase
    .from('customer_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)

  // Fetch addresses count
  const { count: addressesCount } = await supabase
    .from('customer_addresses')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)

  // Stats calculations
  const totalOrders = orders?.length || 0
  const totalSpent = orders?.reduce((acc, order) => acc + Number(order.total), 0) || 0

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-primary-foreground">
        <h1 className="text-2xl md:text-3xl font-bold">
          Olá, {customer?.full_name || user.email?.split('@')[0]}!
        </h1>
        <p className="mt-2 opacity-90">
          Bem-vindo de volta ao Frango Forte Canoa. Aqui você pode acompanhar seus pedidos e gerenciar sua conta.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOrders}</p>
              <p className="text-sm text-muted-foreground">Pedidos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-secondary/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-muted-foreground">Total Gasto</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <Heart className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{favoritesCount || 0}</p>
              <p className="text-sm text-muted-foreground">Favoritos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-accent/20 rounded-lg">
              <MapPin className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{addressesCount || 0}</p>
              <p className="text-sm text-muted-foreground">Endereços</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Seus últimos pedidos realizados</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/minha-conta/pedidos">Ver Todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <div
                  key={order.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/50 rounded-lg gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-11 md:ml-0">
                    <Badge variant={statusLabels[order.status]?.variant || 'secondary'}>
                      {statusLabels[order.status]?.label || order.status}
                    </Badge>
                    <p className="font-bold text-primary">{formatCurrency(Number(order.total))}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não fez nenhum pedido.</p>
              <Button asChild className="mt-4">
                <Link href="/#cardapio">Fazer Primeiro Pedido</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6 text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Meus Pedidos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Acompanhe o status dos seus pedidos
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/minha-conta/pedidos">Ver Pedidos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6 text-center">
            <div className="p-4 bg-destructive/10 rounded-full w-fit mx-auto mb-4">
              <Heart className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="font-semibold mb-2">Favoritos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Seus produtos favoritos salvos
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/minha-conta/favoritos">Ver Favoritos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6 text-center">
            <div className="p-4 bg-accent/20 rounded-full w-fit mx-auto mb-4">
              <MapPin className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Endereços</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gerencie seus endereços de entrega
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/minha-conta/enderecos">Ver Endereços</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
