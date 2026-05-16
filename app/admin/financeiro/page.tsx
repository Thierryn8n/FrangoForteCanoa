'use client'

import { useState, useEffect } from 'react'
import { getFinancialSummary, calculateRealProfit, getOperationalCosts, getOperationalCostCategories } from '@/lib/actions/stock'
import { DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'

export default function FinancialDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')
  const [summary, setSummary] = useState<any>(null)
  const [costs, setCosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date()
        let startDate: string
        let endDate: string

        switch (period) {
          case 'today':
            startDate = today.toISOString().split('T')[0]
            endDate = startDate
            break
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            startDate = weekAgo.toISOString().split('T')[0]
            endDate = today.toISOString().split('T')[0]
            break
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            startDate = monthAgo.toISOString().split('T')[0]
            endDate = today.toISOString().split('T')[0]
            break
          default:
            startDate = today.toISOString().split('T')[0]
            endDate = startDate
        }

        const [summaryData, costsData, categoriesData] = await Promise.all([
          getFinancialSummary(startDate, endDate),
          getOperationalCosts(startDate, endDate),
          getOperationalCostCategories()
        ])

        setSummary(summaryData)
        setCosts(costsData || [])
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Error fetching financial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

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

  // Preparar dados para gráfico de gastos por categoria
  const costsByCategory = categories.map(cat => {
    const categoryCosts = costs.filter(c => c.category_id === cat.id)
    const total = categoryCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
    return {
      name: cat.name,
      value: total,
      color: cat.color || '#3b82f6'
    }
  }).filter(c => c.value > 0)

  // Preparar dados para gráfico de evolução de custos
  const costsByDate = costs.reduce((acc: any, cost) => {
    const date = cost.date
    if (!acc[date]) acc[date] = 0
    acc[date] += Number(cost.amount) || 0
    return acc
  }, {})

  const costEvolutionData = Object.entries(costsByDate)
    .map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('pt-BR'),
      valor: amount
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Visão completa do desempenho financeiro
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalSales || 0)}</div>
            <p className="text-xs text-muted-foreground">Faturamento bruto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo de Produtos</CardTitle>
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(summary?.totalCosts || 0)}</div>
            <p className="text-xs text-muted-foreground">Custo de mercadorias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Operacionais</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{formatCurrency(summary?.totalOperationalCosts || 0)}</div>
            <p className="text-xs text-muted-foreground">Despesas operacionais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(summary?.netProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Lucro real</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Gastos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={costsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Sem dados de custos por categoria
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Evolução de Custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costEvolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="valor" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Sem dados de evolução de custos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Lucro Bruto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(summary?.grossProfit || 0)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Margem bruta: {summary?.totalSales ? ((summary.grossProfit / summary.totalSales) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Quantidade Vendida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(summary?.quantitySold || 0)} KG</div>
            <p className="text-sm text-muted-foreground mt-2">
              Total de vendas em KG
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Custo Operacional por KG
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(summary?.operationalCostPerKg || 0)}/KG</div>
            <p className="text-sm text-muted-foreground mt-2">
              Custo operacional por unidade vendida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Lucro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Vendas Totais</span>
              <span className="font-medium">{formatCurrency(summary?.totalSales || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">(-) Custo de Produtos</span>
              <span className="font-medium text-red-500">{formatCurrency(summary?.totalCosts || 0)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-medium">= Lucro Bruto</span>
              <span className="font-medium">{formatCurrency(summary?.grossProfit || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">(-) Custos Operacionais</span>
              <span className="font-medium text-orange-500">{formatCurrency(summary?.totalOperationalCosts || 0)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-semibold">= Lucro Líquido</span>
              <span className={`font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(summary?.netProfit || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
