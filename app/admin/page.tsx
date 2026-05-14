import { createClient } from '@/lib/supabase/server'
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

async function getDashboardStats() {
  const supabase = await createClient()
  
  // Get orders count
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
  
  // Get products count
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  
  // Get customers count
  const { count: customersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
  
  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Calculate total revenue
  const { data: allOrders } = await supabase
    .from('orders')
    .select('total')
  
  const totalRevenue = allOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0

  return {
    ordersCount: ordersCount || 0,
    productsCount: productsCount || 0,
    customersCount: customersCount || 0,
    totalRevenue,
    recentOrders: recentOrders || [],
  }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  delivering: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  delivering: 'Em Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao painel de administração da Frango Forte Canoa
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500">+12%</span> em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pedidos
            </CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.ordersCount}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500">+8%</span> em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtos Cadastrados
            </CardTitle>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.productsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos ativos na loja
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Cadastrados
            </CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.customersCount}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500">+15%</span> novos clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pedidos Recentes</CardTitle>
          <Link href="/admin/pedidos">
            <Button variant="ghost" size="sm" className="gap-1">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum pedido encontrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Pedido</th>
                    <th className="pb-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="pb-3 font-medium text-muted-foreground">Data</th>
                    <th className="pb-3 font-medium text-muted-foreground">Total</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-4">
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-4">
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                      </td>
                      <td className="py-4 text-muted-foreground">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-4 font-medium">
                        {formatPrice(Number(order.total))}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Adicionar Produto</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Cadastre novos produtos para sua loja
            </p>
            <Link href="/admin/produtos/novo">
              <Button variant="secondary" size="sm">
                Novo Produto
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Criar Kit Promocional</h3>
            <p className="text-secondary-foreground/80 text-sm mb-4">
              Monte kits especiais com desconto
            </p>
            <Link href="/admin/kits/novo">
              <Button variant="outline" size="sm">
                Novo Kit
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-destructive text-destructive-foreground">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Ver Pedidos Pendentes</h3>
            <p className="text-destructive-foreground/80 text-sm mb-4">
              Gerencie pedidos aguardando confirmação
            </p>
            <Link href="/admin/pedidos?status=pending">
              <Button variant="secondary" size="sm">
                Ver Pedidos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
