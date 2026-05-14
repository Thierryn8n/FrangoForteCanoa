'use client'

import Image from 'next/image'
import { Phone, Truck, Leaf, Clock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative min-h-[500px] md:min-h-[600px] overflow-hidden bg-orange-800">
      {/* Background Image with Sunset Beach */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: 'url(/images/banner-sunset-beach.png)',
        }}
      >
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4 items-center">
          {/* Content */}
          <div className="text-white z-10 lg:pr-0">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-none mb-1 text-balance drop-shadow-lg">
              <span className="block">FRANGO</span>
              <span className="text-yellow-300">ABATIDO NA HORA</span>
            </h1>
            <p className="text-3xl md:text-4xl font-bold mb-1 text-white leading-none drop-shadow-md">
              MAIS FRESCO,
            </p>
            <p className="text-3xl md:text-4xl font-bold mb-1 text-white leading-none drop-shadow-md">
              MAIS SAUDÁVEL,
            </p>
            <p className="text-3xl md:text-4xl font-bold mb-4 text-yellow-300 leading-none drop-shadow-md">
              MAIS SABOROSO!
            </p>
            <p className="text-lg md:text-xl opacity-95 mb-8 max-w-md text-white drop-shadow-sm">
              Frango de qualidade, do jeito que sua família merece!
            </p>

            <a
              href="https://wa.me/5588996125274?text=Olá! Gostaria de fazer um pedido."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-orange-600 hover:bg-gray-100 px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              FAÇA SEU PEDIDO
              <Phone className="w-5 h-5" />
            </a>

            {/* Trust badges - bottom left */}
            <div className="flex flex-wrap gap-6 mt-12 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Abatido</p>
                  <p className="text-xs opacity-80">na Hora</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Entrega</p>
                  <p className="text-xs opacity-80">Rápida</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Qualidade</p>
                  <p className="text-xs opacity-80">Garantida</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Fresco e</p>
                  <p className="text-xs opacity-80">Saboroso</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image - Right side with chicken and badges OVER the image */}
          <div className="relative hidden lg:block -ml-20">
            {/* Product Image Container with badges positioned over it */}
            <div className="relative">
              <Image
                src="/ChatGPT Image 4 de mai. de 2026, 23_44_21.png"
                alt="Frango Fresco na Tábua"
                width={700}
                height={600}
                className="w-full h-auto object-contain drop-shadow-2xl scale-125"
                priority
              />

              {/* Product badges - positioned OVER the image on the right side - moved more to the left */}
              <div className="absolute right-12 top-16 z-30 space-y-3">
                <div className="bg-orange-900/60 backdrop-blur-md text-white px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-wide">100% FRESCO</p>
                    <p className="text-xs opacity-90">Abatido na hora</p>
                  </div>
                </div>
                <div className="bg-orange-900/60 backdrop-blur-md text-white px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-wide">SEM CONSERVANTES</p>
                    <p className="text-xs opacity-90">Natural e saudável</p>
                  </div>
                </div>
                <div className="bg-orange-900/60 backdrop-blur-md text-white px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-wide">ENTREGA RÁPIDA</p>
                    <p className="text-xs opacity-90">Em Canoa e região</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        <button className="w-3 h-3 rounded-full bg-orange-600" aria-label="Slide 1"></button>
        <button className="w-3 h-3 rounded-full bg-white/40 hover:bg-white/60" aria-label="Slide 2"></button>
        <button className="w-3 h-3 rounded-full bg-white/40 hover:bg-white/60" aria-label="Slide 3"></button>
      </div>
    </section>
  )
}
