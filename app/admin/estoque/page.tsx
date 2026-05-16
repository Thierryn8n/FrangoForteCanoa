import { createClient } from '@/lib/supabase/server'
import { DailyStockOpeningModal } from '@/components/admin/daily-stock-opening-modal'
import { getTodayStockOpening, getDailyStockItems } from '@/lib/actions/stock'
import { Package, Scale, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function StockManagementPage() {
  const supabase = await createClient()
  const todayOpening = await getTodayStockOpening()
  
  let stockItems = []
  if (todayOpening) {
    stockItems = await getDailyStockItems(todayOpening.id)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num)
  }

  const getUnitIcon = (unit: string) => {
    switch (unit) {
      case 'kg':
        return <Scale className="w-4 h-4" />
      case 'caixa':
        return <Package className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  // Calcular totais
  const totalInitial = stockItems.reduce((sum, item) => sum + (Number(item.initial_quantity) || 0), 0)
  const totalCurrent = stockItems.reduce((sum, item) => sum + (Number(item.current_quantity) || 0), 0)
  const totalSold = totalInitial - totalCurrent
  const totalCost = stockItems.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Estoque</h1>
          <p className="text-muted-foreground mt-1">
            Controle de estoque por KG para abatedouro e loja de carnes
          </p>
        </div>
        {!todayOpening && (
          <DailyStockOpeningModal
            isOpen={true}
            onClose={() => {}}
            onComplete={() => {}}
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Inicial</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalInitial)} KG</div>
            <p className="text-xs text-muted-foreground">Total disponível hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Atual</CardTitle>
            <Scale className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalCurrent)} KG</div>
            <p className="text-xs text-muted-foreground">Restante no momento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendido</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalSold)} KG</div>
            <p className="text-xs text-muted-foreground">Total vendido hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">Custo do estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Itens de Estoque do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          {!todayOpening ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Estoque do dia ainda não foi aberto</p>
              <Button onClick={() => {}}>
                Abrir Estoque do Dia
              </Button>
            </div>
          ) : stockItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum item de estoque cadastrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stockItems.map((item: any) => {
                const sold = Number(item.initial_quantity) - Number(item.current_quantity)
                const percentage = Number(item.initial_quantity) > 0 
                  ? (sold / Number(item.initial_quantity)) * 100 
                  : 0

                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getUnitIcon(item.unit)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.stock_categories?.name}</h3>
                          {item.products?.name && (
                            <p className="text-sm text-muted-foreground">{item.products.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatNumber(Number(item.current_quantity))} {item.unit}</p>
                        <p className="text-sm text-muted-foreground">Restante</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Inicial</p>
                        <p className="font-medium">{formatNumber(Number(item.initial_quantity))} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vendido</p>
                        <p className="font-medium">{formatNumber(sold)} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Custo</p>
                        <p className="font-medium">{formatCurrency(Number(item.total_cost))}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progresso de vendas</span>
                        <span>{formatNumber(percentage)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
