'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  getLiveChickenStock, 
  createDailySlaughter,
  getDailySlaughter,
  getProductionSummary 
} from '@/lib/actions/stock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Scissors, 
  Plus, 
  TrendingUp, 
  Target, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function DailySlaughterPage() {
  const [loading, setLoading] = useState(true)
  const [liveStock, setLiveStock] = useState<any[]>([])
  const [slaughterRecords, setSlaughterRecords] = useState<any[]>([])
  const [productionSummary, setProductionSummary] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    live_chicken_stock_id: '',
    slaughter_date: new Date().toISOString().split('T')[0],
    chickens_slaughtered: '',
    total_weight_kg: ''
  })

  const supabase = createClient()

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [stockData, slaughterData, summaryData] = await Promise.all([
        getLiveChickenStock(),
        getDailySlaughter(),
        getProductionSummary()
      ])
      setLiveStock(stockData || [])
      setSlaughterRecords(slaughterData || [])
      setProductionSummary(summaryData)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const chickensSlaughtered = Number(formData.chickens_slaughtered)
      const totalWeightKg = Number(formData.total_weight_kg)
      
      const slaughterData = {
        live_chicken_stock_id: formData.live_chicken_stock_id,
        slaughter_date: formData.slaughter_date,
        chickens_slaughtered: chickensSlaughtered,
        total_weight_kg: totalWeightKg,
        daily_target_kg: 200
      }

      await createDailySlaughter(slaughterData)
      setShowModal(false)
      setFormData({
        live_chicken_stock_id: '',
        slaughter_date: new Date().toISOString().split('T')[0],
        chickens_slaughtered: '',
        total_weight_kg: ''
      })
      fetchData()
    } catch (error) {
      console.error('Erro ao registrar abate:', error)
      alert('Erro ao registrar abate')
    }
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle de Abate Diário</h1>
          <p className="text-muted-foreground">Registre o abate de aves e acompanhe a produção</p>
        </div>
        <Button onClick={() => setShowModal(true)} disabled={liveStock.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Registrar Abate
        </Button>
      </div>

      {/* Production Summary */}
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
              <p className="text-xs text-muted-foreground">{productionSummary.targetPercentage.toFixed(1)}% alcançado</p>
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

      {/* Live Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Estoque de Aves Vivas</CardTitle>
        </CardHeader>
        <CardContent>
          {!liveStock || liveStock.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma ave viva em estoque</p>
              <p className="text-sm text-muted-foreground">Registre uma nota fiscal de entrada primeiro</p>
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

      {/* Slaughter Records */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Abate</CardTitle>
        </CardHeader>
        <CardContent>
          {!slaughterRecords || slaughterRecords.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum abate registrado hoje</p>
              <Button onClick={() => setShowModal(true)} disabled={liveStock.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primeiro Abate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {slaughterRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{formatDate(record.slaughter_date)}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.live_chicken_stock?.farm_invoices?.supplier_name}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <p className="font-medium">{record.chickens_slaughtered} aves</p>
                          <p className="text-muted-foreground">Abatidas</p>
                        </div>
                        <div>
                          <p className="font-medium">{record.total_weight_kg.toFixed(1)} KG</p>
                          <p className="text-muted-foreground">Peso total</p>
                        </div>
                        <div>
                          <p className="font-medium">{record.average_weight_per_chicken?.toFixed(2)} KG</p>
                          <p className="text-muted-foreground">Peso médio/ave</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.target_achieved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.target_achieved ? 'Meta alcançada' : 'Meta pendente'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Registrar Abate</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="live_chicken_stock_id">Lote de Aves</Label>
                  <Select
                    value={formData.live_chicken_stock_id}
                    onValueChange={(value) => setFormData({ ...formData, live_chicken_stock_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {liveStock.map((stock) => (
                        <SelectItem key={stock.id} value={stock.id}>
                          {stock.farm_invoices?.supplier_name} - {stock.remaining_chickens} aves restantes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="slaughter_date">Data do Abate</Label>
                  <Input
                    id="slaughter_date"
                    type="date"
                    value={formData.slaughter_date}
                    onChange={(e) => setFormData({ ...formData, slaughter_date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="chickens_slaughtered">Aves Abatidas</Label>
                    <Input
                      id="chickens_slaughtered"
                      type="number"
                      value={formData.chickens_slaughtered}
                      onChange={(e) => setFormData({ ...formData, chickens_slaughtered: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_weight_kg">Peso Total (KG)</Label>
                    <Input
                      id="total_weight_kg"
                      type="number"
                      step="0.001"
                      value={formData.total_weight_kg}
                      onChange={(e) => setFormData({ ...formData, total_weight_kg: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Registrar Abate
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
