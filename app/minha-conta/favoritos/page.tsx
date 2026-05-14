'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Trash2, ShoppingCart, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/contexts/cart-context'
import type { Product, Kit, CustomerFavorite } from '@/lib/types'
import { Spinner } from '@/components/ui/spinner'

interface FavoriteWithDetails extends CustomerFavorite {
  product: Product | null
  kit: Kit | null
}

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const supabase = createClient()

  const fetchFavorites = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('customer_favorites')
      .select(`
        *,
        product:products(*),
        kit:kits(*)
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    setFavorites(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  const removeFavorite = async (favoriteId: string) => {
    await supabase
      .from('customer_favorites')
      .delete()
      .eq('id', favoriteId)
    
    setFavorites(favorites.filter(f => f.id !== favoriteId))
  }

  const addToCart = (favorite: FavoriteWithDetails) => {
    if (favorite.product) {
      addItem({
        id: favorite.product.id,
        type: 'product',
        name: favorite.product.name,
        price: favorite.product.price,
        quantity: 1,
        unit: favorite.product.unit,
        image_url: favorite.product.image_url,
      })
    } else if (favorite.kit) {
      addItem({
        id: favorite.kit.id,
        type: 'kit',
        name: favorite.kit.name,
        price: favorite.kit.price,
        quantity: 1,
        unit: 'unidade',
        image_url: favorite.kit.image_url,
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Favoritos</h1>
        <p className="text-muted-foreground mt-1">Produtos e kits que você salvou</p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => {
            const item = favorite.product || favorite.kit
            if (!item) return null

            const isProduct = !!favorite.product
            const price = item.price
            const originalPrice = item.original_price

            return (
              <Card key={favorite.id} className="overflow-hidden card-hover">
                <div className="aspect-video relative bg-muted">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeFavorite(favorite.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {!isProduct && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Kit
                    </span>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      {originalPrice && originalPrice > price && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                          {formatCurrency(originalPrice)}
                        </span>
                      )}
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(price)}
                      </span>
                      {isProduct && (
                        <span className="text-sm text-muted-foreground">
                          /{(favorite.product as Product).unit}
                        </span>
                      )}
                    </div>
                    <Button size="sm" onClick={() => addToCart(favorite)}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum favorito ainda</h3>
            <p className="text-muted-foreground mb-4">
              Salve seus produtos e kits favoritos para encontrar mais facilmente.
            </p>
            <Button asChild>
              <Link href="/#cardapio">Ver Cardápio</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
