'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  getProductionSummary, 
  getDailySlaughterByDateRange,
  getLiveChickenStock 
} from '@/lib/actions/stock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Target, 
  CheckCircle, 
  Scissors,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function ProductionDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [productionSummary, setProductionSummary] = useState<any>(null)
  const [slaughterData, setSlaughterData] = useState<any[]>([])
  const [liveStock, setLiveStock] = useState<any[]>([])
  const [period, setPeriod] = useState('7') // 7 dias, 30 dias, 90 dias

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - parseInt(period))
      
      const [summaryData, slaughterDataResult, stockData] = await Promise.all([
        getProductionSummary(),
        getDailySlaughterByDateRange(startDate.toISOString().split('T')[0], today.toISOString().split('T')[0]),
        getLiveChickenStock()
      ])
      
      setProductionSummary(summaryData)
      setSlaughterData(slaughterDataResult || [])
      setLiveStock(stockData || [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(date))
  }

  // Preparar dados para o gráfico de linha (produção diária)
  const chartData = slaughterData.map((record) => ({
    date: formatDate(record.slaughter_date),
    production: Number(record.total_weight_kg),
    chickens: record.chickens_slaughtered,
    target: 200
  }))

  // Preparar dados para o gráfico de pizza (distribuição por fornecedor)
  const supplierData = slaughterData.reduce((acc: any, record: any) => {
    const supplier = record.live_chicken_stock?.farm_invoices?.supplier_name || 'Outros'
    if (!acc[supplier]) {
      acc[supplier] = 0
    }
    acc[supplier] += Number(record.total_weight_kg)
    return acc
  }, {})

  const pieData = Object.entries(supplierData).map(([name, value]) => ({
    name,
    value: value as number
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Produção</h1>
          <p className="text-muted-foreground">Acompanhe a produção de frango e meta diária de 200 KG</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === '7' ? 'default' : 'outline'}
            onClick={() => setPeriod('7')}
          >
            7 dias
          </Button>
          <Button
            variant={period === '30' ? 'default' : 'outline'}
            onClick={() => setPeriod('30')}
          >
            30 dias
          </Button>
          <Button
            variant={period === '90' ? 'default' : 'outline'}
            onClick={() => setPeriod('90')}
          >
            90 dias
          </Button>
        </div>
      </div>

      {/* Production Summary Cards */}
      {productionSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produção Hoje</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productionSummary.totalWeight.toFixed(1)} KG</div>
              <p className="text-xs text-muted-foreground">{productionSummary.totalSlaughtered} aves abatidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meta Diária</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productionSummary.dailyTarget} KG</div>
              <div className="flex items-center gap-1">
                {productionSummary.targetPercentage >= 100 ? (
                  <ArrowUp className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-red-500" />
                )}
                <p className="text-xs text-muted-foreground">{productionSummary.targetPercentage.toFixed(1)}% alcançado</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aves Vivas</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productionSummary.totalLiveChickens}</div>
              <p className="text-xs text-muted-foreground">{productionSummary.totalLiveWeight.toFixed(1)} KG total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falta para Meta</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productionSummary.remainingToTarget.toFixed(1)} KG</div>
              <p className="text-xs text-muted-foreground">para atingir meta diária</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Produção Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="production" 
                  stroke="#3b82f6" 
                  name="Produção (KG)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ef4444" 
                  name="Meta (KG)"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Supplier Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Distribuição por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)} KG`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Slaughter Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Produção por Dia (KG)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="production" fill="#3b82f6" name="Produção (KG)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live Stock List */}
      <Card>
        <CardHeader>
          <CardTitle>Estoque de Aves Vivas</CardTitle>
        </CardHeader>
        <CardContent>
          {!liveStock || liveStock.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma ave viva em estoque</p>
            </div>
          ) : (
            <div className="space-y-4">
              {liveStock.map((stock) => (
                <div key={stock.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{stock.farm_invoices?.supplier_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Recebido em {formatDate(stock.farm_invoices?.invoice_date)}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <p className="font-medium">{stock.remaining_chickens} aves</p>
                          <p className="text-muted-foreground">Restantes</p>
                        </div>
                        <div>
                          <p className="font-medium">{stock.total_slaughtered} aves</p>
                          <p className="text-muted-foreground">Abatidas</p>
                        </div>
                        <div>
                          <p className="font-medium">{stock.total_weight_kg.toFixed(1)} KG</p>
                          <p className="text-muted-foreground">Peso total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    stock.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {stock.status === 'active' ? 'Ativo' : 'Concluído'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
