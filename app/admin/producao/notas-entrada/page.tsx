'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  getFarmInvoices, 
  createFarmInvoice, 
  deleteFarmInvoice,
  getProductionSummary,
  fetchNfeDataFromSEFAZ
} from '@/lib/actions/stock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  Barcode,
  TrendingUp,
  Target,
  CheckCircle
} from 'lucide-react'
import { BarcodeScanner } from '@/components/admin/barcode-scanner'

export default function FarmInvoicesPage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [productionSummary, setProductionSummary] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [fetchingNfe, setFetchingNfe] = useState(false)
  const [formData, setFormData] = useState({
    access_key: '',
    invoice_number: '',
    invoice_series: '001',
    invoice_date: new Date().toISOString().split('T')[0],
    supplier_name: '',
    supplier_cnpj: '',
    product_description: 'FRANGO DE CORTE',
    quantity_kg: '',
    unit_price: '',
    live_chicken_count: '',
    notes: ''
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
      const [invoicesData, summaryData] = await Promise.all([
        getFarmInvoices(),
        getProductionSummary()
      ])
      setInvoices(invoicesData || [])
      setProductionSummary(summaryData)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchNfeData = async () => {
    if (formData.access_key.length !== 44) {
      alert('A chave de acesso deve ter 44 dígitos')
      return
    }

    setFetchingNfe(true)
    try {
      const nfeData = await fetchNfeDataFromSEFAZ(formData.access_key)
      
      setFormData({
        ...formData,
        invoice_number: nfeData.invoice_number,
        invoice_series: nfeData.invoice_series,
        invoice_date: nfeData.invoice_date,
        supplier_name: nfeData.supplier_name,
        supplier_cnpj: nfeData.supplier_cnpj,
        product_description: nfeData.product_description,
        quantity_kg: nfeData.quantity_kg.toString(),
        unit_price: nfeData.unit_price.toString(),
        notes: `Dados importados da SEFAZ em ${new Date().toLocaleString('pt-BR')}`
      })
      
      alert('Dados da NF-e importados com sucesso!')
    } catch (error: any) {
      console.error('Erro ao buscar dados da NF-e:', error)
      alert(`Erro ao buscar dados da NF-e: ${error.message}`)
    } finally {
      setFetchingNfe(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const quantityKg = Number(formData.quantity_kg)
      const unitPrice = Number(formData.unit_price)
      const liveChickenCount = Number(formData.live_chicken_count)
      
      const invoiceData = {
        access_key: formData.access_key,
        invoice_number: formData.invoice_number,
        invoice_series: formData.invoice_series,
        invoice_date: formData.invoice_date,
        supplier_name: formData.supplier_name,
        supplier_cnpj: formData.supplier_cnpj,
        product_description: formData.product_description,
        quantity_kg: quantityKg,
        unit_price: unitPrice,
        total_value: quantityKg * unitPrice,
        live_chicken_count: liveChickenCount || undefined,
        average_weight_per_chicken: liveChickenCount > 0 ? quantityKg / liveChickenCount : undefined,
        average_price_per_chicken: liveChickenCount > 0 ? (quantityKg * unitPrice) / liveChickenCount : undefined,
        notes: formData.notes
      }

      await createFarmInvoice(invoiceData)
      setShowModal(false)
      setFormData({
        access_key: '',
        invoice_number: '',
        invoice_series: '001',
        invoice_date: new Date().toISOString().split('T')[0],
        supplier_name: '',
        supplier_cnpj: '',
        product_description: 'FRANGO DE CORTE',
        quantity_kg: '',
        unit_price: '',
        live_chicken_count: '',
        notes: ''
      })
      fetchData()
    } catch (error) {
      console.error('Erro ao criar nota:', error)
      alert('Erro ao criar nota fiscal')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta nota?')) return
    try {
      await deleteFarmInvoice(id)
      fetchData()
    } catch (error) {
      console.error('Erro ao excluir nota:', error)
      alert('Erro ao excluir nota fiscal')
    }
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notas Fiscais de Entrada</h1>
          <p className="text-muted-foreground">Gerencie as notas fiscais de entrada de frango da granja</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Nota
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

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Notas Fiscais</CardTitle>
        </CardHeader>
        <CardContent>
          {!invoices || invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhuma nota fiscal registrada</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Nota
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{invoice.supplier_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Nota {invoice.invoice_number} - {formatDate(invoice.invoice_date)}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <p className="font-medium">{invoice.quantity_kg} KG</p>
                          <p className="text-muted-foreground">Peso total</p>
                        </div>
                        {invoice.live_chicken_stock?.[0] && (
                          <div>
                            <p className="font-medium">{invoice.live_chicken_stock[0].total_received} aves</p>
                            <p className="text-muted-foreground">Quantidade</p>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{formatCurrency(invoice.total_value)}</p>
                          <p className="text-muted-foreground">Valor total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(invoice.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Nova Nota Fiscal de Entrada</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="access_key">Chave de Acesso</Label>
                    <div className="flex gap-2">
                      <Input
                        id="access_key"
                        value={formData.access_key}
                        onChange={(e) => {
                          // Aceitar apenas números
                          const cleaned = e.target.value.replace(/\D/g, '')
                          setFormData({ ...formData, access_key: cleaned })
                        }}
                        placeholder="44 dígitos numéricos"
                        maxLength={44}
                        pattern="[0-9]{44}"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowScanner(true)}
                      >
                        <Barcode className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="invoice_number">Número da Nota</Label>
                    <Input
                      id="invoice_number"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleFetchNfeData}
                  disabled={fetchingNfe || formData.access_key.length !== 44}
                >
                  {fetchingNfe ? 'Buscando dados da SEFAZ...' : 'Buscar dados da SEFAZ'}
                </Button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice_date">Data da Nota</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier_name">Fornecedor</Label>
                    <Input
                      id="supplier_name"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                      placeholder="Ex: TIJUCA ALIMENTOS LTDA"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity_kg">Quantidade (KG)</Label>
                    <Input
                      id="quantity_kg"
                      type="number"
                      step="0.001"
                      value={formData.quantity_kg}
                      onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_price">Preço Unitário (R$/KG)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="live_chicken_count">Quantidade de Aves (opcional)</Label>
                  <Input
                    id="live_chicken_count"
                    type="number"
                    value={formData.live_chicken_count}
                    onChange={(e) => setFormData({ ...formData, live_chicken_count: e.target.value })}
                    placeholder="Ex: 66 aves"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Salvar Nota
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={(barcode) => {
            setFormData({ ...formData, access_key: barcode })
            setShowScanner(false)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
