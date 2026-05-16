import { createClient } from '@/lib/supabase/server'
import { getOperationalCosts } from '@/lib/actions/stock'
import { Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function OperationalCostsPage() {
  const supabase = await createClient()
  const costs = await getOperationalCosts()

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
  }

  const getCostTypeLabel = (type: string) => {
    switch (type) {
      case 'labor':
        return 'Mão de Obra'
      case 'transport':
        return 'Transporte'
      case 'slaughter':
        return 'Abate'
      case 'energy':
        return 'Energia'
      case 'packaging':
        return 'Embalagem'
      default:
        return 'Outros'
    }
  }

  const getCostTypeIcon = (type: string) => {
    switch (type) {
      case 'labor':
        return <TrendingUp className="w-4 h-4" />
      case 'transport':
        return <TrendingUp className="w-4 h-4" />
      case 'slaughter':
        return <TrendingDown className="w-4 h-4" />
      case 'energy':
        return <TrendingUp className="w-4 h-4" />
      case 'packaging':
        return <TrendingUp className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  // Calcular totais
  const totalCosts = costs?.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0) || 0
  const costsByType = costs?.reduce((acc: any, cost: any) => {
    const type = cost.cost_type
    if (!acc[type]) acc[type] = 0
    acc[type] += Number(cost.amount) || 0
    return acc
  }, {}) || {}

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custos Operacionais</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os custos operacionais da empresa
          </p>
        </div>
        <Link href="/admin/custos/operacionais/novo">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Custo
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Custos</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCosts)}</div>
            <p className="text-xs text-muted-foreground">Total registrado</p>
          </CardContent>
        </Card>

        {Object.entries(costsByType).slice(0, 3).map(([type, amount]) => (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{getCostTypeLabel(type)}</CardTitle>
              {getCostTypeIcon(type)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(Number(amount))}</div>
              <p className="text-xs text-muted-foreground">Por categoria</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Costs List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          {!costs || costs.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum custo registrado</p>
              <Link href="/admin/custos/operacionais/novo">
                <Button>Registrar Primeiro Custo</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {costs.map((cost: any) => (
                <div key={cost.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getCostTypeIcon(cost.cost_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{cost.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getCostTypeLabel(cost.cost_type)} • {formatDate(cost.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(Number(cost.amount))}</p>
                    </div>
                  </div>
                  {cost.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">{cost.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
