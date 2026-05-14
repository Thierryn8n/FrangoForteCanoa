'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PdvCartItem } from '@/lib/types'

interface CartItemEditModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  item: PdvCartItem | null
  onUpdateItem: (item: PdvCartItem) => void
}

export function CartItemEditModal({ isOpen, onOpenChange, item, onUpdateItem }: CartItemEditModalProps) {
  const [weight, setWeight] = useState('')
  const [pricePerKg, setPricePerKg] = useState('')

  useEffect(() => {
    if (item) {
      setWeight(item.weight_kg.toString())
      setPricePerKg(item.price_per_kg.toString())
    }
  }, [item])

  const handleSave = () => {
    if (!item) return

    const newWeight = parseFloat(weight.replace(',', '.'))
    const newPrice = parseFloat(pricePerKg.replace(',', '.'))

    if (newWeight > 0 && newPrice >= 0) {
      onUpdateItem({
        ...item,
        weight_kg: newWeight,
        price_per_kg: newPrice,
        total_price: newWeight * newPrice
      })
      onOpenChange(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Item do Carrinho</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Produto</label>
            <div className="p-2 border rounded bg-muted">
              {item.product.name}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Peso (kg)</label>
            <Input
              type="number"
              step="0.001"
              min="0.001"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.000"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Preço por kg (R$)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="p-3 border rounded bg-muted">
            <div className="flex justify-between text-sm">
              <span>Total:</span>
              <span className="font-medium">
                R$ {((parseFloat(weight) || 0) * (parseFloat(pricePerKg) || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={!weight || !pricePerKg}
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
