'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOperationalCosts, createOperationalCost, getOperationalCostCategories } from '@/lib/actions/stock'
import { Plus, DollarSign, TrendingUp, TrendingDown, Calendar, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function OperationalCostsPage() {
  const [loading, setLoading] = useState(true)
  const [costs, setCosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    cost_type: 'other',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    category_id: '',
    frequency: 'onetime',
    payment_method: '',
    due_date: '',
    is_recurring: false,
    estimated_duration_days: '',
    quantity_purchased: '',
    unit: '',
    vehicle_mileage: '',
    average_consumption: ''
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [costsData, categoriesData] = await Promise.all([
          getOperationalCosts(),
          getOperationalCostCategories()
        ])
        setCosts(costsData || [])
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
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

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Diário',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
      onetime: 'Único'
    }
    return labels[frequency] || frequency
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      card: 'Cartão',
      pix: 'PIX',
      transfer: 'Transferência',
      boleto: 'Boleto'
    }
    return labels[method] || method
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createOperationalCost({
        cost_type: formData.cost_type as any,
        description: formData.description,
        amount: Number(formData.amount),
        date: formData.date,
        notes: formData.notes,
        category_id: formData.category_id || undefined,
        frequency: formData.frequency as any,
        payment_method: formData.payment_method as any,
        due_date: formData.due_date || undefined,
        is_recurring: formData.is_recurring,
        estimated_duration_days: formData.estimated_duration_days ? Number(formData.estimated_duration_days) : undefined,
        quantity_purchased: formData.quantity_purchased ? Number(formData.quantity_purchased) : undefined,
        unit: formData.unit || undefined,
        vehicle_mileage: formData.vehicle_mileage ? Number(formData.vehicle_mileage) : undefined,
        average_consumption: formData.average_consumption ? Number(formData.average_consumption) : undefined
      })
      setShowModal(false)
      setFormData({
        cost_type: 'other',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        category_id: '',
        frequency: 'onetime',
        payment_method: '',
        due_date: '',
        is_recurring: false,
        estimated_duration_days: '',
        quantity_purchased: '',
        unit: '',
        vehicle_mileage: '',
        average_consumption: ''
      })
      // Refresh costs
      const costsData = await getOperationalCosts()
      setCosts(costsData || [])
    } catch (error) {
      console.error('Error creating cost:', error)
      alert('Erro ao criar custo')
    }
  }

  // Calcular totais
  const totalCosts = costs.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
  const costsByCategory = costs.reduce((acc: any, cost: any) => {
    const category = cost.operational_cost_categories?.name || 'Outros'
    if (!acc[category]) acc[category] = 0
    acc[category] += Number(cost.amount) || 0
    return acc
  }, {})
  
  const recurringCosts = costs.filter(c => c.is_recurring)
  const totalRecurring = recurringCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)

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
          <h1 className="text-3xl font-bold text-foreground">Custos Operacionais</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os custos operacionais da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/custos/categorias">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Categorias
            </Button>
          </Link>
          <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Custo
          </Button>
        </div>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Recorrentes</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRecurring)}</div>
            <p className="text-xs text-muted-foreground">{recurringCosts.length} recorrentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Mensal</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRecurring)}</div>
            <p className="text-xs text-muted-foreground">Estimativa mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(costsByCategory).length}</div>
            <p className="text-xs text-muted-foreground">Ativas</p>
          </CardContent>
        </Card>
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
              <Button onClick={() => setShowModal(true)}>Registrar Primeiro Custo</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {costs.map((cost) => (
                <div key={cost.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: cost.operational_cost_categories?.color || '#3b82f6' }}
                      >
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{cost.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cost.operational_cost_categories?.name || 'Outros'} • {formatDate(cost.date)}
                        </p>
                        {cost.is_recurring && (
                          <p className="text-xs text-primary mt-1">
                            {getFrequencyLabel(cost.frequency)} • Recorrente
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(Number(cost.amount))}</p>
                      {cost.payment_method && (
                        <p className="text-xs text-muted-foreground">{getPaymentMethodLabel(cost.payment_method)}</p>
                      )}
                    </div>
                  </div>
                  {cost.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">{cost.notes}</p>
                    </div>
                  )}
                  {cost.due_date && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Vencimento: {formatDate(cost.due_date)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl mx-4 my-8">
            <CardHeader>
              <CardTitle>Novo Custo Operacional</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category_id">Categoria</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency">Frequência</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onetime">Único</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="card">Cartão</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="due_date">Data de Vencimento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_recurring">Custo Recorrente</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Custo
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
