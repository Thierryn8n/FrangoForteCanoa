'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import type { Kit } from '@/lib/types'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useState } from 'react'
import { KitDrawer } from './kit-drawer'

interface KitsSectionProps {
  kits: Kit[]
}

export function KitsSection({ kits }: KitsSectionProps) {
  const featuredKits = kits.filter(k => k.is_featured && k.is_active).slice(0, 8)
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    loop: false
  })
  
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const kitsToDisplay = featuredKits.length > 0 ? featuredKits : [
    { id: '1', name: 'KIT CHURRASCO', contents: '2kg Asa + 1kg Corinha + 1kg Peito', price: 49.90, original_price: 65.00, image_url: null },
    { id: '2', name: 'KIT FAMÍLIA', contents: '2kg Coxa e Sobrecoxa + 1kg Asa', price: 79.90, original_price: 95.00, image_url: null },
    { id: '3', name: 'KIT ECONÔMICO', contents: '3kg Coxa e Sobrecoxa + 1kg Peito', price: 54.90, original_price: 64.90, image_url: null },
  ]

  return (
    <>
    <section className="py-12 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10"
          style={{ background: 'linear-gradient(145deg, #d32f2f 0%, #b71c1c 100%)' }}
        >
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-stretch min-h-[320px]">
            {/* Mascote - Desktop (Sticky) */}
            <div className="hidden lg:flex items-end justify-center w-[180px] flex-shrink-0 relative lg:sticky lg:top-24 lg:self-start">
              <Image
                src="/logo-oficial.png"
                alt="Mascote Frango Forte"
                width={160}
                height={160}
                className="object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] relative z-10 -mb-2"
              />
            </div>

            {/* Left Content Column */}
            <div className="relative flex flex-col justify-center px-8 py-8 lg:pl-6 lg:w-[300px] shrink-0 z-20">
              <span className="text-yellow-400 font-black text-[10px] tracking-[0.2em] uppercase mb-2 drop-shadow-sm">
                KITS E OFERTAS
              </span>

              <h2 className="text-white font-black text-2xl lg:text-3xl leading-[0.95] mb-3 drop-shadow-xl">
                MAIS ECONOMIA<br />
                <span className="text-yellow-400">PARA VOCÊ!</span>
              </h2>
              
              <p className="text-white/80 text-xs mb-6 leading-tight font-medium max-w-[200px]">
                Cortes selecionados com preços imbatíveis.
              </p>

              <Link
                href="/kits"
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-white text-black font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-lg hover:-translate-y-1 active:scale-95 group/btn"
              >
                VER TODOS
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Carousel Column */}
            <div className="flex-1 relative py-10 group overflow-hidden bg-black/5 lg:rounded-l-[3rem]">
              <div className="overflow-hidden h-full px-6 lg:px-12" ref={emblaRef}>
                <div className="flex h-full">
                  {kitsToDisplay.map((kit, i) => (
                    <div
                      key={kit.id || i}
                      className="flex-[0_0_160px] md:flex-[0_0_180px] px-2"
                    >
                      <button
                        onClick={() => {
                          if (kit.id && typeof kit.id === 'string' && kit.id.length > 10) {
                            setSelectedKit(kit as Kit)
                            setIsDrawerOpen(true)
                          }
                        }}
                        className="block h-full group/item text-left w-full cursor-pointer"
                      >
                        {/* Product Image - TRANSPARENT BACKGROUND EFFECT */}
                        <div className="relative aspect-square mb-3 flex items-center justify-center p-2">
                          <div className="absolute inset-2 bg-white/5 rounded-full scale-75 blur-2xl group-hover/item:bg-white/10 transition-colors" />
                          {kit.image_url ? (
                            <Image
                              src={kit.image_url}
                              alt={kit.name}
                              fill
                              className="object-contain p-1 filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] group-hover/item:scale-105 group-hover/item:-rotate-3 transition-all duration-700 mix-blend-multiply"
                            />
                          ) : (
                            <Image
                              src="/logo-oficial.png"
                              alt="Placeholder"
                              width={120}
                              height={120}
                              className="object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] group-hover/item:scale-105 transition-all duration-700 mix-blend-multiply brightness-110"
                            />
                          )}
                        </div>

                        {/* Info Section */}
                        <div className="space-y-0.5">
                          <h3 className="text-white font-black text-xs tracking-tighter uppercase group-hover/item:text-yellow-400 transition-colors">
                            {kit.name}
                          </h3>
                          <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider mb-1">
                            {kit.contents}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 font-black text-xl md:text-2xl tracking-tighter">
                              {typeof kit.price === 'number' ? formatPrice(kit.price) : kit.price}
                            </span>
                            {kit.original_price && (
                              <span className="text-white/30 text-[10px] line-through font-bold">
                                {formatPrice(kit.original_price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows - Better Placement */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex">
                <button
                  onClick={scrollPrev}
                  className="w-12 h-12 bg-white/10 hover:bg-yellow-400 hover:text-black backdrop-blur-xl rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl pointer-events-auto border border-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={scrollNext}
                  className="w-12 h-12 bg-white/10 hover:bg-yellow-400 hover:text-black backdrop-blur-xl rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl pointer-events-auto border border-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <KitDrawer 
      kit={selectedKit}
      isOpen={isDrawerOpen}
      onClose={() => {
        setIsDrawerOpen(false)
        setSelectedKit(null)
      }}
    />
    </>
  )
}
