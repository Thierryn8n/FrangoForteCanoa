'use server'

import { getKits, getStoreSettings } from '@/lib/actions/pdv'
import { createClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/store/hero-section'
import { KitsSection } from '@/components/store/kits-section'
import { ProductsSection } from '@/components/store/products-section'
import { FeaturesSection } from '@/components/store/features-section'
import { TestimonialsSection } from '@/components/store/testimonials-section'
import { NewsletterInstagram } from '@/components/store/newsletter-instagram'
import { SubheaderFeatures } from '@/components/store/subheader-features'
import type { Testimonial } from '@/lib/types'

async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(6)
  
  if (error) {
    console.error('Error fetching testimonials:', error)
    return []
  }
  return data || []
}

export default async function HomePage() {
  const supabase = await createClient()

  const [kits, settings, { data: productsData }, testimonials] = await Promise.all([
    getKits(true).catch(() => []),
    getStoreSettings().catch(() => null),
    supabase.from('products').select('*').eq('is_active', true).order('name'),
    getTestimonials().catch(() => []),
  ])

  const products = productsData || []
  const chickenProducts = products.filter(p => !p.slug?.includes('ovos') && !p.name.toLowerCase().includes('ovo'))
  const eggProducts = products.filter(p => p.slug?.includes('ovos') || p.name.toLowerCase().includes('ovo'))

  return (
    <main className="flex-1">
      <HeroSection />
      <SubheaderFeatures features={null} />
      
      {/* Seção de Frangos */}
      <ProductsSection 
        products={chickenProducts} 
        categoryName="NOSSOS FRANGOS"
        title="Frango Abatido na Hora"
        subtitle="Qualidade e frescor incomparáveis para sua mesa."
      />

      {/* Seção de Ovos */}
      <ProductsSection 
        products={eggProducts} 
        categoryName="OVOS FRESCOS"
        title="Ovos Caipiras e Selecionados"
        subtitle="O complemento perfeito e saudável para sua alimentação."
        viewAllHref="/produtos?categoria=ovos"
      />

      <KitsSection kits={kits} />
      <FeaturesSection />
      <TestimonialsSection testimonials={testimonials} />
      <NewsletterInstagram settings={settings} />
    </main>
  )
}
