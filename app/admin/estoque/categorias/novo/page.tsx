'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewStockCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    unit_type: 'kg',
    description: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && { slug: value.toLowerCase().replace(/\s+/g, '-') })
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/stock/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Falha ao criar categoria')
      }

      router.push('/admin/estoque/categorias')
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Erro ao criar categoria')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/estoque/categorias">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Categoria de Estoque</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre uma nova categoria para controle de estoque
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Categoria</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Frango, Carne Suína, Ovos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug (URL)</label>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                placeholder="Ex: frango, carne-suina, ovos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Unidade</label>
              <select
                name="unit_type"
                value={formData.unit_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="kg">Quilograma (KG)</option>
                <option value="unidade">Unidade</option>
                <option value="caixa">Caixa</option>
                <option value="pacote">Pacote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-background"
                rows={3}
                placeholder="Descrição opcional da categoria"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/admin/estoque/categorias">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? 'Criando...' : 'Criar Categoria'}
          </Button>
        </div>
      </form>
    </div>
  )
}
