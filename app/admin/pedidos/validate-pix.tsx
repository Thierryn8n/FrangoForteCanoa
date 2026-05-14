'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Clock, QrCode, ArrowRight } from 'lucide-react'

interface PixTransaction {
  id: string
  order_id: string
  amount: number
  pix_key: string
  qr_code: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  created_at: string
  expires_at: string
  paid_at?: string
  orders?: {
    id: string
    order_number: number
    customer_name: string
    customer_phone: string
    total: number
    status: string
  }
}

interface ValidatePixButtonProps {
  transaction: PixTransaction
  onValidationSuccess?: () => void
}

export function ValidatePixButton({ transaction, onValidationSuccess }: ValidatePixButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const supabase = createClient()

  const handleValidatePix = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)
    try {
      // Atualizar status da transação PIX para 'paid'
      const { error: pixError } = await supabase
        .from('pix_transactions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (pixError) {
        console.error('Erro ao validar PIX:', pixError)
        return
      }

      // Atualizar status do pedido para 'confirmed'
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.order_id)

      if (orderError) {
        console.error('Erro ao atualizar pedido:', orderError)
        return
      }

      // Criar log de status
      const { error: logError } = await supabase
        .from('order_status_logs')
        .insert({
          order_id: transaction.order_id,
          old_status: 'pending',
          new_status: 'confirmed',
          notes: 'Pagamento PIX validado pelo administrador'
        })

      if (logError) {
        console.error('Erro ao criar log:', logError)
      }

      setShowConfirm(false)
      if (onValidationSuccess) {
        onValidationSuccess()
      }

    } catch (error) {
      console.error('Erro ao validar PIX:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const formatDateTime = (dateTime: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dateTime))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'paid': return <CheckCircle className="w-4 h-4" />
      case 'expired': return <AlertCircle className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando Pagamento'
      case 'paid': return 'Pago'
      case 'expired': return 'Expirado'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  if (transaction.status === 'paid') {
    return (
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(transaction.status)}>
          {getStatusIcon(transaction.status)}
          <span className="ml-1">{getStatusLabel(transaction.status)}</span>
        </Badge>
        <span className="text-sm text-green-600 font-medium">
          Validado em {transaction.paid_at ? formatDateTime(transaction.paid_at) : '-'}
        </span>
      </div>
    )
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="w-5 h-5 text-orange-600" />
          Validação PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da Transação */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Pedido:</span>
            <p className="font-semibold">#{transaction.orders?.order_number}</p>
          </div>
          <div>
            <span className="text-gray-600">Valor:</span>
            <p className="font-semibold text-orange-600">{formatPrice(transaction.amount)}</p>
          </div>
          <div>
            <span className="text-gray-600">Cliente:</span>
            <p className="font-semibold">{transaction.orders?.customer_name}</p>
          </div>
          <div>
            <span className="text-gray-600">Telefone:</span>
            <p className="font-semibold">{transaction.orders?.customer_phone}</p>
          </div>
        </div>

        {/* Status Atual */}
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(transaction.status)}>
            {getStatusIcon(transaction.status)}
            <span className="ml-1">{getStatusLabel(transaction.status)}</span>
          </Badge>
          <span className="text-sm text-gray-500">
            Criado em {formatDateTime(transaction.created_at)}
          </span>
        </div>

        {/* Chave PIX */}
        <div className="bg-white p-3 rounded border">
          <p className="text-sm text-gray-600 mb-1">Chave PIX:</p>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
            {transaction.pix_key}
          </code>
        </div>

        {/* Botão de Validação */}
        {!showConfirm ? (
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Validar Pagamento PIX
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ⚠️ Confirmar Validação
              </p>
              <p className="text-xs text-yellow-700">
                Você está prestes a validar o pagamento PIX de {formatPrice(transaction.amount)} 
                para o pedido #{transaction.orders?.order_number}.
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Confirme se você verificou o pagamento no aplicativo do banco.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleValidatePix}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Validando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmar Validação</span>
                  </div>
                )}
              </Button>
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Após validação, o pedido será automaticamente confirmado</p>
          <p>• O cliente receberá atualização do status em tempo real</p>
          <p>• O pedido entrará na fila de impressão e preparação</p>
        </div>
      </CardContent>
    </Card>
  )
}
