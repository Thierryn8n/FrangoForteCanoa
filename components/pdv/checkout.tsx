'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PdvCartItem } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CheckoutProps {
  isOpen: boolean
  items: PdvCartItem[]
  onClose: () => void
  onFinalize: (data: any) => void
}

export function Checkout({ isOpen, items, onClose, onFinalize }: CheckoutProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [isDelivery, setIsDelivery] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'credit' | 'debit' | 'pix'>('money')
  const [moneyReceived, setMoneyReceived] = useState(0)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [pixKey, setPixKey] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPixPayment, setShowPixPayment] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const total = Math.max(0, subtotal - discount)
  const change = Math.max(0, moneyReceived - total)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)

  const generatePixQrCode = async (orderId: string, amount: number) => {
    try {
      // Gerar QR Code PIX (simulação - em produção usar API real)
      const pixKey = process.env.NEXT_PUBLIC_PIX_KEY || 'frangoforte@pix.com'
      const qrCodeData = `00020126580014br.gov.bcb.pix0136${pixKey}5204000053039865404${amount.toFixed(2).replace('.', '')}5802BR5913FRANGO FORTE6009SAO PAULO62070503***6304C4B5`
      
      // Salvar transação PIX no banco
      const { data: pixTransaction, error } = await supabase
        .from('pix_transactions')
        .insert({
          order_id: orderId,
          amount: amount,
          pix_key: pixKey,
          qr_code: qrCodeData,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
        })
        .select()
        .single()

      if (error) throw error

      setPixQrCode(qrCodeData)
      setPixKey(pixKey)
      return pixTransaction
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error)
      return null
    }
  }

  const handleFinalize = async () => {
    setIsProcessing(true)
    
    try {
      // Criar pedido para todos os métodos de pagamento
      const orderData = {
        customer_name: customerName || 'Cliente',
        customer_phone: customerPhone,
        customer_address: isDelivery ? customerAddress : null,
        order_type: isDelivery ? 'delivery' : 'pickup',
        discount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'pix' ? 'pending' : (isDelivery ? 'pending' : 'paid'),
        status: paymentMethod === 'pix' ? 'pending' : (isDelivery ? 'pending' : 'confirmed'),
        items,
        subtotal,
        total
      }

      onFinalize(orderData)
      
      // Se for PIX, gerar QR Code após criação do pedido
      if (paymentMethod === 'pix') {
        // Aguardar um momento para o pedido ser criado
        setTimeout(async () => {
          // Buscar o pedido recém-criado
          const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .eq('customer_name', customerName || 'Cliente')
            .eq('total', total)
            .order('created_at', { ascending: false })
            .limit(1)

          if (orders && orders.length > 0) {
            const newOrderId = orders[0].id
            setOrderId(newOrderId)
            
            // Gerar QR Code PIX
            await generatePixQrCode(newOrderId, total)
            setShowPixPayment(true)
          }
          setIsProcessing(false)
        }, 1000)
      } else {
        // Outros métodos de pagamento - checkout direto
        setIsProcessing(false)
        onClose() // Fechar modal após finalizar
        
        // Redirecionar para página de agradecimento
        if (typeof window !== 'undefined') {
          window.location.href = '/agradecimento'
        }
      }
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error)
      setIsProcessing(false)
    }
  }

  const handleWhatsAppShare = () => {
    if (!orderId) return
    
    const orderTypeText = isDelivery ? '🏠 Entrega em Domicílio' : '🏪 Retirar no Balcão'
    const addressText = isDelivery && customerAddress ? `\n📍 Endereço: ${customerAddress}` : ''
    
    const message = `Olá! Acabei de fazer um pedido no Frango Forte Canoa. 🐔\n\n` +
      `📋 Pedido: #${orderId.slice(-8)}\n` +
      `� Cliente: ${customerName || 'Não informado'}\n` +
      `📱 Telefone: ${customerPhone || 'Não informado'}\n` +
      `${orderTypeText}${addressText}\n` +
      `💰 Valor: ${formatPrice(total)}\n\n` +
      `Gostaria de confirmar o status do meu pedido!`
    
    const whatsappUrl = `https://wa.me/558598888777?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados do Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Cliente *</label>
            <Input
              placeholder="Nome completo"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone *</label>
            <Input
              placeholder="(00) 00000-0000"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Endereço</label>
            <Input
              placeholder="Rua, número, bairro, cidade..."
              value={customerAddress}
              onChange={e => setCustomerAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Pedido</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!isDelivery ? "default" : "outline"}
                onClick={() => setIsDelivery(false)}
                className="flex-1"
              >
                <div className="text-center">
                  <div className="font-medium">Balcão</div>
                  <div className="text-xs text-muted-foreground">Retirar no local</div>
                </div>
              </Button>
              <Button
                type="button"
                variant={isDelivery ? "default" : "outline"}
                onClick={() => setIsDelivery(true)}
                className="flex-1"
              >
                <div className="text-center">
                  <div className="font-medium">Entrega</div>
                  <div className="text-xs text-muted-foreground">Receber em casa</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Endereço de Entrega */}
          {isDelivery && (
            <div className="space-y-2 p-3 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 text-blue-800">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="font-medium">Endereço de Entrega</span>
              </div>
              <div className="p-2 bg-white rounded border">
                <p className="text-sm">
                  {customerAddress || 'Endereço não informado'}
                </p>
              </div>
            </div>
          )}

          {/* Desconto */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Desconto (R$)</label>
            <Input
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={e => setDiscount(Math.min(subtotal, parseFloat(e.target.value) || 0))}
            />
          </div>

          {/* Resumo */}
          <Card className="p-3 space-y-2 bg-gray-50">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto:</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatPrice(total)}</span>
            </div>
          </Card>

          {/* Formas de Pagamento */}
          <Tabs value={paymentMethod} onValueChange={val => setPaymentMethod(val as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="money">Dinheiro</TabsTrigger>
              <TabsTrigger value="credit">Crédito</TabsTrigger>
              <TabsTrigger value="debit">Débito</TabsTrigger>
              <TabsTrigger value="pix">PIX</TabsTrigger>
            </TabsList>

            {/* Dinheiro */}
            <TabsContent value="money" className="space-y-2">
              <label className="text-sm font-medium">Valor Recebido (R$)</label>
              <Input
                type="number"
                min="0"
                value={moneyReceived}
                onChange={e => setMoneyReceived(parseFloat(e.target.value) || 0)}
              />
              {moneyReceived >= total && (
                <div className="bg-green-50 p-2 rounded text-sm">
                  <div>Troco:</div>
                  <div className="font-bold text-green-600">
                    {formatPrice(change)}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Cartão */}
            <TabsContent value="credit" className="text-sm text-gray-600">
              <div className="p-2 bg-blue-50 rounded">
                Processando pagamento via máquina...
              </div>
            </TabsContent>

            <TabsContent value="debit" className="text-sm text-gray-600">
              <div className="p-2 bg-blue-50 rounded">
                Processando pagamento via máquina...
              </div>
            </TabsContent>

            {/* PIX */}
            <TabsContent value="pix" className="text-sm text-gray-600">
              {showPixPayment && pixQrCode ? (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto bg-white p-4 rounded-lg border-2 border-purple-200">
                      <img 
                        src={`data:image/png;base64,${btoa(pixQrCode)}`}
                        alt="QR Code PIX"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="font-medium text-purple-800">
                      Escaneie o QR Code com seu app de pagamento
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleFinalize}
                        disabled={isProcessing || !customerName.trim()}
                        className="flex-1"
                      >
                        {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
                      </Button>
                      
                      {paymentMethod === 'pix' && showPixPayment && (
                        <Button
                          variant="outline"
                          onClick={handleWhatsAppShare}
                          className="flex-1"
                        >
                          Compartilhar no WhatsApp
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-purple-600">
                      Chave PIX: {pixKey}
                    </p>
                    <p className="text-xs text-gray-500">
                      O pagamento será confirmado automaticamente após aprovação
                    </p>
                  </div>

                  <Button
                    onClick={() => router.push(`/agradecimento?order=${orderId}`)}
                    className="flex-1"
                  >
                    Acompanhar Pedido
                  </Button>
                </div>
              ) : (
                <div className="p-2 bg-purple-50 rounded">
                  QR Code PIX será gerado após finalizar
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={paymentMethod === 'money' && moneyReceived < total}
              className="flex-1"
            >
              Finalizar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
