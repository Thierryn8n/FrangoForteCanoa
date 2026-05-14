'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Mic, MicOff, Volume2, CheckCircle, AlertCircle, Lightbulb, User, Phone, MapPin, Package, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parseVoiceOrder, createProductFromVoice, createPendingPrice } from '@/lib/voice-processor'
import { PdvProduct } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface VoiceOrderInputProps {
  products: PdvProduct[]
  onOrderCreated: (orderData: any) => void
}

// Componente de ondas sonoras animadas
function SoundWaves({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-primary rounded-full transition-all duration-150",
            isActive ? "animate-pulse" : "h-2"
          )}
          style={{
            height: isActive ? `${Math.random() * 24 + 8}px` : '8px',
            animationDelay: `${i * 100}ms`,
            animation: isActive ? `soundWave 0.5s ease-in-out ${i * 100}ms infinite alternate` : 'none'
          }}
        />
      ))}
      <style jsx>{`
        @keyframes soundWave {
          0% { height: 8px; }
          100% { height: 32px; }
        }
      `}</style>
    </div>
  )
}

export function VoiceOrderInput({ products, onOrderCreated }: VoiceOrderInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [orderData, setOrderData] = useState<any>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [recognitionSupported, setRecognitionSupported] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setRecognitionSupported(false)
      return
    }

    recognitionRef.current = new SpeechRecognition()
    const recognition = recognitionRef.current

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'pt-BR'

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setOrderData(null)
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          // Não processa automaticamente, apenas acumula
          setTranscript(prev => prev + transcript + ' ')
        } else {
          interimTranscript = transcript
          setTranscript(interimTranscript)
        }
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        toast({
          title: 'Erro no reconhecimento',
          description: 'Não foi possível entender. Tente falar mais claro.',
          variant: 'destructive'
        })
      }
      // Não para de ouvir automaticamente em caso de erro
      // setIsListening(false)
    }

    recognition.onend = () => {
      // Não para de ouvir automaticamente
      // setIsListening(false)
      // Se ainda estiver ouvindo, reinicia automaticamente
      if (isListening) {
        try {
          recognitionRef.current.start()
        } catch (e) {
          console.error('Erro ao reiniciar reconhecimento:', e)
        }
      }
    }

    return () => {
      recognition.abort()
    }
  }, [toast])

  const processOrder = useCallback(async (text: string) => {
    setIsProcessing(true)
    
    try {
      const order = parseVoiceOrder(text)

      if (!order) {
        toast({
          title: 'Não entendi o pedido',
          description: 'Diga algo como: "Meu nome é João, telefone 11999999999, quero 1 quilo de coxa e 500 gramas de asa"',
          variant: 'destructive'
        })
        return
      }

      // Processar cada produto
      const processedProducts = []
      
      for (const productItem of order.products) {
        // Verificar se produto existe
        const existingProduct = products.find(p => 
          p.name.toLowerCase().includes(productItem.name.toLowerCase()) ||
          productItem.name.toLowerCase().includes(p.name.toLowerCase())
        )

        if (existingProduct) {
          processedProducts.push({
            ...existingProduct,
            quantity: productItem.quantity,
            isNew: false
          })
        } else {
          // Criar novo produto
          try {
            const newProduct = await createProductFromVoice(productItem.name)
            await createPendingPrice(newProduct.id, newProduct.name)
            
            processedProducts.push({
              ...newProduct,
              quantity: productItem.quantity,
              isNew: true
            })
            
            toast({
              title: '⚠️ Produto criado',
              description: `${newProduct.name} foi criado e está aguardando definição de preço`,
              variant: 'default'
            })
          } catch (error) {
            toast({
              title: 'Erro ao criar produto',
              description: `Não foi possível criar ${productItem.name}`,
              variant: 'destructive'
            })
            continue
          }
        }
      }

      // Criar objeto do pedido
      const completeOrder = {
        customer: order.customer,
        products: processedProducts,
        total: processedProducts.reduce((sum, p) => sum + (p.quantity * p.price_per_kg), 0),
        created_at: new Date().toISOString()
      }

      setOrderData(completeOrder)
      onOrderCreated(completeOrder)
      
      toast({
        title: '✅ Pedido criado!',
        description: `Pedido para ${order.customer.name} com ${processedProducts.length} produtos`,
      })

    } catch (error) {
      console.error('Erro ao processar pedido:', error)
      toast({
        title: 'Erro ao processar pedido',
        description: 'Tente novamente',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [products, onOrderCreated, toast])

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        toast({
          title: 'Erro',
          description: 'Não foi possível iniciar o microfone',
          variant: 'destructive'
        })
      }
    }
  }

  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleConfirmOrder = () => {
    if (transcript.trim()) {
      processOrder(transcript.trim())
    } else {
      toast({
        title: 'Nada para processar',
        description: 'Fale algo ou digite o pedido',
        variant: 'destructive'
      })
    }
  }

  if (!recognitionSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Seu navegador não suporta comandos de voz</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "transition-all duration-300",
      isListening && "ring-2 ring-primary ring-offset-2"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Pedido por Voz
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="text-muted-foreground"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Dicas
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Área principal do microfone */}
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300",
            isListening 
              ? "bg-primary/20 scale-110" 
              : "bg-muted hover:bg-muted/80"
          )}>
            {/* Ondas sonoras */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-full h-full rounded-full bg-primary/20 animate-ping" />
                <div className="absolute w-32 h-32 rounded-full bg-primary/10 animate-ping" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
            
            <Button
              onClick={isListening ? handleStopListening : handleStartListening}
              size="lg"
              disabled={isProcessing}
              className={cn(
                "relative w-16 h-16 rounded-full transition-all duration-300",
                isListening 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              {isProcessing ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </div>

          {/* Status e ondas */}
          <div className="text-center space-y-2">
            {isListening ? (
              <>
                <SoundWaves isActive={true} />
                <p className="text-sm font-medium text-primary animate-pulse">
                  Ouvindo... Fale os dados do cliente e produtos!
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Toque no microfone para criar pedido por voz
              </p>
            )}
          </div>

          {/* Botão de confirmação */}
          {transcript.trim() && !isListening && (
            <div className="w-full space-y-2">
              <Button
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="w-full gap-2"
              >
                <Send className="w-4 h-4" />
                Confirmar Pedido
              </Button>
            </div>
          )}
        </div>

        {/* Transcrição em tempo real */}
        {transcript && isListening && (
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground mb-1">Reconhecendo:</p>
            <p className="text-lg font-medium">&ldquo;{transcript}&rdquo;</p>
          </div>
        )}

        {/* Pedido processado */}
        {orderData && !isListening && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Pedido Criado!</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-green-700">
                  Cliente: {orderData.customer.name}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" />
                <span className="text-green-700">
                  Tel: {orderData.customer.phone}
                </span>
              </div>
              
              {orderData.customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">
                    Endereço: {orderData.customer.address}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                <span className="text-green-700">
                  {orderData.products.length} produtos
                </span>
              </div>
            </div>
            
            {orderData.products.some((p: any) => p.isNew) && (
              <div className="bg-yellow-100 border border-yellow-300 rounded p-2 text-xs">
                <span className="text-yellow-800">
                  ⚠️ {orderData.products.filter((p: any) => p.isNew).length} produto(s) aguardando definição de preço
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dicas de comandos */}
        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="font-medium text-blue-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Exemplos de comandos:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>&ldquo;Meu nome é João, telefone 11999999999, quero 1 quilo de coxa&rdquo;</li>
              <li>&ldquo;Cliente Maria, fone 11888888888, endereço rua das flores 123, quero 500 gramas de asa&rdquo;</li>
              <li>&ldquo;Nome Pedro, telefone 11777777777, quero 2 quilos de peito e meio quilo de sobrecoxa&rdquo;</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              Dica: Fale o nome, telefone (obrigatório) e depois os produtos desejados
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
