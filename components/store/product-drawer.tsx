'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, ShoppingCart, Check, Scale, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'

interface ProductDrawerProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function ProductDrawer({ product, isOpen, onClose }: ProductDrawerProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const { addItem } = useCart()

  // Reset quantity when product changes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setIsAdding(false)
    }
  }, [isOpen, product?.id])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const calculateDiscount = () => {
    if (!product?.original_price || !product?.price) return 0
    return Math.round(((product.original_price - product.price) / product.original_price) * 100)
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    setIsAdding(true)
    
    addItem({
      id: product.id,
      type: 'product',
      name: product.name,
      price: product.price,
      quantity,
      unit: product.unit,
      image_url: product.image_url,
    })
    
    toast.success(
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5 text-green-500" />
        <span>{product.name} adicionado ao carrinho!</span>
      </div>,
      { duration: 3000 }
    )
    
    setTimeout(() => {
      setIsAdding(false)
      onClose()
    }, 800)
  }

  if (!product) return null

  const discount = calculateDiscount()
  const totalPrice = product.price * quantity
  const originalTotal = product.original_price ? product.original_price * quantity : 0
  const savings = product.original_price ? originalTotal - totalPrice : 0

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(90vh - 40px)' }}>
          {/* Layout Desktop: 3 seções horizontais | Mobile: 1 coluna */}
          <div className="hidden lg:flex lg:gap-6">
            {/* ESQUERDA: Imagem do Produto */}
            <div className="space-y-4 flex-shrink-0 w-1/3">
              <div className="relative aspect-square bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:scale-105">
                {discount > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg z-10">
                    -{discount}% OFF
                  </div>
                )}
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-6"
                  />
                ) : (
                  <Image
                    src="/logo-oficial.png"
                    alt={product.name}
                    width={200}
                    height={200}
                    className="object-contain opacity-50"
                  />
                )}
              </div>
            </div>

            {/* CENTRO: Quantidade e Preço */}
            <div className="space-y-4 flex-shrink-0 w-1/3">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h2>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
                    {product.category?.name || 'Produto'}
                  </span>
                </div>
              </div>

              {/* Price Section */}
              <div className="bg-orange-50 rounded-xl p-4 space-y-3 group hover:bg-orange-100 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-orange-600">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-gray-500 text-sm">/{product.unit}</span>
                </div>
                
                {product.price_per_kg && product.price_per_kg > 0 && (
                  <p className="text-sm text-gray-600">
                    {formatPrice(product.price_per_kg)}/kg
                  </p>
                )}
                
                {product.original_price && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 line-through">
                      {formatPrice(product.original_price)}
                    </span>
                    <span className="text-green-600 font-medium">
                      Economize {formatPrice(product.original_price - product.price)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <span className="font-medium text-gray-700 text-sm">Quantidade:</span>
                <div className="flex items-center justify-center gap-3 bg-gray-100 rounded-lg p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-white"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-white"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-3">
                <div className="text-center space-y-2">
                  <span className="text-gray-600 text-sm">Total:</span>
                  <div>
                    <span className="text-2xl font-bold text-orange-600">
                      {formatPrice(totalPrice)}
                    </span>
                    {savings > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Você economiza {formatPrice(savings)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 ${
                    isAdding 
                      ? 'bg-green-500 hover:bg-green-600 scale-95' 
                      : 'bg-orange-600 hover:bg-orange-700 hover:scale-[1.02]'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Check className="w-6 h-6 mr-2" />
                      ADICIONADO!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6 mr-2" />
                      ADICIONAR AO CARRINHO
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* DIREITA: Informações Adicionais */}
            <div className="space-y-4 flex-shrink-0 w-1/3">
              {/* Features */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 text-sm">Detalhes</h3>
                {product.unit && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Scale className="w-4 h-4" />
                    <span>Unidade: {product.unit}</span>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {product.short_description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 text-sm">Resumo</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.short_description}
                  </p>
                </div>
              )}

              {/* Descrição Completa */}
              {product.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 text-sm">Descrição</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Layout Mobile (mantido como antes) */}
          <div className="lg:hidden space-y-4">
            {/* Product Image */}
            <div className="relative w-full aspect-video bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {discount > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg z-10">
                  -{discount}% OFF
                </div>
              )}
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                />
              ) : (
                <Image
                  src="/logo-oficial.png"
                  alt={product.name}
                  width={200}
                  height={200}
                  className="object-contain opacity-50"
                />
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Package className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
                  {product.category?.name || 'Produto'}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h2>
              
              {product.short_description && (
                <p className="text-gray-600 text-sm leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Features */}
              <div className="flex gap-4 py-2">
                {product.unit && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Scale className="w-4 h-4" />
                    <span>Unidade: {product.unit}</span>
                  </div>
                )}
              </div>

              {/* Price Section */}
              <div className="bg-orange-50 rounded-xl p-4 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-orange-600">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-gray-500">/{product.unit}</span>
                </div>
                
                {product.price_per_kg && product.price_per_kg > 0 && (
                  <p className="text-sm text-gray-600">
                    {formatPrice(product.price_per_kg)}/kg
                  </p>
                )}
                
                {product.original_price && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 line-through">
                      {formatPrice(product.original_price)}
                    </span>
                    <span className="text-green-600 font-medium">
                      Economize {formatPrice(product.original_price - product.price)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between py-2">
                <span className="font-medium text-gray-700">Quantidade:</span>
                <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-white"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-10 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-white"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Total ({quantity} {product.unit}{quantity > 1 ? 's' : ''}):</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-orange-600">
                      {formatPrice(totalPrice)}
                    </span>
                    {savings > 0 && (
                      <p className="text-xs text-green-600">
                        Você economiza {formatPrice(savings)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 ${
                    isAdding 
                      ? 'bg-green-500 hover:bg-green-600 scale-95' 
                      : 'bg-orange-600 hover:bg-orange-700 hover:scale-[1.02]'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Check className="w-6 h-6 mr-2" />
                      ADICIONADO!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6 mr-2" />
                      ADICIONAR AO CARRINHO
                    </>
                  )}
                </Button>
              </div>

              {/* Additional Info */}
              {product.description && (
                <div className="bg-gray-50 rounded-xl p-4 mt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Descrição</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
