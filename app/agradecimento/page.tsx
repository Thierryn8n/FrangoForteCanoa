'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, Package, Truck, ArrowLeft, MessageCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  order_number?: number
  customer_name: string
  customer_phone?: string
  total: number
  status: string
  payment_method?: string
  payment_status?: string
  created_at: string
  estimated_delivery_minutes?: number
}

function AgradecimentoPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; color: string }> = {
      pending: { label: 'Aguardando Pagamento', icon: Clock, color: 'text-yellow-600' },
      confirmed: { label: 'Pagamento Confirmado', icon: CheckCircle, color: 'text-green-600' },
      printing: { label: 'Imprimindo', icon: Package, color: 'text-blue-600' },
      printed: { label: 'Pedido Impresso', icon: CheckCircle, color: 'text-purple-600' },
      preparing: { label: 'Preparando Pedido', icon: Package, color: 'text-orange-600' },
      ready: { label: 'Pronto para Entrega', icon: Package, color: 'text-green-600' },
      left_for_delivery: { label: 'Saiu para Entrega', icon: Truck, color: 'text-blue-600' },
      delivering: { label: 'Em Rota de Entrega', icon: Truck, color: 'text-blue-600' },
      delivered: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600' },
    }
    return statusMap[status] || { label: status, icon: Clock, color: 'text-gray-600' }
  }

  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }

    const fetchOrder = async () => {
      try {
        console.log('🔍 Buscando pedido:', orderId)
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (error) {
          console.error('❌ Erro ao buscar pedido:', error)
          return
        }

        console.log('✅ Pedido encontrado:', data)
        setOrder(data)
      } catch (error) {
        console.error('❌ Erro ao carregar pedido:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    // Setup realtime para atualizar quando o status mudar
    const channel = supabase
      .channel(`order-${orderId}-${Date.now()}`) // Adicionar timestamp para evitar cache
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔄 Pedido atualizado:', payload.new)
          setOrder(payload.new as Order)
          
          // Forçar refresh da UI
          setTimeout(() => {
            window.location.reload()
          }, 1000)
          
          // Se o status mudou para confirmado, mostrar notificação
          if (payload.new.status === 'confirmed' && payload.old?.status === 'pending') {
            console.log('🎉 Pagamento PIX confirmado!')
            // Poderia adicionar uma notificação toast aqui
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado para pedido:', orderId)
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('⚠️ Realtime desconectado, tentando reconectar...')
          // Tentar reconectar após 3 segundos
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, supabase, router])

  const handleRefresh = async () => {
    setUpdating(true)
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
      
      if (data) {
        setOrder(data)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleWhatsAppShare = () => {
    if (!order) return
    
    const statusInfo = getStatusInfo(order.status)
    const message = `Olá! Acabei de fazer um pedido no Frango Forte Canoa. 🐔\n\n` +
      `📋 Pedido: #${order.id.slice(-8)}${order.order_number ? `/${order.order_number}` : ''}\n` +
      `💰 Valor: ${formatPrice(order.total)}\n` +
      `📱 Telefone: ${order.customer_phone || 'N/A'}\n` +
      `📊 Status: ${statusInfo.label}\n\n` +
      `Gostaria de confirmar o status do meu pedido!`
    
    const whatsappUrl = `https://wa.me/558598888777?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações do pedido...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <Package className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Pedido não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível encontrar as informações deste pedido.
            </p>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para a Loja
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pedido Recebido!</h1>
          <p className="text-muted-foreground">
            Seu pedido foi recebido com sucesso. Acompanhe o status abaixo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Status do Pedido */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Status do Pedido
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={updating}
                >
                  <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status atual */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full bg-white ${statusInfo.color}`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">{statusInfo.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.payment_method === 'pix' && order.status === 'pending' 
                      ? 'Aguardando confirmação do pagamento PIX'
                      : 'Seu pedido está sendo processado'
                    }
                  </p>
                </div>
              </div>

              {/* Timeline Visual */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Acompanhe em Tempo Real
                </h3>
                <div className="relative">
                  {/* Linha do tempo */}
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'confirmed', label: '💳 Pagamento Confirmado', desc: 'Seu PIX foi aprovado!' },
                      { key: 'preparing', label: '👨‍🍳 Preparando', desc: 'Seu pedido está sendo preparado' },
                      { key: 'left_for_delivery', label: '🚚 Saindo para Entrega', desc: 'Pedido a caminho!' },
                      { key: 'delivered', label: '✅ Entregue', desc: 'Pedido entregue com sucesso!' }
                    ].map((step, index) => {
                      // Lógica correta: só está concluído se o status atual for posterior a essa etapa
                      const stepOrder = ['confirmed', 'preparing', 'left_for_delivery', 'delivered']
                      const currentStepIndex = stepOrder.indexOf(order.status)
                      const stepIndex = stepOrder.indexOf(step.key)
                      const isCompleted = currentStepIndex > -1 && currentStepIndex > stepIndex
                      const isCurrent = order.status === step.key
                      
                      return (
                        <div key={step.key} className="flex items-start gap-4 relative">
                          {/* Círculo do status */}
                          <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 transition-all duration-500 ${
                            isCompleted ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/50' : 
                            isCurrent ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/50 animate-pulse' : 
                            'border-gray-300 bg-gray-50'
                          }`}>
                            {isCompleted && (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )}
                            {isCurrent && !isCompleted && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                            )}
                            {!isCompleted && !isCurrent && (
                              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            )}
                          </div>
                          
                          {/* Conteúdo do status */}
                          <div className="flex-1 pb-4">
                            <div className={`rounded-lg p-4 transition-all duration-300 ${
                              isCompleted ? 'bg-green-50 border-2 border-green-300 shadow-md' : 
                              isCurrent ? 'bg-blue-50 border-2 border-blue-300 shadow-lg animate-pulse' : 
                              'bg-gray-100 border border-gray-300 opacity-75'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`font-bold text-lg ${
                                  isCompleted ? 'text-green-800' : 
                                  isCurrent ? 'text-blue-800' : 
                                  'text-gray-500'
                                }`}>{step.label}</span>
                                {isCurrent && (
                                  <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full animate-pulse font-bold">
                                    ► EM ANDAMENTO
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    CONCLUÍDO
                                  </span>
                                )}
                                {!isCompleted && !isCurrent && (
                                  <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded-full">
                                    AGUARDANDO
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${
                                isCompleted ? 'text-green-700 font-medium' : 
                                isCurrent ? 'text-blue-700 font-semibold' : 
                                'text-gray-500 italic'
                              }`}>
                                {step.desc}
                              </p>
                              {isCurrent && (
                                <div className="mt-3 flex items-center gap-2 bg-blue-100 rounded p-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-blue-700 font-medium">► Processando esta etapa...</span>
                                </div>
                              )}
                              {isCompleted && (
                                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Etapa concluída com sucesso
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Tempo estimado */}
              {order.estimated_delivery_minutes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Tempo estimado:</strong> {order.estimated_delivery_minutes} minutos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Pedido */}
          <div className="space-y-6">
            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Número</label>
                  <p className="font-semibold">#{order.id.slice(-8)}{order.order_number ? `/${order.order_number}` : ''}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cliente</label>
                  <p className="font-semibold">{order.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Total</label>
                  <p className="text-xl font-bold text-green-600">{formatPrice(order.total)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Pagamento</label>
                  <p className="text-sm">
                    {order.payment_method === 'pix' ? 'PIX' : 
                     order.payment_method === 'cash' ? 'Dinheiro' :
                     order.payment_method === 'credit' ? 'Crédito' :
                     order.payment_method === 'debit' ? 'Débito' :
                     order.payment_method || 'N/A'}
                    {' • '}
                    {order.payment_status === 'paid' ? 'Pago' : 
                     order.payment_status === 'pending' ? 'Pendente' :
                     order.payment_status || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={handleWhatsAppShare}
                  className="w-full"
                  variant="outline"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar pelo WhatsApp
                </Button>
                
                {order.status === 'pending' && order.payment_method === 'pix' && (
                  <Button
                    onClick={() => router.push(`/pix?order=${order.id}`)}
                    className="w-full"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Ver Pagamento PIX
                  </Button>
                )}
                
                <Link href="/">
                  <Button className="w-full" variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para a Loja
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgradecimentoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <AgradecimentoPageContent />
    </Suspense>
  )
}
