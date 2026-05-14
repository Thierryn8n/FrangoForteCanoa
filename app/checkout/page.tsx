'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/contexts/auth-context'
import QRCode from 'qrcode'
import { GoogleLoginPopup } from '@/components/google-login-popup'
import { useGoogleLogin } from '@/hooks/use-google-login'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { QrCode, CheckCircle, MapPin, User, Phone, Mail, ShoppingCart, Plus, Trash2, CreditCard, ArrowLeft, Truck, Store, Banknote, Minus } from 'lucide-react'
import Image from 'next/image'

export default function CheckoutPage() {
  const { cart, removeItem, updateQuantity, clearCart } = useCart()
  const { user, customer } = useAuth() // Obter usuário logado
  const { showPopup, setShowPopup, handleGoogleLogin } = useGoogleLogin()
  const router = useRouter()
  const supabase = createClient()
  
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [paymentMethod, setPaymentMethod] = useState<string>('pix')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    neighborhood: '',
    notes: '',
  })
  
  // Estados para PIX e pedidos
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [pixKey, setPixKey] = useState<string | null>(null)
  const [showPixDialog, setShowPixDialog] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  
  // Estados para dados do cliente
  const [customerData, setCustomerData] = useState<any | null>(null)
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null)
  const [loadingCustomer, setLoadingCustomer] = useState(false)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddressForm, setNewAddressForm] = useState({
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    label: '',
    is_default: false
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Buscar dados do cliente por telefone
  const searchCustomerByPhone = async (phone: string) => {
    if (!phone || phone.length < 10) return
    
    try {
      setLoadingCustomer(true)
      console.log('🔍 Buscando cliente por telefone:', phone)
      
      // Limpar telefone - remover caracteres especiais
      const cleanPhone = phone.replace(/\D/g, '')
      console.log('📱 Telefone limpo:', cleanPhone)
      
      // Buscar cliente na tabela clientes
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('phone', cleanPhone)
        .single()

      console.log('📊 Resultado busca cliente:', { cliente, error: clienteError })

      if (clienteError && clienteError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar cliente:', clienteError)
        return
      }

      if (cliente) {
        console.log('✅ Cliente encontrado:', cliente)
        setCustomerData(cliente)
        
        // Preencher formulário com dados do cliente
        setFormData(prev => {
          const updated = {
            ...prev,
            name: cliente.full_name || prev.name,
            phone: cliente.phone || prev.phone,
            address: cliente.address || prev.address,
            neighborhood: cliente.address_complement || prev.neighborhood,
          }
          console.log('📝 Formulário atualizado:', updated)
          return updated
        })
      } else {
        console.log('❌ Nenhum cliente encontrado com o telefone:', cleanPhone)
        clearCustomerData()
      }
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error)
    } finally {
      setLoadingCustomer(false)
    }
  }

  // Selecionar endereço
  const handleAddressSelect = (address: any) => {
    setSelectedAddress(address)
    setFormData(prev => ({
      ...prev,
      address: address.address || prev.address,
      neighborhood: address.neighborhood || prev.neighborhood,
    }))
  }

  // Limpar dados do cliente
  const clearCustomerData = () => {
    setCustomerData(null)
    setCustomerAddresses([])
    setSelectedAddress(null)
  }

  // Funções para formulário de novo endereço
  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setNewAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSaveNewAddress = async () => {
    if (!user || !customer) {
      console.error('❌ Usuário não está logado')
      return
    }

    if (!newAddressForm.address || !newAddressForm.neighborhood) {
      console.error('❌ Campos obrigatórios não preenchidos')
      return
    }

    try {
      console.log('💾 Salvando novo endereço:', newAddressForm)

      const { data: newAddress, error } = await supabase
        .from('customer_addresses')
        .insert({
          customer_id: customer.id,
          address: newAddressForm.address,
          neighborhood: newAddressForm.neighborhood,
          city: newAddressForm.city || '',
          state: newAddressForm.state || '',
          zip_code: newAddressForm.zip_code || '',
          label: newAddressForm.label || 'Endereço Principal',
          is_default: newAddressForm.is_default
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar endereço:', error)
        return
      }

      console.log('✅ Endereço salvo com sucesso:', newAddress)

      // Atualizar lista de endereços
      const updatedAddresses = [...customerAddresses, newAddress]
      setCustomerAddresses(updatedAddresses)

      // Se for o único endereço ou marcado como padrão, selecioná-lo
      if (updatedAddresses.length === 1 || newAddressForm.is_default) {
        setSelectedAddress(newAddress)
        setFormData(prev => ({
          ...prev,
          address: newAddress.address,
          neighborhood: newAddress.neighborhood,
        }))
      }

      // Limpar formulário
      setNewAddressForm({
        address: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        label: '',
        is_default: false
      })

      // Fechar formulário
      setShowNewAddressForm(false)

    } catch (error) {
      console.error('❌ Erro ao salvar novo endereço:', error)
    }
  }

  // Efeito para buscar dados do usuário logado quando a página carregar
  useEffect(() => {
    const fetchLoggedInUserData = async () => {
      if (user && customer) {
        console.log('👤 Usuário logado detectado, preenchendo dados automaticamente')
        console.log('📊 Dados do usuário:', customer)
        
        // Preencher formulário com dados do usuário logado
        setFormData(prev => ({
          ...prev,
          name: customer.full_name || prev.name,
          phone: customer.phone || prev.phone,
          email: customer.email || prev.email,
        }))
        
        // Buscar endereços do usuário logado
        try {
          const { data: addresses, error: addressesError } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('customer_id', customer.id)
            .order('is_default', { ascending: false })

          console.log('📊 Endereços do usuário logado:', { addresses, error: addressesError })

          if (addressesError) {
            console.error('❌ Erro ao buscar endereços do usuário logado:', addressesError)
          } else {
            console.log('✅ Endereços do usuário logado encontrados:', addresses)
            setCustomerAddresses(addresses || [])
            
            // Selecionar endereço padrão
            const defaultAddress = addresses?.find(addr => addr.is_default) || addresses?.[0]
            if (defaultAddress) {
              console.log('✅ Endereço padrão selecionado:', defaultAddress)
              setSelectedAddress(defaultAddress)
              // Auto-preencher formulário
              setFormData(prev => ({
                ...prev,
                address: defaultAddress.address || prev.address,
                neighborhood: defaultAddress.neighborhood || prev.neighborhood,
              }))
            }
          }
        } catch (error) {
          console.error('❌ Erro ao buscar endereços do usuário logado:', error)
        }
      }
    }

    fetchLoggedInUserData()
  }, [user, customer, supabase])

  // Efeito para buscar cliente quando telefone é preenchido
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.phone && formData.phone.length >= 10 && !user) {
        // Só buscar por telefone se não houver usuário logado
        searchCustomerByPhone(formData.phone)
      } else if (!formData.phone || formData.phone.length < 10) {
        clearCustomerData()
      }
    }, 800) // Reduzir debounce para 800ms para resposta mais rápida

    return () => clearTimeout(timer)
  }, [formData.phone, user])

  const generatePixQrCode = async (orderId: string, amount: number) => {
    try {
      console.log('🔍 Iniciando generatePixQrCode para pedido:', orderId, 'amount:', amount)
      
      // Obter chave PIX do store_settings
      const { data: storeSettings } = await supabase
        .from('store_settings')
        .select('pix_key, pix_enabled')
        .single()
      
      if (!storeSettings?.pix_enabled) {
        throw new Error('PIX não está habilitado')
      }
      
      const pixKey = storeSettings.pix_key || 'frangoforte@pix.com'
      const qrCodeData = `00020126580014br.gov.bcb.pix0136${pixKey}5204000053039865404${amount.toFixed(2).replace('.', '')}5802BR5913FRANGO FORTE6009SAO PAULO62070503***6304C4B5`
      
      console.log('🔍 Dados PIX gerados:', { pixKey, qrCodeData })
      
      // Gerar QR Code real usando biblioteca
      let qrCodeImage = null
      try {
        qrCodeImage = await QRCode.toDataURL(qrCodeData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        console.log('✅ QR Code gerado com sucesso:', qrCodeImage?.substring(0, 50) + '...')
      } catch (qrError) {
        console.error('❌ Erro ao gerar QR Code:', qrError)
        qrCodeImage = null
      }
      
      // Salvar transação PIX no banco
      const { data: pixTransaction, error } = await supabase
        .from('pix_transactions')
        .insert({
          order_id: orderId,
          amount: amount,
          pix_key: pixKey,
          qr_code: qrCodeImage,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar transação PIX:', error)
        throw error
      }

      console.log('✅ Transação PIX salva:', pixTransaction)
      
      // Setar estados com o QR Code gerado
      setPixQrCode(qrCodeImage)
      setPixKey(pixKey)
      
      // Verificar se os estados foram atualizados (setTimeout para garantir que o estado foi atualizado)
      setTimeout(() => {
        console.log('🔍 Estados após setPixQrCode (timeout):', { pixQrCode: qrCodeImage, pixKey })
      }, 100)
      return pixTransaction
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error)
      return null
    }
  }

  const createOrder = async () => {
    try {
      setIsProcessing(true)
      
      // Primeiro criar o pedido
      const orderData = {
        user_id: user?.id || null,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email || null,
        delivery_address: deliveryType === 'delivery' ? formData.address : null,
        notes: formData.notes || null,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'pix' ? 'pending' : 'paid',
        status: paymentMethod === 'pix' ? 'pending' : 'confirmed',
        subtotal: cart.subtotal,
        delivery_fee: deliveryType === 'delivery' ? cart.deliveryFee : 0,
        total: deliveryType === 'delivery' ? cart.total : cart.subtotal,
      }

      console.log('📦 Criando pedido com dados:', orderData)

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.error('❌ Erro ao criar pedido:', orderError)
        throw orderError
      }

      console.log('✅ Pedido criado:', order)

      // Criar print job para impressao automatica
      try {
        const { error: printJobError } = await supabase.rpc('create_print_job', {
          p_order_id: order.id,
          p_text_content: '',
          p_printer_name: null,
          p_agent_id: 'PRINT-AGENT-01'
        })
        if (printJobError) {
          console.error('⚠️ Erro ao criar print job:', printJobError)
        } else {
          console.log('🖨️ Print job criado para o pedido', order.id)
        }
      } catch (e) {
        console.error('⚠️ Erro ao criar print job:', e)
      }

      // Depois criar os itens do pedido (tentar com product_id, fallback para null)
      for (const item of cart.items) {
        const orderItem = {
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          product_price: item.price,
          quantity: item.quantity,
          unit: item.unit || 'un',
          subtotal: item.price * item.quantity
        }

        console.log('📦 Criando item do pedido:', orderItem)

        const { error: itemError } = await supabase
          .from('order_items')
          .insert(orderItem)

        if (itemError && itemError.code === '23503') {
          // FK violation: produto nao existe, tentar com product_id null
          console.log('⚠️ Produto nao encontrado, inserindo sem product_id:', item.id)
          const { error: itemError2 } = await supabase
            .from('order_items')
            .insert({ ...orderItem, product_id: null })
          if (itemError2) {
            console.error('❌ Erro ao criar item sem product_id:', itemError2)
            throw itemError2
          }
        } else if (itemError) {
          console.error('❌ Erro ao criar item do pedido:', itemError)
          throw itemError
        }
      }

      console.log('✅ Itens do pedido criados com sucesso')

      setOrderId(order.id)
      
      if (paymentMethod === 'pix') {
        console.log('🔍 Iniciando geração PIX para pedido:', order.id)
        const pixResult = await generatePixQrCode(order.id, order.total)
        console.log('🔍 Resultado generatePixQrCode:', { pixResult, pixQrCode, pixKey })
        
        // REDIRECIONAR PARA PÁGINA DEDICADA DO PIX
        router.push(`/pix?order=${order.id}`)
      } else {
        // Para outros pagamentos, redirecionar para agradecimento
        console.log('🔍 Redirecionando para agradecimento (não PIX):', order.id)
        router.push(`/agradecimento?order=${order.id}`)
      }
      
      setOrderCreated(true)
      clearCart()
      
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      alert('Erro ao processar pedido. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWhatsAppShare = () => {
    if (!orderId) return
    
    const message = `Olá! Acabei de fazer um pedido no Frango Forte Canoa. 🐔\n\n` +
      `📋 Pedido: #${orderId.slice(-8)}\n` +
      `💰 Valor: ${formatPrice(deliveryType === 'delivery' ? cart.total : cart.subtotal)}\n` +
      `📱 Telefone: ${formData.phone}\n\n` +
      `Gostaria de confirmar o status do meu pedido!`
    
    const whatsappUrl = `https://wa.me/558598888777?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const generateWhatsAppMessage = () => {
    let message = `*NOVO PEDIDO - Frango Forte Canoa*\n\n`
    message += `*Cliente:* ${formData.name}\n`
    message += `*Telefone:* ${formData.phone}\n`
    if (formData.email) message += `*Email:* ${formData.email}\n`
    message += `\n*Tipo:* ${deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}\n`
    if (deliveryType === 'delivery') {
      message += `*Endereço:* ${formData.address}\n`
      message += `*Bairro:* ${formData.neighborhood}\n`
    }
    if (formData.notes) message += `*Observações:* ${formData.notes}\n`
    message += `\n*Forma de Pagamento:* ${
      paymentMethod === 'pix' ? 'PIX' :
      paymentMethod === 'cash' ? 'Dinheiro' :
      paymentMethod === 'card' ? 'Cartão' : 'Transferência'
    }\n`
    message += `\n*ITENS DO PEDIDO:*\n`
    cart.items.forEach((item) => {
      message += `- ${item.quantity}x ${item.name} (${formatPrice(item.price * item.quantity)})\n`
    })
    message += `\n*Subtotal:* ${formatPrice(cart.subtotal)}`
    if (deliveryType === 'delivery') {
      message += `\n*Taxa de entrega:* ${formatPrice(cart.deliveryFee)}`
    }
    message += `\n*TOTAL:* ${formatPrice(deliveryType === 'delivery' ? cart.total : cart.subtotal)}`
    
    return encodeURIComponent(message)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.name || !formData.phone) {
      alert('Por favor, preencha seu nome e telefone.')
      return
    }
    
    if (deliveryType === 'delivery' && (!formData.address || !formData.neighborhood)) {
      alert('Por favor, preencha o endereço completo para entrega.')
      return
    }
    
    createOrder()
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h2>
        <p className="text-muted-foreground mb-6">Adicione produtos para continuar com o pedido.</p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a Loja
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Popup de Login Google */}
      <GoogleLoginPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        onSuccess={(userData) => {
          console.log('Usuário logado com Google:', userData)
          // Recarregar página para atualizar estado do usuário
          window.location.reload()
        }}
      />

      <div className="min-h-screen bg-muted py-8">
        <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Loja
        </Link>

        <h1 className="text-3xl font-bold mb-8">Finalizar Pedido</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Seus Dados
                </h2>
                
                {/* Indicador de busca */}
                {loadingCustomer && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mb-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Buscando seus dados...
                  </div>
                )}

                {/* Cliente encontrado */}
                {customerData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Cliente encontrado: {customerData.full_name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearCustomerData}
                        className="text-green-600 hover:text-green-700"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2">
                      Nome Completo *
                      {user && (
                        <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                          Logado
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Seu nome"
                      required
                      disabled={!!user}
                      className={(customerData || user) ? 'bg-green-50 border-green-200' : ''}
                    />
                    {(customerData || user) && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Dados preenchidos automaticamente {user ? '(usuário logado)' : ''}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      WhatsApp *
                      {user && (
                        <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                          Cadastrado
                        </Badge>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(88) 99999-9999"
                        required
                        disabled={!!user || loadingCustomer}
                        className={`pr-10 ${
                          (customerData || user) ? 'bg-green-50 border-green-200' : 
                          loadingCustomer ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      />
                      {loadingCustomer && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {(customerData || user) && !loadingCustomer && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    {loadingCustomer && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <div className="w-2 h-2 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Buscando seus dados...
                      </p>
                    )}
                    {(customerData || user) && !loadingCustomer && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {user ? 'Telefone do seu cadastro' : 'Cliente cadastrado encontrado! Dados preenchidos automaticamente.'}
                      </p>
                    )}
                    {formData.phone && formData.phone.length >= 10 && !customerData && !loadingCustomer && !user && (
                      <p className="text-xs text-gray-500 mt-1">
                        Novo cliente ou telefone não cadastrado
                      </p>
                    )}
                    {user && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Como você está logado, usamos os dados do seu cadastro
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">E-mail (opcional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                      className={customerData ? 'bg-green-50 border-green-200' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Type */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Tipo de Entrega
                </h2>
                <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as 'delivery' | 'pickup')}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label
                      htmlFor="delivery"
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        deliveryType === 'delivery' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Truck className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-semibold">Entrega</p>
                        <p className="text-sm text-muted-foreground">Taxa: {formatPrice(cart.deliveryFee)}</p>
                      </div>
                    </label>
                    <label
                      htmlFor="pickup"
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        deliveryType === 'pickup' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Store className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-semibold">Retirar no Local</p>
                        <p className="text-sm text-muted-foreground">Grátis</p>
                      </div>
                    </label>
                  </div>
                </RadioGroup>

                {deliveryType === 'delivery' && (
                  <div className="mt-4 space-y-4">
                    {/* Seleção de Endereços */}
                    {customerAddresses.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Seus Endereços Cadastrados
                          <Badge variant="outline" className="text-xs">
                            {customerAddresses.length} endereço{customerAddresses.length > 1 ? 's' : ''}
                          </Badge>
                          {user && (
                            <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                              Logado
                            </Badge>
                          )}
                        </Label>
                        <div className="space-y-3 mb-4">
                          {customerAddresses.map((address) => (
                            <div
                              key={address.id}
                              className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                                selectedAddress?.id === address.id
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                              }`}
                              onClick={() => handleAddressSelect(address)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      selectedAddress?.id === address.id
                                        ? 'border-primary bg-primary'
                                        : 'border-gray-300'
                                    }`}>
                                      {selectedAddress?.id === address.id && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      )}
                                    </div>
                                    <span className="font-medium text-sm">
                                      {address.label || 'Endereço Principal'}
                                    </span>
                                    {address.is_default && (
                                      <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                                        Padrão
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="ml-7 space-y-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {address.address}
                                      {address.address_number && `, ${address.address_number}`}
                                      {address.address_complement && ` - ${address.address_complement}`}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {address.neighborhood}
                                      {address.city && `, ${address.city}`}
                                      {address.state && ` - ${address.state}`}
                                    </p>
                                    {address.zip_code && (
                                      <p className="text-xs text-gray-500">CEP: {address.zip_code}</p>
                                    )}
                                  </div>
                                </div>
                                {selectedAddress?.id === address.id && (
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Botão para adicionar novo endereço */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Novo Endereço
                        </Button>
                      </div>
                    )}
                    
                    {/* Formulário de Endereço */}
                    <div className={`border-t pt-4 ${customerAddresses.length > 0 ? 'border-gray-200' : ''}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <Label className="text-sm font-medium text-gray-700">
                          {customerAddresses.length > 0 ? 'Ou digite um novo endereço:' : 'Endereço para Entrega'}
                        </Label>
                        {customerAddresses.length === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Novo cliente
                          </Badge>
                        )}
                        {customerAddresses.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {showNewAddressForm ? 'Cadastrando novo endereço' : 'Opcional'}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Mostrar formulário sempre se não há endereços, ou se usuário clicou em "Adicionar Novo" */}
                      {(customerAddresses.length === 0 || showNewAddressForm) && (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="newAddress">Endereço Completo *</Label>
                            <Input
                              id="newAddress"
                              name="newAddress"
                              value={newAddressForm.address}
                              onChange={handleNewAddressChange}
                              placeholder="Rua, Número, Complemento"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="newNeighborhood">Bairro *</Label>
                            <Input
                              id="newNeighborhood"
                              name="newNeighborhood"
                              value={newAddressForm.neighborhood}
                              onChange={handleNewAddressChange}
                              placeholder="Seu bairro"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="newCity">Cidade</Label>
                            <Input
                              id="newCity"
                              name="newCity"
                              value={newAddressForm.city}
                              onChange={handleNewAddressChange}
                              placeholder="Sua cidade"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newState">Estado</Label>
                            <Input
                              id="newState"
                              name="newState"
                              value={newAddressForm.state}
                              onChange={handleNewAddressChange}
                              placeholder="Seu estado"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newZipCode">CEP</Label>
                            <Input
                              id="newZipCode"
                              name="newZipCode"
                              value={newAddressForm.zip_code}
                              onChange={handleNewAddressChange}
                              placeholder="Seu CEP"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newAddressLabel">Apelido do Endereço</Label>
                            <Input
                              id="newAddressLabel"
                              name="newAddressLabel"
                              value={newAddressForm.label}
                              onChange={handleNewAddressChange}
                              placeholder="Ex: Casa, Trabalho, etc."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="newAddressDefault"
                              name="is_default"
                              checked={newAddressForm.is_default}
                              onChange={handleNewAddressChange}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="newAddressDefault" className="text-sm">
                              Definir como endereço padrão
                            </Label>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handleSaveNewAddress}
                              className="bg-primary text-primary-foreground"
                            >
                              Salvar Endereço
                            </Button>
                            {customerAddresses.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowNewAddressForm(false)}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Formulário original (só para quando há endereços e não está cadastrando novo) */}
                      {customerAddresses.length > 0 && !showNewAddressForm && (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="address">Endereço Completo *</Label>
                            <Input
                              id="address"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              placeholder="Rua, Número, Complemento"
                              required
                              className={selectedAddress ? 'bg-green-50 border-green-200' : ''}
                            />
                            {selectedAddress && (
                              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Endereço selecionado automaticamente
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="neighborhood">Bairro *</Label>
                            <Input
                              id="neighborhood"
                              name="neighborhood"
                              value={formData.neighborhood}
                              onChange={handleInputChange}
                              placeholder="Seu bairro"
                              required
                              className={selectedAddress ? 'bg-green-50 border-green-200' : ''}
                            />
                            {selectedAddress && (
                              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Bairro selecionado automaticamente
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {customerAddresses.length === 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                          <p className="text-xs text-blue-700 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Dica: Se você já comprou conosco antes, seus dados serão preenchidos automaticamente ao digitar seu WhatsApp.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Forma de Pagamento
                </h2>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label
                      htmlFor="pix"
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="pix" id="pix" className="sr-only" />
                      <QrCode className="w-8 h-8 text-primary" />
                      <span className="font-medium text-sm">PIX</span>
                    </label>
                    <label
                      htmlFor="cash"
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="cash" id="cash" className="sr-only" />
                      <Banknote className="w-8 h-8 text-primary" />
                      <span className="font-medium text-sm">Dinheiro</span>
                    </label>
                    <label
                      htmlFor="card"
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="card" id="card" className="sr-only" />
                      <CreditCard className="w-8 h-8 text-primary" />
                      <span className="font-medium text-sm">Cartão</span>
                    </label>
                    <label
                      htmlFor="transfer"
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        paymentMethod === 'transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="transfer" id="transfer" className="sr-only" />
                      <MapPin className="w-8 h-8 text-primary" />
                      <span className="font-medium text-sm">Transf.</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Notes */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Observações</h2>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Alguma observação sobre o pedido? (ex: troco para R$ 100)"
                  rows={3}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
                
                {/* Items */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Image
                              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20do%20app.png-Ho5MoqTQrqD4OngvJYNIAWKpTi6NnD.jpeg"
                              alt={item.name}
                              width={40}
                              height={40}
                              className="opacity-30"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(item.price)}/{item.unit}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-destructive ml-auto"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  {deliveryType === 'delivery' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de entrega</span>
                      <span>{formatPrice(cart.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatPrice(deliveryType === 'delivery' ? cart.total : cart.subtotal)}
                    </span>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="mt-6 space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6"
                    disabled={isProcessing || orderCreated}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : paymentMethod === 'pix' ? (
                      <>
                        <QrCode className="w-5 h-5 mr-2" />
                        Gerar QR Code PIX
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Finalizar Pedido
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-green-500 text-green-600 hover:bg-green-50 font-semibold py-6"
                    onClick={() => {
                      const whatsappUrl = `https://wa.me/5588996125274?text=${generateWhatsAppMessage()}`
                      window.open(whatsappUrl, '_blank')
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Também no WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Diálogo PIX QR Code */}
      <Dialog open={showPixDialog} onOpenChange={setShowPixDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Pagamento PIX
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Debug: PIX Dialog */}
            {console.log('🔍 RENDERIZANDO DIÁLOGO PIX:', { showPixDialog, pixQrCode, pixKey })}
            
            {/* Sempre mostrar informações do PIX mesmo que o QR Code não tenha sido gerado ainda */}
            <div className="text-center space-y-4">
              {/* FORÇAR RENDERIZAÇÃO */}
              {showPixDialog && (
                <>
                  <p className="text-red-500 font-bold">🔥 DIÁLOGO PIX ESTÁ ATIVO! 🔥</p>
                  <p className="text-sm">showPixDialog: {String(showPixDialog)}</p>
                  <p className="text-sm">pixQrCode: {pixQrCode || 'NULL'}</p>
                  <p className="text-sm">pixKey: {pixKey || 'NULL'}</p>
                </>
              )}
              {pixQrCode ? (
                <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-purple-200">
                  <img 
                    src={pixQrCode}
                    alt="QR Code PIX"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Gerando QR Code...</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="font-medium text-purple-800">
                  {pixQrCode ? 'Escaneie o QR Code com seu app de pagamento' : 'Seu QR Code está sendo gerado...'}
                </p>
                <p className="text-sm text-purple-600">
                  Chave PIX: {pixKey || 'Carregando...'}
                </p>
                <p className="text-xs text-gray-500">
                  Valor: {formatPrice(deliveryType === 'delivery' ? cart.total : cart.subtotal)}
                </p>
                <p className="text-xs text-gray-500">
                  {pixQrCode ? 'O pagamento será confirmado automaticamente após aprovação' : 'Aguarde a geração do QR Code...'}
                </p>
                {pixKey && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-sm font-medium text-blue-800 mb-2">Ou copie a chave PIX:</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-3 py-2 rounded border text-sm flex-1 select-all">
                        {pixKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(pixKey)
                          alert('Chave PIX copiada com sucesso!')
                        }}
                      >
                        📋 Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleWhatsAppShare}
                  className="flex-1"
                >
                  📱 Compartilhar no WhatsApp
                </Button>
                <Button
                  onClick={() => router.push(`/agradecimento?order=${orderId}`)}
                  className="flex-1"
                >
                  Acompanhar Pedido
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}
