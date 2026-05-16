import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Kit } from '@/lib/types'
import { DeleteKitButton } from '@/components/admin/delete-kit-button'

async function getKits(): Promise<Kit[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('kits')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching kits:', error)
    return []
  }
  return data || []
}

export default async function KitsPage() {
  const kits = await getKits()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const calculateDiscount = (price: number, originalPrice: number | null) => {
    if (!originalPrice || originalPrice <= price) return 0
    return Math.round((1 - price / originalPrice) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kits e Ofertas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os kits promocionais da sua loja
          </p>
        </div>
        <Link href="/admin/kits/novo">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Kit
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar kits..."
                className="pl-10"
              />
            </div>
            <select className="px-4 py-2 border rounded-lg bg-background">
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Kits Grid */}
      {kits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum kit cadastrado</p>
            <Link href="/admin/kits/novo">
              <Button>Cadastrar Primeiro Kit</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kits.map((kit) => {
            const discount = calculateDiscount(Number(kit.price), kit.original_price ? Number(kit.original_price) : null)
            
            return (
              <Card key={kit.id} className="overflow-hidden">
                {/* Kit Image */}
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
                  {kit.image_url ? (
                    <img
                      src={kit.image_url}
                      alt={kit.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <span className="absolute top-3 right-3 bg-destructive text-white text-sm font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      {discount}% OFF
                    </span>
                  )}
                  <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                    kit.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {kit.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Kit Info */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg">{kit.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {kit.contents}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/kits/${kit.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DeleteKitButton kitId={kit.id} />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(Number(kit.price))}
                    </span>
                    {kit.original_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(Number(kit.original_price))}
                      </span>
                    )}
                  </div>

                  {/* Featured Badge */}
                  {kit.is_featured && (
                    <span className="inline-block mt-3 px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                      Em Destaque
                    </span>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
