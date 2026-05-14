'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock, DollarSign, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface PendingPrice {
  id: string
  product_id: string
  product_name: string
  created_at: string
  status: 'pending' | 'resolved' | 'cancelled'
  notes?: string
}

export function PendingPricesPanel() {
  const [pendingPrices, setPendingPrices] = useState<PendingPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrice, setEditingPrice] = useState<{id: string; price: string} | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingPrices()
  }, [])

  const fetchPendingPrices = async () => {
    try {
      const response = await fetch('/api/pending-prices/list')
      if (response.ok) {
        const data = await response.json()
        setPendingPrices(data)
      }
    } catch (error) {
      console.error('Erro ao buscar preços pendentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetPrice = async (productId: string, price: string) => {
    if (!price || parseFloat(price) <= 0) {
      toast({
        title: 'Preço inválido',
        description: 'Digite um valor válido para o preço',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/products/set-price', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          price_per_kg: parseFloat(price)
        })
      })

      if (response.ok) {
        // Atualizar status da pendência
        await fetch('/api/pending-prices/resolve', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pending_price_id: editingPrice?.id
          })
        })

        toast({
          title: 'Preço definido!',
          description: 'Preço atualizado com sucesso'
        })

        setEditingPrice(null)
        fetchPendingPrices()
      } else {
        throw new Error('Erro ao definir preço')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível definir o preço',
        variant: 'destructive'
      })
    }
  }

  const handleCancelPending = async (pendingId: string) => {
    try {
      const response = await fetch('/api/pending-prices/cancel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pending_price_id: pendingId
        })
      })

      if (response.ok) {
        toast({
          title: 'Pendência cancelada',
          description: 'A pendência foi cancelada com sucesso'
        })
        fetchPendingPrices()
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a pendência',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Carregando preços pendentes...
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingCount = pendingPrices.filter(p => p.status === 'pending').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Preços Pendentes
          </CardTitle>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingCount} pendente(s)
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {pendingPrices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>Nenhum preço pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPrices.map((pending) => (
              <div
                key={pending.id}
                className={cn(
                  "border rounded-lg p-4 space-y-3",
                  pending.status === 'pending' && "border-yellow-200 bg-yellow-50",
                  pending.status === 'resolved' && "border-green-200 bg-green-50 opacity-60",
                  pending.status === 'cancelled' && "border-red-200 bg-red-50 opacity-60"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {pending.status === 'pending' && (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      {pending.status === 'resolved' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {pending.status === 'cancelled' && (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                      
                      <span className="font-medium">{pending.product_name}</span>
                      
                      <Badge variant={
                        pending.status === 'pending' ? 'destructive' :
                        pending.status === 'resolved' ? 'default' : 'secondary'
                      }>
                        {pending.status === 'pending' && 'Pendente'}
                        {pending.status === 'resolved' && 'Resolvido'}
                        {pending.status === 'cancelled' && 'Cancelado'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          Criado em {new Date(pending.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      {pending.notes && (
                        <p className="text-xs">{pending.notes}</p>
                      )}
                    </div>
                  </div>
                </div>

                {pending.status === 'pending' && (
                  <div className="flex gap-2">
                    {editingPrice?.id === pending.id ? (
                      <div className="flex gap-2 flex-1">
                        <div className="flex-1">
                          <Label htmlFor={`price-${pending.id}`} className="text-xs">
                            Preço por kg (R$)
                          </Label>
                          <Input
                            id={`price-${pending.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={editingPrice.price}
                            onChange={(e) => setEditingPrice({...editingPrice, price: e.target.value})}
                            className="text-sm"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSetPrice(pending.product_id, editingPrice.price)}
                          className="self-end"
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPrice(null)}
                          className="self-end"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setEditingPrice({id: pending.id, price: ''})}
                          className="flex-1"
                        >
                          Definir Preço
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelPending(pending.id)}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
