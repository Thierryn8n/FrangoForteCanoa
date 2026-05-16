import { createClient } from '@/lib/supabase/server'
import { Plus, Package, Scale, Box, Package2, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { DeleteCategoryButton } from '@/components/admin/delete-stock-category-button'

export default async function StockCategoriesPage() {
  const supabase = await createClient()
  
  const { data: categories } = await supabase
    .from('stock_categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const getUnitIcon = (unitType: string) => {
    switch (unitType) {
      case 'kg':
        return <Scale className="w-5 h-5" />
      case 'unidade':
        return <Package className="w-5 h-5" />
      case 'caixa':
        return <Box className="w-5 h-5" />
      case 'pacote':
        return <Package2 className="w-5 h-5" />
      default:
        return <Package className="w-5 h-5" />
    }
  }

  const getUnitLabel = (unitType: string) => {
    switch (unitType) {
      case 'kg':
        return 'Quilograma (KG)'
      case 'unidade':
        return 'Unidade'
      case 'caixa':
        return 'Caixa'
      case 'pacote':
        return 'Pacote'
      default:
        return unitType
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categorias de Estoque</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as categorias de produtos para controle de estoque
          </p>
        </div>
        <Link href="/admin/estoque/categorias/novo">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        </Link>
      </div>

      {/* Categories Grid */}
      {categories && categories.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: any) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {getUnitIcon(category.unit_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{category.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/estoque/categorias/${category.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <DeleteCategoryButton categoryId={category.id} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipo de Unidade</span>
                    <span className="font-medium">{getUnitLabel(category.unit_type)}</span>
                  </div>
                  {category.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma categoria cadastrada</p>
            <Link href="/admin/estoque/categorias/novo">
              <Button>Cadastrar Primeira Categoria</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
