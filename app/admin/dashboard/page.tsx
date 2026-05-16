'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayStockOpening, getDailyReport, getFarmPriceHistory, getOperationalCosts, getWeeklyReports } from '@/lib/actions/stock'
import { TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle, ShoppingBag, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [todayOpening, setTodayOpening] = useState<any>(null)
  const [dailyReport, setDailyReport] = useState<any>(null)
  const [farmPrices, setFarmPrices] = useState<any[]>([])
  const [operationalCosts, setOperationalCosts] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [weeklyReports, setWeeklyReports] = useState<any[]>([])
  const [tablesExist, setTablesExist] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      
      try {
        const [opening, report, prices, costs, orders, prods, weekly] = await Promise.all([
          getTodayStockOpening(),
          getDailyReport(today),
          getFarmPriceHistory(),
          getOperationalCosts(),
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('products').select('*').eq('is_active', true),
          getWeeklyReports(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], today)
        ])

        setTodayOpening(opening)
        setDailyReport(report)
        setFarmPrices(prices || [])
        setOperationalCosts(costs || [])
        setRecentOrders(orders?.data || [])
        setProducts(prods?.data || [])
        setWeeklyReports(weekly || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setTablesExist(false)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const latestFarmPrice = farmPrices?.[0]?.price_per_kg || 0
  const totalOperationalCost = operationalCosts?.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0) || 0

  // Preparar dados para gráficos
  const salesData = weeklyReports?.map((r: any) => ({
    date: new Date(r.report_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    vendas: Number(r.total_sales),
    lucro: Number(r.net_profit),
    custo: Number(r.total_cost)
  })) || []

  const costData = operationalCosts?.reduce((acc: any, c: any) => {
    const type = c.cost_type
    if (!acc[type]) acc[type] = 0
    acc[type] += Number(c.amount)
    return acc
  }, {}) || {}

  const costChartData = Object.entries(costData).map(([type, amount]) => ({
    name: type === 'labor' ? 'Mão de Obra' : type === 'transport' ? 'Transporte' : type === 'slaughter' ? 'Abate' : type === 'energy' ? 'Energia' : type === 'packaging' ? 'Embalagem' : 'Outros',
    value: Number(amount)
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do sistema de gestão de estoque e vendas
        </p>
      </div>

      {!tablesExist && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Tabelas não criadas no Supabase</h3>
                <p className="text-orange-800 mb-4">
                  As tabelas do sistema de gestão de estoque ainda não foram criadas no banco de dados.
                  Execute as migrations SQL na seguinte ordem:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-orange-800">
                  <li><code>20260515210000_create_stock_management_tables.sql</code></li>
                  <li><code>20260515220000_create_alerts_table.sql</code></li>
                  <li><code>20260515230000_create_users_with_roles.sql</code></li>
                </ol>
                <p className="text-sm text-orange-700 mt-4">
                  Acesse o painel do Supabase → SQL Editor e execute os arquivos nesta ordem.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Dia</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(dailyReport?.total_sales) || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dailyReport?.products_sold_count || 0} produtos vendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(Number(dailyReport?.net_profit) || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(Number(dailyReport?.net_profit) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Lucro do dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Disponível</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(Number(dailyReport?.total_quantity_sold) || 0)} KG</div>
            <p className="text-xs text-muted-foreground">Vendido hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço da Granja</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(latestFarmPrice)}/KG</div>
            <p className="text-xs text-muted-foreground">Preço atual do frango</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas e Lucro (Última Semana)</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vendas" fill="#0088FE" name="Vendas" />
                  <Bar dataKey="lucro" fill="#00C49F" name="Lucro" />
                  <Bar dataKey="custo" fill="#FF8042" name="Custo" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Sem dados suficientes para o gráfico</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            {costChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Sem custos registrados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentOrders || recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum pedido recente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{order.customer_name || 'Cliente'}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(Number(order.total))}</p>
                      <p className="text-xs text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/estoque">
              <div className="p-3 border rounded-lg hover:bg-primary/5 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4" />
                  <span className="font-medium">Gerenciar Estoque</span>
                </div>
              </div>
            </Link>
            <Link href="/admin/relatorios">
              <div className="p-3 border rounded-lg hover:bg-primary/5 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Ver Relatórios</span>
                </div>
              </div>
            </Link>
            <Link href="/admin/custos/granja">
              <div className="p-3 border rounded-lg hover:bg-primary/5 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">Custos da Granja</span>
                </div>
              </div>
            </Link>
            <Link href="/admin/produtos">
              <div className="p-3 border rounded-lg hover:bg-primary/5 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="font-medium">Gerenciar Produtos</span>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas e Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!todayOpening && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Estoque do dia não foi aberto</p>
                    <p className="text-sm text-yellow-700">Abra o estoque para começar a vender</p>
                  </div>
                </div>
              </div>
            )}
            
            {products && products.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">{products.length} produtos ativos</p>
                    <p className="text-sm text-blue-700">Produtos disponíveis para venda</p>
                  </div>
                </div>
              </div>
            )}

            {operationalCosts && operationalCosts.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">{operationalCosts.length} custos registrados</p>
                    <p className="text-sm text-green-700">Total: {formatCurrency(totalOperationalCost)}</p>
                  </div>
                </div>
              </div>
            )}

            {(!todayOpening && !products && !operationalCosts) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum alerta no momento</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Custo de Produtos</span>
                <span className="font-bold">{formatCurrency(Number(dailyReport?.total_cost) || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Custos Operacionais</span>
                <span className="font-bold">{formatCurrency(totalOperationalCost)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="font-medium">Custo Total</span>
                <span className="font-bold text-red-500">
                  {formatCurrency((Number(dailyReport?.total_cost) || 0) + totalOperationalCost)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Vendas Totais</span>
                <span className="font-bold">{formatCurrency(Number(dailyReport?.total_sales) || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Lucro Bruto</span>
                <span className="font-bold">{formatCurrency(Number(dailyReport?.gross_profit) || 0)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="font-medium">Lucro Líquido</span>
                <span className={`font-bold ${(Number(dailyReport?.net_profit) || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(Number(dailyReport?.net_profit) || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
