'use client'

import { PdvCartItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card } from '@/components/ui/card'
import { X, Plus, Minus, Edit } from 'lucide-react'
import { useState } from 'react'

interface CartSidebarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  items: PdvCartItem[]
  onUpdateQuantity: (itemId: string, weight: number) => void
  onRemoveItem: (itemId: string) => void
  onCheckout: () => void
  onEditItem: (item: PdvCartItem) => void
}

export function CartSidebar({
  isOpen,
  onOpenChange,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onEditItem
}: CartSidebarProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)

  const handleWeightChange = (itemId: string, newWeight: string) => {
    const weight = parseFloat(newWeight.replace(',', '.'))
    if (weight > 0) {
      onUpdateQuantity(itemId, weight)
    }
  }

  const handleIncrement = (item: PdvCartItem) => {
    const newWeight = item.weight_kg + 0.1
    onUpdateQuantity(item.id, Math.round(newWeight * 1000) / 1000)
  }

  const handleDecrement = (item: PdvCartItem) => {
    const newWeight = Math.max(0.001, item.weight_kg - 0.1)
    onUpdateQuantity(item.id, Math.round(newWeight * 1000) / 1000)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
        <SheetHeader>
          <SheetTitle>Carrinho ({items.length})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Carrinho vazio
          </div>
        ) : (
          <>
            {/* Lista de Itens */}
            <div className="flex-1 overflow-auto space-y-2">
              {items.map(item => (
                <Card key={item.id} className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatPrice(item.price_per_kg)}/kg
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditItem(item)}
                        title="Editar item"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveItem(item.id)}
                        title="Remover item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Controle de Peso */}
                  <div className="flex gap-2 items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecrement(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.weight_kg.toFixed(3)}
                      onChange={e => handleWeightChange(item.id, e.target.value)}
                      className="h-8 text-center flex-1"
                    />
                    <span className="text-xs text-gray-500">kg</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIncrement(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Total do Item */}
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatPrice(item.total_price)}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Resumo */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <Button onClick={onCheckout} className="w-full h-12 text-lg">
                Ir para Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
