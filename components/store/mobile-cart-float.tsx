'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { CartDrawer } from './cart-drawer'

export function MobileCartFloat() {
  const { itemCount, cart } = useCart()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Animação quando itens são adicionados
  useEffect(() => {
    if (itemCount > 0) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 600)
    }
  }, [itemCount])

  // Só mostrar em mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile || itemCount === 0) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg overflow-hidden">
        <div className="bg-background/95 backdrop-blur-sm">
          <div className="w-full px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Informações do carrinho */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`relative flex-shrink-0 ${isAnimating ? 'animate-bounce' : ''}`}>
                  <ShoppingCart className={`w-6 h-6 text-primary transition-all duration-300 ${
                    isAnimating ? 'scale-125 text-orange-500' : ''
                  }`} />
                  <span className={`absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    isAnimating ? 'scale-125 bg-orange-500' : ''
                  }`}>
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Total: {formatPrice(cart.subtotal)}
                  </p>
                </div>
              </div>

              {/* Botão para ver carrinho */}
              <Button 
                onClick={() => setIsCartOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold whitespace-nowrap flex-shrink-0"
              >
                Ver Carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Drawer Lateral */}
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
