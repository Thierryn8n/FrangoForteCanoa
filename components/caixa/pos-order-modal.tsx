'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, Trash2 } from 'lucide-react'

interface PosOrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface PosOrder {
  customer_name: string
  customer_phone?: string
  delivery_address?: string
  payment_method: 'cash' | 'credit' | 'debit' | 'transfer'
  payment_status: 'paid' | 'pending'
  subtotal: number
  delivery_fee: number
  total: number
  notes?: string
  items: PosOrderItem[]
}

interface PosOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (order: PosOrder) => void
}

export function PosOrderModal({ isOpen, onClose, onSuccess }: PosOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PosOrder>({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    payment_method: 'cash',
    payment_status: 'paid',
    subtotal: 0,
    delivery_fee: 5,
    total: 5,
    notes: '',
    items: []
  })
  const [currentItem, setCurrentItem] = useState({
    product_name: '',
    quantity: 1,
    unit_price: 0
  })

  const calculateTotals = () => {
    const itemsSubtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0)
    const total = itemsSubtotal + formData.delivery_fee
    setFormData(prev => ({
      ...prev,
      subtotal: itemsSubtotal,
      total: total
    }))
  }

  const addItem = () => {
    if (currentItem.product_name && currentItem.unit_price > 0 && currentItem.quantity > 0) {
      const newItem: PosOrderItem = {
        product_id: Date.now().toString(),
        product_name: currentItem.product_name,
        quantity: currentItem.quantity,
        unit_price: currentItem.unit_price,
        subtotal: currentItem.quantity * currentItem.unit_price
      }
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }))
      
      setCurrentItem({
        product_name: '',
        quantity: 1,
        unit_price: 0
      })
      
      calculateTotals()
    }
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
    calculateTotals()
  }

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
    
    if (field === 'quantity' || field === 'unit_price') {
      calculateTotals()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customer_name || formData.items.length === 0) {
      alert('Preencha o nome do cliente e adicione pelo menos um item')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/pos-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        onSuccess(formData)
        onClose()
        
        // Resetar formulário
        setFormData({
          customer_name: '',
          customer_phone: '',
          delivery_address: '',
          payment_method: 'cash',
          payment_status: 'paid',
          subtotal: 0,
          delivery_fee: 5,
          total: 5,
          notes: '',
          items: []
        })
        setCurrentItem({
          product_name: '',
          quantity: 1,
          unit_price: 0
        })
      } else {
        alert('Erro ao criar pedido')
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      alert('Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Novo Pedido PDV</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardContent className="space-y-6">
            {/* Dados do Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Nome do Cliente *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Digite o nome do cliente"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="customer_phone">Telefone</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  placeholder="(85) 99999-9999"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="delivery_address">Endereço de Entrega</Label>
              <Textarea
                id="delivery_address"
                value={formData.delivery_address}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                placeholder="Digite o endereço completo"
                rows={2}
              />
            </div>

            {/* Itens do Pedido */}
            <div>
              <Label>Itens do Pedido</Label>
              <div className="space-y-4">
                {/* Formulário para adicionar item */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Nome do produto"
                      value={currentItem.product_name}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, product_name: e.target.value }))}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qtd"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                      min="1"
                      step="0.001"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Preço"
                      value={currentItem.unit_price}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Button type="button" onClick={addItem} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Lista de itens */}
                {formData.items.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-semibold mb-2">Itens Adicionados:</div>
                    {formData.items.map((item, index) => (
                      <div key={item.product_id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex-1">
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} x R$ {item.unit_price.toFixed(2)} = R$ {item.subtotal.toFixed(2)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="credit">Cartão Crédito</SelectItem>
                    <SelectItem value="debit">Cartão Débito</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="payment_status">Status do Pagamento</Label>
                <Select value={formData.payment_status} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="delivery_fee">Taxa de Entrega</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  value={formData.delivery_fee}
                  onChange={(e) => {
                    const newDeliveryFee = parseFloat(e.target.value) || 0
                    setFormData(prev => ({
                      ...prev,
                      delivery_fee: newDeliveryFee,
                      total: prev.subtotal + newDeliveryFee
                    }))
                  }}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações do pedido..."
                rows={2}
              />
            </div>

            {/* Resumo */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">R$ {formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Entrega:</span>
                  <span className="font-semibold">R$ {formData.delivery_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>R$ {formData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>

          <div className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Criando Pedido...' : 'Criar Pedido'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
