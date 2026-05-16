'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'

export default function NewFarmPricePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    product_category: 'frango',
    price_per_kg: '',
    previous_price: '',
    price_change_type: 'stable' as 'increase' | 'decrease' | 'stable',
    effective_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/stock/farm-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price_per_kg: parseFloat(formData.price_per_kg),
          previous_price: formData.previous_price ? parseFloat(formData.previous_price) : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao registrar preço')
      }

      router.push('/admin/custos/granja')
    } catch (error) {
      console.error('Error creating price record:', error)
      alert('Erro ao registrar preço')
    } finally {
      setLoading(false)
    }
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="w-4 h-4" />
      case 'decrease':
        return <TrendingDown className="w-4 h-4" />
      default:
        return <Minus className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/custos/granja">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registrar Preço da Granja</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre o preço atual do frango comprado da granja
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Preço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria do Produto</label>
              <select
                name="product_category"
                value={formData.product_category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="frango">Frango</option>
                <option value="carne-suina">Carne Suína</option>
                <option value="carne-bovina">Carne Bovina</option>
                <option value="ovos">Ovos</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Preço por KG (R$)</label>
                <Input
                  name="price_per_kg"
                  type="number"
                  step="0.01"
                  value={formData.price_per_kg}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preço Anterior (R$)</label>
                <Input
                  name="previous_price"
                  type="number"
                  step="0.01"
                  value={formData.previous_price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Variação</label>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-primary/5">
                  <input
                    type="radio"
                    name="price_change_type"
                    value="increase"
                    checked={formData.price_change_type === 'increase'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span>Aumento</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-primary/5">
                  <input
                    type="radio"
                    name="price_change_type"
                    value="decrease"
                    checked={formData.price_change_type === 'decrease'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    <span>Redução</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-primary/5">
                  <input
                    type="radio"
                    name="price_change_type"
                    value="stable"
                    checked={formData.price_change_type === 'stable'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    <Minus className="w-4 h-4 text-gray-500" />
                    <span>Estável</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data de Vigência</label>
              <Input
                name="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Observações</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-background"
                rows={3}
                placeholder="Observações sobre a mudança de preço..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/admin/custos/granja">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? 'Registrando...' : 'Registrar Preço'}
          </Button>
        </div>
      </form>
    </div>
  )
}
