'use client'

import { useState, useEffect } from 'react'
import { X, Package, Scale, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface StockItem {
  category_id: string
  category_name: string
  product_id?: string
  product_name?: string
  quantity: string
  unit: string
  cost_per_unit: string
}

interface DailyStockOpeningModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function DailyStockOpeningModal({ isOpen, onClose, onComplete }: DailyStockOpeningModalProps) {
  const [loading, setLoading] = useState(false)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/stock/categories')
      const data = await response.json()
      setCategories(data)
      
      // Inicializar itens de estoque com as categorias
      const initialItems: StockItem[] = data.map((cat: any) => ({
        category_id: cat.id,
        category_name: cat.name,
        quantity: '',
        unit: cat.unit_type === 'kg' ? 'kg' : cat.unit_type,
        cost_per_unit: ''
      }))
      setStockItems(initialItems)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleItemChange = (index: number, field: keyof StockItem, value: string) => {
    const updatedItems = [...stockItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setStockItems(updatedItems)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stock/opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockItems: stockItems.filter(item => item.quantity && parseFloat(item.quantity) > 0)
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao abrir estoque')
      }

      onComplete()
      onClose()
    } catch (error) {
      console.error('Error opening stock:', error)
      alert('Erro ao abrir estoque')
    } finally {
      setLoading(false)
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Abertura de Estoque Diário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Estoque de Hoje</strong> - Registre a quantidade de produtos disponíveis para venda hoje.
            </p>
          </div>

          <div className="space-y-4">
            {stockItems.map((item, index) => (
              <Card key={item.category_id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getUnitIcon(item.unit)}
                      <span className="font-medium">{item.category_name}</span>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="w-16 text-center">
                        <label className="text-xs text-muted-foreground mb-1 block">Unidade</label>
                        <div className="text-sm font-medium">{item.unit.toUpperCase()}</div>
                      </div>
                      
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Custo/Unidade (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.cost_per_unit}
                          onChange={(e) => handleItemChange(index, 'cost_per_unit', e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Processando...' : 'Abrir Estoque'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
