'use client'

import { useState } from 'react'
import { PdvProduct, PdvCategory } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search } from 'lucide-react'

interface ProductGridProps {
  products: PdvProduct[]
  categories: PdvCategory[]
  onSelectProduct: (product: PdvProduct, weight: number) => void
}

export function ProductGrid({ products, categories, onSelectProduct }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<PdvProduct | null>(null)
  const [weight, setWeight] = useState('1.000')

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = !selectedCategory || p.category_id === selectedCategory
    return matchSearch && matchCategory
  })

  const handleAddToCart = () => {
    if (selectedProduct && weight) {
      const weightKg = parseFloat(weight.replace(',', '.'))
      if (weightKg > 0) {
        onSelectProduct(selectedProduct, weightKg)
        setWeight('1.000')
        setSelectedProduct(null)
      }
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)

  return (
    <div className="space-y-4">
      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs de Categorias */}
      {categories.length > 0 && (
        <Tabs
          defaultValue="all"
          onValueChange={val => setSelectedCategory(val === 'all' ? null : val)}
        >
          <TabsList className="w-full justify-start overflow-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Grid de Produtos */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map(product => (
          <Dialog key={product.id}>
            <DialogTrigger asChild>
              <Card
                className="cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProduct(product)}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="h-32 w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Sem imagem</span>
                  </div>
                )}
                <div className="p-2 space-y-1">
                  <div className="font-medium text-sm line-clamp-2">
                    {product.name}
                  </div>
                  <div className="text-sm font-bold text-green-600">
                    {formatPrice(product.price_per_kg)}/kg
                  </div>
                </div>
              </Card>
            </DialogTrigger>

            {selectedProduct?.id === product.id && (
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedProduct.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedProduct.image_url && (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="h-40 w-full object-cover rounded"
                    />
                  )}

                  {selectedProduct.description && (
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Peso (kg)</label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-gray-100 p-3 rounded space-y-1">
                    <div className="flex justify-between">
                      <span>Preço por kg:</span>
                      <span>{formatPrice(selectedProduct.price_per_kg)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>
                        {formatPrice(
                          selectedProduct.price_per_kg * parseFloat(weight)
                        )}
                      </span>
                    </div>
                  </div>

                  <Button onClick={handleAddToCart} className="w-full">
                    Adicionar ao Carrinho
                  </Button>
                </div>
              </DialogContent>
            )}
          </Dialog>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum produto encontrado
        </div>
      )}
    </div>
  )
}
