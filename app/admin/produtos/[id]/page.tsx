'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trash2 } from 'lucide-react'
import ImageUpload from '@/components/admin/image-upload'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    original_price: '',
    unit: 'kg',
    category_id: null as string | null,
    is_active: true,
    is_featured: false,
    stock_quantity: '',
    min_order_quantity: '1',
    price_per_kg: '',
    image_url: '',
  })

  // Fetch product and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (productData) {
          setProduct(productData)
          setFormData({
            name: productData.name,
            slug: productData.slug,
            description: productData.description || '',
            short_description: productData.short_description || '',
            price: productData.price.toString(),
            original_price: productData.original_price?.toString() || '',
            unit: productData.unit,
            category_id: productData.category_id,
            is_active: productData.is_active,
            is_featured: productData.is_featured,
            stock_quantity: productData.stock_quantity.toString(),
            min_order_quantity: productData.min_order_quantity.toString(),
            price_per_kg: productData.price_per_kg?.toString() || '',
            image_url: productData.image_url || '',
          })
        }

        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
        if (categoriesData) setCategories(categoriesData)
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [productId])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, type } = e.target
    const value =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value

    if (name === 'slug') {
      setFormData((prev) => ({
        ...prev,
        [name]: (value as string).toLowerCase().replace(/\s+/g, '-'),
      }))
    } else if (name === 'price') {
      // Sincroniza preço por quilo se a unidade for kg
      setFormData((prev) => ({
        ...prev,
        price: value as string,
        price_per_kg: prev.unit === 'kg' ? value as string : prev.price_per_kg,
      }))
    } else if (name === 'price_per_kg') {
      // Sincroniza preço normal se a unidade for kg
      setFormData((prev) => ({
        ...prev,
        price_per_kg: value as string,
        price: prev.unit === 'kg' ? value as string : prev.price,
      }))
    } else if (name === 'unit') {
      // Se mudar para kg, sincroniza os preços
      setFormData((prev) => ({
        ...prev,
        unit: value as string,
        price_per_kg: (value === 'kg') ? prev.price : prev.price_per_kg,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleImageChange = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      image_url: imageUrl,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        short_description: formData.short_description || null,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        unit: formData.unit,
        image_url: formData.image_url || null,
        category_id: formData.category_id || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_order_quantity: parseInt(formData.min_order_quantity) || 1,
        price_per_kg: parseFloat(formData.price_per_kg) || 0,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)

      if (error) throw error

      router.push('/admin/produtos')
      router.refresh()
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Erro ao atualizar produto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId)
      if (error) throw error
      router.push('/admin/produtos')
      router.refresh()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Erro ao excluir produto')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (!product) {
    return <div className="text-center py-12">Produto não encontrado</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/produtos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar Produto</h1>
            <p className="text-muted-foreground mt-1">{product.name}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Excluir
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Produto</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug (URL)</label>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição Curta</label>
              <Input
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição Completa</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg bg-background"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Image */}
        <Card>
          <CardHeader>
            <CardTitle>Imagem do Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              bucket="product-images"
              onImageChange={handleImageChange}
              currentImage={formData.image_url}
            />
          </CardContent>
        </Card>

        {/* Pricing & Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Preço e Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Preço (R$)</label>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {formData.unit === 'kg' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Preço por Quilo (R$)</label>
                  <Input
                    name="price_per_kg"
                    type="number"
                    step="0.01"
                    value={formData.price_per_kg}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Preço Original (opcional)</label>
                <Input
                  name="original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantidade em Estoque</label>
                <Input
                  name="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Unidade</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="kg">kg</option>
                  <option value="un">Unidade</option>
                  <option value="L">Litro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantidade Mínima de Pedido</label>
              <Input
                name="min_order_quantity"
                type="number"
                value={formData.min_order_quantity}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category & Options */}
        <Card>
          <CardHeader>
            <CardTitle>Categoria e Opções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                name="category_id"
                value={formData.category_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">Destaque</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">Ativo</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/admin/produtos">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Salvando...' : 'Atualizar Produto'}
          </Button>
        </div>
      </form>
    </div>
  )
}
