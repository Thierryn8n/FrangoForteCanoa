'use server'

import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/store/header'
import { Footer } from '@/components/store/footer'
import { ProductsSection } from '@/components/store/products-section'
import { getStoreSettings } from '@/lib/actions/pdv'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; search?: string }>
}) {
  const params = await searchParams
  const category = params.categoria
  const search = params.search
  const supabase = await createClient()

  // Buscar configurações da loja
  const settings = await getStoreSettings().catch(() => null)

  // Buscar categorias para encontrar o ID da categoria solicitada
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
  
  const targetCategory = categories?.find(c => c.slug === category)

  // Buscar produtos filtrados ou todos
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (search) {
    // Aplicar filtro de busca
    query = query.ilike('name', `%${search}%`)
  } else if (targetCategory) {
    query = query.eq('category_id', targetCategory.id)
  } else if (category === 'ovos') {
    // Fallback caso o slug não bata exatamente, buscar por nome
    query = query.ilike('name', '%ovo%')
  }

  const { data: products, error } = await query

  const pageTitle = search 
    ? `Resultados para "${search}"`
    : targetCategory 
    ? targetCategory.name 
    : (category === 'ovos' ? 'Ovos Frescos' : 'Nossos Produtos')

  const pageSubtitle = search
    ? `Encontramos ${products?.length || 0} produto(s) para sua busca.`
    : targetCategory
    ? `Confira nossa seleção de ${targetCategory.name.toLowerCase()}.`
    : 'Os melhores produtos de Canoa Quebrada para sua mesa.'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Banner de Categoria */}
        <div className="bg-orange-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-extrabold mb-2">{pageTitle}</h1>
            <p className="text-orange-100 opacity-90">{pageSubtitle}</p>
          </div>
        </div>

        <ProductsSection 
          products={products || []} 
          title={pageTitle}
          subtitle={pageSubtitle}
          categoryName={category?.toUpperCase() || "PRODUTOS"}
        />
      </main>
      <Footer settings={settings} />
    </div>
  )
}
