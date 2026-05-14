'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus, Minus, ShoppingCart, Heart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Product as ProductType } from '@/lib/types'

interface ProductCardProps {
  product: ProductType
  onOpenDrawer?: (product: ProductType) => void
}

export function ProductCard({ product, onOpenDrawer }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const { addItem } = useCart()
  const { user } = useAuth()
  const supabase = createClient()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const handleAddToCart = async () => {
    setIsAdding(true)
    
    // Adicionar ao carrinho
    addItem({
      id: product.id,
      type: 'product',
      name: product.name,
      price: product.price,
      quantity,
      unit: product.unit,
      image_url: product.image_url,
    })
    
    // Feedback visual
    toast.success(`${product.name} adicionado ao carrinho!`)
    
    // Resetar quantidade e estado de loading
    setQuantity(1)
    
    // Animação de feedback
    setTimeout(() => {
      setIsAdding(false)
    }, 600)
  }

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Faça login para favoritar produtos!')
      return
    }

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('customer_favorites')
          .delete()
          .eq('customer_id', user.id)
          .eq('product_id', product.id)
        
        if (error) throw error
        setIsFavorited(false)
        toast.success('Removido dos favoritos')
      } else {
        const { error } = await supabase
          .from('customer_favorites')
          .insert({ 
            customer_id: user.id, 
            product_id: product.id 
          })
        
        if (error) {
          // Se já existir, apenas marcamos como favoritado localmente
          if (error.code === '23505') {
            setIsFavorited(true)
            return
          }
          throw error
        }
        setIsFavorited(true)
        toast.success('Adicionado aos favoritos!')
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error)
      toast.error(`Erro: ${error.message || 'Erro ao favoritar produto'}`)
    }
  }

  // Verificar se o produto já está favoritado ao carregar
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return
      
      const { data, error } = await supabase
        .from('customer_favorites')
        .select('id')
        .eq('customer_id', user.id)
        .eq('product_id', product.id)
        .single()
      
      if (data) setIsFavorited(true)
    }
    
    checkFavorite()
  }, [user, product.id, supabase])

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-md card-hover border border-border flex flex-col h-full">
      {/* Product Image */}
      <div className="relative aspect-square bg-muted product-image-zoom flex-shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <Image
                src="/logo-oficial.png"
                alt={product.name}
                width={80}
                height={80}
                className="object-contain opacity-50"
              />
            </div>
          )}
        </div>
        
        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
            isFavorited 
              ? 'bg-red-500 text-white' 
              : 'bg-white/70 text-gray-700 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Discount badge */}
        {product.original_price && product.original_price > product.price && (
          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] md:text-xs font-bold px-2 py-1 rounded-full z-10">
            {Math.round((1 - product.price / product.original_price) * 100)}% OFF
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-sm md:text-base mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2 h-8 md:h-10">
          {product.short_description}
        </p>
        
        {/* Price */}
        <div className="mb-3 md:mb-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1 md:gap-2">
              <span className="text-base md:text-xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              <span className="text-[10px] md:text-sm text-muted-foreground">/{product.unit}</span>
            </div>
            {product.price_per_kg > 0 && (
              <span className="text-[10px] md:text-xs text-muted-foreground font-medium">
                ({formatPrice(product.price_per_kg)}/kg)
              </span>
            )}
          </div>
          {product.original_price && product.original_price > product.price && (
            <span className="text-[10px] md:text-sm text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        {/* Quantity & Actions - Responsive Layout */}
        <div className="mt-auto">
          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:flex items-center gap-2">
            {/* Quantity Selector */}
            <div className="flex items-center border rounded-lg overflow-hidden flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 w-10 text-sm transition-all duration-300 flex-shrink-0 ${
                isAdding 
                  ? 'scale-95 opacity-80 animate-pulse' 
                  : 'hover:scale-105 active:scale-95'
              }`}
              size="icon"
            >
              {isAdding ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </Button>
            
            {/* View Details Button */}
            <Button
              variant="outline"
              onClick={() => onOpenDrawer?.(product)}
              className="h-10 w-10 text-sm font-medium flex-shrink-0"
              size="icon"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile: Vertical Layout */}
          <div className="flex md:hidden items-center gap-2">
            {/* Quantity Selector */}
            <div className="flex items-center border rounded-lg overflow-hidden flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center text-xs font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Action Buttons - Vertical Stack */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-8 w-8 text-xs transition-all duration-300 ${
                  isAdding 
                    ? 'scale-95 opacity-80 animate-pulse' 
                    : 'hover:scale-105 active:scale-95'
                }`}
                size="icon"
              >
                {isAdding ? (
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <ShoppingCart className="w-3 h-3" />
                )}
              </Button>
              
              {/* View Details Button */}
              <Button
                variant="outline"
                onClick={() => onOpenDrawer?.(product)}
                className="h-8 w-8 text-xs font-medium"
                size="icon"
              >
                <Eye className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
