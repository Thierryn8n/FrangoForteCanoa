import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, MoreVertical, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Product } from '@/lib/types'
import { revalidatePath } from 'next/cache'

async function deleteProductAction(productId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    throw error
  }

  revalidatePath('/admin/produtos')
}

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  return data || []
}

export default async function ProductsPage() {
  const products = await getProducts()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os produtos da sua loja
          </p>
        </div>
        <Link href="/admin/produtos/novo">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10"
              />
            </div>
            <select className="px-4 py-2 border rounded-lg bg-background">
              <option value="">Todas as categorias</option>
              <option value="frango-inteiro">Frango Inteiro</option>
              <option value="cortes-nobres">Cortes Nobres</option>
              <option value="asas-coxinhas">Asas e Coxinhas</option>
              <option value="miudos">Miúdos</option>
            </select>
            <select className="px-4 py-2 border rounded-lg bg-background">
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products List - Responsive Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhum produto cadastrado</p>
              <Link href="/admin/produtos/novo">
                <Button>Cadastrar Primeiro Produto</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Product Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.short_description || product.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-primary">
                            {formatPrice(Number(product.price))}
                          </span>
                          {product.original_price && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(Number(product.original_price))}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">/ {product.unit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges & Actions */}
                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        {product.is_featured && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                            Destaque
                          </span>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/produtos/${product.id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <form action={deleteProductAction.bind(null, product.id)} onSubmit={(e) => {
                              if (!confirm('Tem certeza que deseja excluir este produto?')) {
                                e.preventDefault()
                              }
                            }}>
                              <button type="submit" className="w-full flex items-center text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </button>
                            </form>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
