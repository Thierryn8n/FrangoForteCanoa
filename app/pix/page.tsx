'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, ArrowLeft, CheckCircle, Clock, Copy } from 'lucide-react'
import Link from 'next/link'

function PixPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const [pixData, setPixData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const supabase = createClient()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }

    const fetchPixData = async () => {
      try {
        console.log('🔍 Buscando dados PIX para pedido:', orderId)
        
        const { data: pixTransaction, error } = await supabase
          .from('pix_transactions')
          .select('*')
          .eq('order_id', orderId)
          .single()

        if (error) {
          console.error('❌ Erro ao buscar transação PIX:', error)
          // Tentar buscar pelo pedido
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single()

          if (order) {
            // Gerar PIX novo
            const { data: storeSettings } = await supabase
              .from('store_settings')
              .select('pix_key, pix_enabled')
              .single()

            if (storeSettings?.pix_enabled) {
              const pixKey = storeSettings.pix_key || 'frangoforte@pix.com'
              const qrCodeData = `00020126580014br.gov.bcb.pix0136${pixKey}5204000053039865404${order.total.toFixed(2).replace('.', '')}5802BR5913FRANGO FORTE6009SAO PAULO62070503***6304C4B5`
              
              setPixData({
                order_id: order.id,
                amount: order.total,
                pix_key: pixKey,
                qr_code: qrCodeData,
                status: 'pending',
                created_at: new Date().toISOString()
              })
            }
          }
        } else {
          console.log('✅ Dados PIX encontrados:', pixTransaction)
          setPixData(pixTransaction)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados PIX:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPixData()
  }, [orderId, supabase, router])

  // Setup realtime para detectar quando o pedido for confirmado
  useEffect(() => {
    if (!orderId) return

    console.log('🔄 Iniciando realtime para pedido PIX:', orderId)

    const channel = supabase
      .channel(`pix-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔄 Pedido PIX atualizado:', payload.new)
          console.log('🔄 Status anterior:', payload.old?.status)
          console.log('🔄 Novo status:', payload.new.status)
          
          // Se o status mudou para confirmado (ou qualquer status após pending), iniciar countdown
          if (payload.new.status === 'confirmed' || payload.new.status === 'printing') {
            console.log('🎉 Pagamento PIX confirmado! Iniciando countdown...')
            
            // Iniciar countdown de 3 segundos
            setRedirectCountdown(3)
            
            const countdownInterval = setInterval(() => {
              setRedirectCountdown(prev => {
                if (prev === null || prev <= 1) {
                  clearInterval(countdownInterval)
                  // Redirecionar para página de agradecimento
                  router.push(`/agradecimento?order=${orderId}`)
                  return null
                }
                return prev - 1
              })
            }, 1000)
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do realtime:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, supabase, router])

  // Polling de fallback: verificar status do pedido a cada 5 segundos
  useEffect(() => {
    if (!orderId) return

    const checkOrderStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single()

        if (error) {
          console.error('❌ Erro ao verificar status:', error)
          return
        }

        console.log('🔍 Status atual do pedido:', data?.status)

        // Se o status mudou para confirmado ou printing, iniciar countdown
        if (data?.status === 'confirmed' || data?.status === 'printing') {
          console.log('🎉 Pagamento PIX confirmado (via polling)! Iniciando countdown...')
          
          // Iniciar countdown de 3 segundos
          setRedirectCountdown(3)
          
          const countdownInterval = setInterval(() => {
            setRedirectCountdown(prev => {
              if (prev === null || prev <= 1) {
                clearInterval(countdownInterval)
                // Redirecionar para página de agradecimento
                router.push(`/agradecimento?order=${orderId}`)
                return null
              }
              return prev - 1
            })
          }, 1000)
        }
      } catch (error) {
        console.error('❌ Erro no polling:', error)
      }
    }

    // Verificar imediatamente
    checkOrderStatus()

    // Verificar a cada 5 segundos
    const interval = setInterval(checkOrderStatus, 5000)

    return () => clearInterval(interval)
  }, [orderId, supabase, router])

  const handleCopyPixKey = async () => {
    if (pixData?.pix_key) {
      await navigator.clipboard.writeText(pixData.pix_key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWhatsAppShare = () => {
    if (!pixData) return
    
    const message = `Olá! Acabei de fazer um pedido no Frango Forte Canoa. 🐔\n\n` +
      `📋 Pedido: #${orderId?.slice(-8)}\n` +
      `💰 Valor: ${formatPrice(pixData.amount)}\n` +
      `📱 Chave PIX: ${pixData.pix_key}\n\n` +
      `Gostaria de confirmar o status do meu pedido!`
    
    const whatsappUrl = `https://wa.me/558598888777?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do pagamento...</p>
        </div>
      </div>
    )
  }

  if (!pixData) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <QrCode className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Pagamento não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível encontrar os dados do pagamento para este pedido.
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

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Loja
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">Pagamento PIX</h1>
          <p className="text-muted-foreground">
            Escaneie o QR Code ou copie a chave PIX para realizar o pagamento
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code para Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-purple-200 mb-4">
                {pixData.qr_code && (
                  <img 
                    src={pixData.qr_code.startsWith('data:') ? pixData.qr_code : `data:image/png;base64,${btoa(pixData.qr_code)}`}
                    alt="QR Code PIX"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p>Escaneie este QR Code com seu app de pagamento</p>
                <p>O pagamento será confirmado automaticamente</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Informações do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              {redirectCountdown !== null ? (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 animate-pulse">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {redirectCountdown}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Pagamento Confirmado!
                      </span>
                    </div>
                    <p className="text-xs text-green-700">
                      Redirecionando para acompanhamento...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Aguardando Pagamento
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    O pagamento será confirmado após aprovação
                  </p>
                </div>
              )}

              {/* Valor */}
              <div>
                <label className="text-sm font-medium text-gray-700">Valor do Pedido</label>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(pixData.amount)}
                </p>
              </div>

              {/* Chave PIX */}
              <div>
                <label className="text-sm font-medium text-gray-700">Chave PIX</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded border text-sm flex-1 select-all">
                    {pixData.pix_key}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyPixKey}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Pedido */}
              <div>
                <label className="text-sm font-medium text-gray-700">Número do Pedido</label>
                <p className="text-sm text-gray-600">
                  #{orderId?.slice(-8)}
                </p>
              </div>

              {/* Ações */}
              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleWhatsAppShare}
                  className="w-full"
                  variant="outline"
                >
                  📱 Compartilhar no WhatsApp
                </Button>
                
                <Button
                  onClick={() => router.push(`/agradecimento?order=${orderId}`)}
                  className="w-full"
                >
                  Acompanhar Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Como Pagar com PIX</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. Abra o aplicativo do seu banco</li>
              <li>2. Escolha a opção "Pagar com PIX"</li>
              <li>3. Escaneie o QR Code ou copie a chave PIX</li>
              <li>4. Confirme o pagamento</li>
              <li>5. Aguarde a confirmação automática</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PixPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <PixPageContent />
    </Suspense>
  )
}
