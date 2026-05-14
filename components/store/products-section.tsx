'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from './product-card'
import { ProductDrawer } from './product-drawer'
import type { Product } from '@/lib/types'

interface ProductsSectionProps {
  products: Product[]
  title?: string
  subtitle?: string
  categoryName?: string
  viewAllHref?: string
}

export function ProductsSection({ 
  products, 
  title = "Escolha o melhor para sua família",
  subtitle = "Produtos frescos e de qualidade entregues com segurança.",
  categoryName = "NOSSOS PRODUTOS",
  viewAllHref = "/produtos"
}: ProductsSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const featuredProducts = products.filter(p => p.is_active).slice(0, 5)

  if (featuredProducts.length === 0) return null

  const handleOpenDrawer = (product: Product) => {
    setSelectedProduct(product)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedProduct(null)
  }

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div className="flex-1">
            <span className="text-primary font-semibold text-sm tracking-wider uppercase">
              {categoryName}
            </span>
            <div className="flex flex-col md:flex-row md:items-baseline md:gap-4 mt-2">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {title}
              </h2>
              <p className="text-muted-foreground mt-2 md:mt-0">
                {subtitle}
              </p>
            </div>
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onOpenDrawer={handleOpenDrawer}
            />
          ))}
        </div>
      </div>

      {/* ProductDrawer renderizado fora do grid */}
      {selectedProduct && (
        <ProductDrawer
          product={selectedProduct}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
        />
      )}
    </section>
  )
}
