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
import type { Kit } from '@/lib/types'

export default function EditKitPage() {
  const router = useRouter()
  const params = useParams()
  const kitId = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [kit, setKit] = useState<Kit | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    original_price: '',
    contents: '',
    is_active: true,
    is_featured: false,
    image_url: '',
  })

  // Fetch kit
  useEffect(() => {
    const fetchKit = async () => {
      try {
        const { data } = await supabase
          .from('kits')
          .select('*')
          .eq('id', kitId)
          .single()

        if (data) {
          setKit(data)
          setFormData({
            name: data.name,
            slug: data.slug,
            description: data.description || '',
            price: data.price.toString(),
            original_price: data.original_price?.toString() || '',
            contents: data.contents || '',
            is_active: data.is_active,
            is_featured: data.is_featured,
            image_url: data.image_url || '',
          })
        }
      } catch (error) {
        console.error('Error fetching kit:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchKit()
  }, [kitId])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, type } = e.target
    const value =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value

    if (name === 'slug') {
      setFormData((prev) => ({
        ...prev,
        [name]: value.toLowerCase().replace(/\s+/g, '-'),
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
      const kitData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        contents: formData.contents || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('kits')
        .update(kitData)
        .eq('id', kitId)

      if (error) throw error

      router.push('/admin/kits')
      router.refresh()
    } catch (error) {
      console.error('Error updating kit:', error)
      alert('Erro ao atualizar kit')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este kit?')) return

    try {
      const { error } = await supabase.from('kits').delete().eq('id', kitId)
      if (error) throw error
      router.push('/admin/kits')
      router.refresh()
    } catch (error) {
      console.error('Error deleting kit:', error)
      alert('Erro ao excluir kit')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (!kit) {
    return <div className="text-center py-12">Kit não encontrado</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/kits">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar Kit</h1>
            <p className="text-muted-foreground mt-1">{kit.name}</p>
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
              <label className="block text-sm font-medium mb-2">Nome do Kit</label>
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
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg bg-background"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Conteúdo do Kit</label>
              <textarea
                name="contents"
                value={formData.contents}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg bg-background"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Image */}
        <Card>
          <CardHeader>
            <CardTitle>Imagem do Kit</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              bucket="kit-images"
              onImageChange={handleImageChange}
              currentImage={formData.image_url}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Preço</CardTitle>
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
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Opções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/admin/kits">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Salvando...' : 'Atualizar Kit'}
          </Button>
        </div>
      </form>
    </div>
  )
}
