import { CartProvider } from '@/contexts/cart-context'
import { Header } from '@/components/store/header'
import { Footer } from '@/components/store/footer'
import { MobileCartFloat } from '@/components/store/mobile-cart-float'
import { StickyHeaderWrapper } from '@/components/store/sticky-header-wrapper'

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        {/* Header Normal */}
        <Header />
        
        {/* Sticky Header - Aparece ao rolar 10% */}
        <StickyHeaderWrapper />
        
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileCartFloat />
      </div>
    </CartProvider>
  )
}
