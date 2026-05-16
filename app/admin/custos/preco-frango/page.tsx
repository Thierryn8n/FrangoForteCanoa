'use client'

import { useState, useEffect } from 'react'
import { calculateIdealChickenPrice, updateAllChickenPrices, getChickenProducts } from '@/lib/actions/stock'
import { DollarSign, Calculator, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ChickenPriceCalculatorPage() {
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [profitMargin, setProfitMargin] = useState('20')
  const [estimatedSales, setEstimatedSales] = useState('1000')
  const [calculationResult, setCalculationResult] = useState<any>(null)
  const [chickenProducts, setChickenProducts] = useState<any[]>([])
  const [updateResult, setUpdateResult] = useState<any>(null)

  useEffect(() => {
    async function fetchProducts() {
      const products = await getChickenProducts()
      setChickenProducts(products || [])
    }
    fetchProducts()
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

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      const result = await calculateIdealChickenPrice(
        Number(profitMargin) / 100,
        Number(estimatedSales)
      )
      setCalculationResult(result)
    } catch (error) {
      console.error('Error calculating price:', error)
      alert('Erro ao calcular preço ideal')
    } finally {
      setCalculating(false)
    }
  }

  const handleUpdatePrices = async () => {
    if (!calculationResult) return
    
    setUpdating(true)
    try {
      const result = await updateAllChickenPrices(calculationResult.idealPricePerKg)
      setUpdateResult(result)
      
      if (result.success) {
        alert(result.message)
        // Recarregar produtos
        const products = await getChickenProducts()
        setChickenProducts(products || [])
      }
    } catch (error) {
      console.error('Error updating prices:', error)
      alert('Erro ao atualizar preços')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calculadora de Preço Ideal do Frango</h1>
        <p className="text-muted-foreground mt-1">
          Calcule o preço ideal baseado em custos operacionais e margem de lucro desejada
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Calculator className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="font-medium text-blue-900">Como funciona o cálculo</p>
              <p className="text-sm text-blue-800 mt-1">
                O sistema analisa automaticamente: custo do frango da granja + custos operacionais do mês + margem de lucro desejada.
                <strong> Não precisa de IA</strong> - é cálculo matemático baseado em dados reais.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Parâmetros do Cálculo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profitMargin">Margem de Lucro Desejada (%)</Label>
              <Input
                id="profitMargin"
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(e.target.value)}
                placeholder="20"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                Porcentagem de lucro sobre o preço final
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedSales">Vendas Estimadas do Mês (KG)</Label>
              <Input
                id="estimatedSales"
                type="number"
                value={estimatedSales}
                onChange={(e) => setEstimatedSales(e.target.value)}
                placeholder="1000"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Quantidade total de KG estimada para venda no mês
              </p>
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={calculating}
            className="mt-4 w-full md:w-auto"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {calculating ? 'Calculando...' : 'Calcular Preço Ideal'}
          </Button>
        </CardContent>
      </Card>

      {/* Calculation Result */}
      {calculationResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="w-5 h-5" />
              Resultado do Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-sm text-muted-foreground">Custo do Frango (Granja)</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculationResult.farmCostPerKg)}/KG</p>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-sm text-muted-foreground">Custo Operacional por KG</p>
                  <p className="text-2xl font-bold text-orange-500">{formatCurrency(calculationResult.operationalCostPerKg)}/KG</p>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-sm text-muted-foreground">Custo Total por KG</p>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(calculationResult.totalCostPerKg)}/KG</p>
                </div>

                <div className="p-4 bg-white rounded-lg border border-green-500">
                  <p className="text-sm text-muted-foreground">PREÇO IDEAL POR KG</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(calculationResult.idealPricePerKg)}/KG</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm text-muted-foreground">Lucro por KG</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(calculationResult.profitPerKg)}</p>
                </div>

                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm text-muted-foreground">Lucro Mensal Estimado</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(calculationResult.estimatedMonthlyProfit)}</p>
                </div>

                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                  <p className="text-xl font-bold">{calculationResult.desiredProfitMargin}%</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Fórmula:</strong> Preço Ideal = (Custo Granja + Custo Operacional/KG) ÷ (1 - Margem de Lucro)
                </p>
              </div>

              <Button
                onClick={handleUpdatePrices}
                disabled={updating}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {updating ? 'Atualizando...' : 'Atualizar Todos os Preços de Frango'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Result */}
      {updateResult && (
        <Card className={updateResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {updateResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
              )}
              <div>
                <p className={`font-medium ${updateResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {updateResult.message}
                </p>
                {updateResult.updatedProducts && (
                  <div className="mt-2 text-sm text-green-800">
                    <p>Produtos atualizados:</p>
                    <ul className="list-disc list-inside mt-1">
                      {updateResult.updatedProducts.map((prod: any) => (
                        <li key={prod.productId}>
                          {formatCurrency(prod.oldPrice)} → {formatCurrency(prod.newPrice)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Chicken Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos de Frango Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          {!chickenProducts || chickenProducts.length === 0 ? (
            <p className="text-muted-foreground">Nenhum produto de frango encontrado</p>
          ) : (
            <div className="space-y-3">
              {chickenProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.weight_in_kg ? `${product.weight_in_kg} KG` : '1 KG'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(Number(product.price))}</p>
                    {product.cost_per_kg && (
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(product.cost_per_kg))}/KG
                      </p>
                    )}
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
