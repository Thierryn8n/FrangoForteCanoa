'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDailyReport, getWeeklyReports, generateDailyReport } from '@/lib/actions/stock'
import { FileText, TrendingUp, DollarSign, Package, Calendar, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [dailyReport, setDailyReport] = useState<any>(null)
  const [weeklyReports, setWeeklyReports] = useState<any[]>([])
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      
      try {
        // Gerar relatório do dia atual se não existir
        let report = await getDailyReport(today)
        if (!report) {
          report = await generateDailyReport(today)
        }
        setDailyReport(report)

        // Buscar relatórios da última semana
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const weekly = await getWeeklyReports(weekAgo, today)
        setWeeklyReports(weekly || [])
      } catch (error) {
        console.error('Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
  }

  const handlePrintReport = async (type: 'diario' | 'semanal') => {
    setPrinting(true)
    try {
      const reportData = {
        dailyReport,
        weeklyTotal: weeklyReports?.reduce((sum: any, r: any) => {
          return {
            sales: sum.sales + (Number(r.total_sales) || 0),
            cost: sum.cost + (Number(r.total_cost) || 0),
            grossProfit: sum.grossProfit + (Number(r.gross_profit) || 0),
            netProfit: sum.netProfit + (Number(r.net_profit) || 0),
            quantity: sum.quantity + (Number(r.total_quantity_sold) || 0),
          }
        }, { sales: 0, cost: 0, grossProfit: 0, netProfit: 0, quantity: 0 })
      }

      const response = await fetch('/api/print/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData, reportType: type })
      })

      if (response.ok) {
        const result = await response.json()
        alert('Relatório enviado para impressão na Epson!')
      } else {
        alert('Erro ao enviar relatório para impressão')
      }
    } catch (error) {
      console.error('Error printing report:', error)
      alert('Erro ao enviar relatório para impressão')
    } finally {
      setPrinting(false)
    }
  }

  // Calcular totais da semana
  const weeklyTotal = weeklyReports?.reduce((sum: any, r: any) => {
    return {
      sales: sum.sales + (Number(r.total_sales) || 0),
      cost: sum.cost + (Number(r.total_cost) || 0),
      grossProfit: sum.grossProfit + (Number(r.gross_profit) || 0),
      netProfit: sum.netProfit + (Number(r.net_profit) || 0),
      quantity: sum.quantity + (Number(r.total_quantity_sold) || 0),
    }
  }, { sales: 0, cost: 0, grossProfit: 0, netProfit: 0, quantity: 0 }) || { sales: 0, cost: 0, grossProfit: 0, netProfit: 0, quantity: 0 }

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
          <h1 className="text-3xl font-bold text-foreground">Relatórios Inteligentes</h1>
          <p className="text-muted-foreground mt-1">
            Análise detalhada de vendas, lucros e desempenho
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handlePrintReport('diario')} disabled={printing}>
            <Printer className="w-4 h-4 mr-2" />
            {printing ? 'Imprimindo...' : 'Imprimir Relatório Diário'}
          </Button>
          <Button onClick={() => handlePrintReport('semanal')} disabled={printing} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            {printing ? 'Imprimindo...' : 'Imprimir Relatório Semanal'}
          </Button>
          <Link href="/admin/relatorios/diario">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Relatório Diário
            </Button>
          </Link>
          <Link href="/admin/relatorios/semanal">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Relatório Semanal
            </Button>
          </Link>
          <Link href="/admin/relatorios/mensal">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Relatório Mensal
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Report Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyReport ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Vendas Totais</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(Number(dailyReport.total_sales))}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(Number(dailyReport.total_cost))}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${Number(dailyReport.net_profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(Number(dailyReport.net_profit))}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Quantidade Vendida</p>
                <p className="text-2xl font-bold">{formatNumber(Number(dailyReport.total_quantity_sold))} KG</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum relatório gerado hoje</p>
          )}
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Última Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Vendas Totais</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(weeklyTotal.sales)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Custo Total</p>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(weeklyTotal.cost)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Lucro Líquido</p>
              <p className={`text-2xl font-bold ${weeklyTotal.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(weeklyTotal.netProfit)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Quantidade Vendida</p>
              <p className="text-2xl font-bold">{formatNumber(weeklyTotal.quantity)} KG</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Diários (Última Semana)</CardTitle>
        </CardHeader>
        <CardContent>
          {!weeklyReports || weeklyReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum relatório encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyReports.map((report: any) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{formatDate(report.report_date)}</h3>
                        <p className="text-sm text-muted-foreground">{report.products_sold_count} produtos vendidos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(Number(report.net_profit))}</p>
                      <p className="text-sm text-muted-foreground">Lucro líquido</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vendas</p>
                      <p className="font-medium">{formatCurrency(Number(report.total_sales))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Custo</p>
                      <p className="font-medium">{formatCurrency(Number(report.total_cost))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lucro Bruto</p>
                      <p className="font-medium">{formatCurrency(Number(report.gross_profit))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantidade</p>
                      <p className="font-medium">{formatNumber(Number(report.total_quantity_sold))} KG</p>
                    </div>
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
