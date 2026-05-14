'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, ShoppingCart, Check, Package, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { toast } from 'sonner'
import type { Kit } from '@/lib/types'

interface KitDrawerProps {
  kit: Kit | null
  isOpen: boolean
  onClose: () => void
}

export function KitDrawer({ kit, isOpen, onClose }: KitDrawerProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const { addItem } = useCart()

  // Reset quantity when kit changes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setIsAdding(false)
    }
  }, [isOpen, kit?.id])

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
    if (!kit?.original_price || !kit?.price) return 0
    return Math.round(((kit.original_price - kit.price) / kit.original_price) * 100)
  }

  const handleAddToCart = async () => {
    if (!kit) return
    
    setIsAdding(true)
    
    addItem({
      id: kit.id,
      type: 'kit',
      name: kit.name,
      price: kit.price,
      quantity,
      unit: 'kit',
      image_url: kit.image_url,
    })
    
    toast.success(
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5 text-green-500" />
        <span>{kit.name} adicionado ao carrinho!</span>
      </div>,
      { duration: 3000 }
    )
    
    setTimeout(() => {
      setIsAdding(false)
      onClose()
    }, 800)
  }

  if (!kit) return null

  const discount = calculateDiscount()
  const totalPrice = kit.price * quantity
  const originalTotal = kit.original_price ? kit.original_price * quantity : 0
  const savings = kit.original_price ? originalTotal - totalPrice : 0

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
            {/* ESQUERDA: Imagem do Kit */}
            <div className="space-y-4 flex-shrink-0 w-1/3">
              <div className="relative aspect-square bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:scale-105">
                {discount > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg z-10">
                    -{discount}% OFF
                  </div>
                )}
                {kit.image_url ? (
                  <Image
                    src={kit.image_url}
                    alt={kit.name}
                    fill
                    className="object-contain p-6"
                  />
                ) : (
                  <Image
                    src="/logo-oficial.png"
                    alt={kit.name}
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
                  {kit.name}
                </h2>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Package className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                    Kit Especial
                  </span>
                </div>
              </div>

              {/* Price Section */}
              <div className="bg-red-50 rounded-xl p-4 space-y-3 group hover:bg-red-100 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-red-600">
                    {formatPrice(kit.price)}
                  </span>
                  <span className="text-gray-500 text-sm">/kit</span>
                </div>
                
                {kit.original_price && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 line-through">
                      {formatPrice(kit.original_price)}
                    </span>
                    <span className="text-green-600 font-medium">
                      Economize {formatPrice(kit.original_price - kit.price)}
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
                    <span className="text-2xl font-bold text-red-600">
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
                      : 'bg-red-600 hover:bg-red-700 hover:scale-[1.02]'
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
              {/* O que está incluso */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 text-sm">O que está incluso:</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {kit.contents || kit.description}
                </p>
              </div>

              {/* Benefícios do Kit */}
              <div className="bg-red-50 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-red-800 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Benefícios:
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Produtos selecionados</li>
                  <li>• Preço especial</li>
                  <li>• Entrega rápida</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Layout Mobile (mantido como antes) */}
          <div className="lg:hidden space-y-4">
            {/* Kit Image */}
            <div className="relative w-full aspect-video bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {discount > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg z-10">
                  -{discount}% OFF
                </div>
              )}
              {kit.image_url ? (
                <Image
                  src={kit.image_url}
                  alt={kit.name}
                  fill
                  className="object-contain p-4"
                />
              ) : (
                <Image
                  src="/logo-oficial.png"
                  alt={kit.name}
                  width={200}
                  height={200}
                  className="object-contain"
                />
              )}
            </div>

            {/* Kit Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Kit Especial</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {kit.name}
              </h2>
              
              <p className="text-gray-600 text-sm leading-relaxed">
                {kit.contents || kit.description}
              </p>

              {/* Price Section */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-red-600">
                    {formatPrice(kit.price)}
                  </span>
                  <span className="text-gray-500">/kit</span>
                </div>
                
                {kit.original_price && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 line-through">
                      {formatPrice(kit.original_price)}
                    </span>
                    <span className="text-green-600 font-medium">
                      Economize {formatPrice(kit.original_price - kit.price)}
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
                  <span className="text-gray-600">Total ({quantity} kit{quantity > 1 ? 's' : ''}):</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-red-600">
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
                      : 'bg-red-600 hover:bg-red-700 hover:scale-[1.02]'
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

              {/* Kit Benefits */}
              <div className="bg-red-50 rounded-xl p-4 mt-4">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  O que está incluso:
                </h3>
                <p className="text-sm text-red-700 leading-relaxed">
                  {kit.contents || 'Kit completo com produtos selecionados de alta qualidade.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
