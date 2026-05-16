import { createClient } from '@/lib/supabase/server'
import { getFarmPriceHistory } from '@/lib/actions/stock'
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function FarmCostsPage() {
  const supabase = await createClient()
  const priceHistory = await getFarmPriceHistory()

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getChangeLabel = (type: string) => {
    switch (type) {
      case 'increase':
        return 'Aumento'
      case 'decrease':
        return 'Redução'
      default:
        return 'Estável'
    }
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'increase':
        return 'text-red-500'
      case 'decrease':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  // Calcular estatísticas
  const latestPrice = priceHistory?.[0]?.price_per_kg || 0
  const previousPrice = priceHistory?.[1]?.price_per_kg || 0
  const priceChange = latestPrice - previousPrice
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custos do Frango da Granja</h1>
          <p className="text-muted-foreground mt-1">
            Histórico de preços e controle de custos de compra
          </p>
        </div>
        <Link href="/admin/custos/granja/novo">
          <Button className="bg-primary hover:bg-primary/90">
            <DollarSign className="w-4 h-4 mr-2" />
            Registrar Preço
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Atual</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(latestPrice)}/KG</div>
            <p className="text-xs text-muted-foreground">Preço por quilo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variação</CardTitle>
            {getChangeIcon(priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'stable')}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getChangeColor(priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'stable')}`}>
              {priceChange > 0 ? '+' : ''}{formatCurrency(priceChange)}
            </div>
            <p className="text-xs text-muted-foreground">Em relação ao preço anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variação %</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getChangeColor(priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'stable')}`}>
              {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Percentual de variação</p>
          </CardContent>
        </Card>
      </div>

      {/* Price History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          {!priceHistory || priceHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum registro de preço encontrado</p>
              <Link href="/admin/custos/granja/novo">
                <Button>Registrar Primeiro Preço</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {priceHistory.map((record: any) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getChangeIcon(record.price_change_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{record.product_category}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(record.effective_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(record.price_per_kg)}/KG</p>
                      <p className={`text-sm ${getChangeColor(record.price_change_type)}`}>
                        {getChangeLabel(record.price_change_type)}
                        {record.previous_price && (
                          <span className="text-muted-foreground ml-2">
                            (antes: {formatCurrency(record.previous_price)}/KG)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {record.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">{record.notes}</p>
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
