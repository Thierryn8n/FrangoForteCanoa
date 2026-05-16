'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewOperationalCostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cost_type: 'labor' as 'labor' | 'transport' | 'slaughter' | 'energy' | 'packaging' | 'other',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
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
      const response = await fetch('/api/stock/operational-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao registrar custo')
      }

      router.push('/admin/custos/operacionais')
    } catch (error) {
      console.error('Error creating operational cost:', error)
      alert('Erro ao registrar custo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/custos/operacionais">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Custo Operacional</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre um novo custo operacional da empresa
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Custo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Custo</label>
              <select
                name="cost_type"
                value={formData.cost_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="labor">Mão de Obra</option>
                <option value="transport">Transporte</option>
                <option value="slaughter">Abate</option>
                <option value="energy">Energia</option>
                <option value="packaging">Embalagem</option>
                <option value="other">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <Input
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Descrição detalhada do custo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Valor (R$)</label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <Input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Observações</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-background"
                rows={3}
                placeholder="Observações adicionais..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/admin/custos/operacionais">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? 'Registrando...' : 'Registrar Custo'}
          </Button>
        </div>
      </form>
    </div>
  )
}
