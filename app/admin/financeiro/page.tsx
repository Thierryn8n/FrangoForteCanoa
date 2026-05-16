'use client'

import { useState, useEffect } from 'react'
import { getFinancialSummary, calculateRealProfit } from '@/lib/actions/stock'
import { DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function FinancialDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')
  const [summary, setSummary] = useState<any>(null)

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

        const data = await getFinancialSummary(startDate, endDate)
        setSummary(data)
      } catch (error) {
        console.error('Error fetching financial summary:', error)
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
