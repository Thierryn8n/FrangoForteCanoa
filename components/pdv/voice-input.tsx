'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Mic, MicOff, Volume2, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parseVoiceCommand, findClosestProduct, getSimilarProducts } from '@/lib/voice-processor'
import { PdvProduct } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface VoiceInputProps {
  products: PdvProduct[]
  onAddItem: (product: PdvProduct, weight: number) => void
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

export function VoiceInput({ products, onAddItem }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<{product: PdvProduct; quantity: number} | null>(null)
  const [suggestions, setSuggestions] = useState<PdvProduct[]>([])
  const [showHelp, setShowHelp] = useState(false)
  const [recognitionSupported, setRecognitionSupported] = useState(true)
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

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'pt-BR'

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setSuggestions([])
      setLastCommand(null)
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        processCommand(finalTranscript)
      } else {
        setTranscript(interimTranscript)
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
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return () => {
      recognition.abort()
    }
  }, [toast, products])

  const processCommand = useCallback((text: string) => {
    const command = parseVoiceCommand(text)

    if (!command) {
      toast({
        title: 'Não entendi',
        description: 'Diga algo como "1 quilo de coxa" ou "500 gramas de asa"',
        variant: 'destructive'
      })
      return
    }

    const match = findClosestProduct(command.productName, products)

    if (match && match.score >= 0.6) {
      onAddItem(match.product, command.quantity)
      setLastCommand({ product: match.product, quantity: command.quantity })
      setSuggestions([])
      toast({
        title: '✓ Produto adicionado!',
        description: `${command.quantity.toFixed(2)}kg de ${match.product.name}`,
      })
    } else {
      const similar = getSimilarProducts(command.productName, products, 5)
      if (similar.length > 0) {
        setSuggestions(similar)
        toast({
          title: 'Produto não encontrado',
          description: `Você quis dizer um destes?`,
        })
      } else {
        toast({
          title: 'Produto não encontrado',
          description: `Nenhum produto parecido com "${command.productName}"`,
          variant: 'destructive'
        })
      }
    }
  }, [onAddItem, products, toast])

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
            Comando de Voz
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
              className={cn(
                "relative w-16 h-16 rounded-full transition-all duration-300",
                isListening 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              {isListening ? (
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
                  Ouvindo... Fale agora!
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Toque no microfone para falar
              </p>
            )}
          </div>
        </div>

        {/* Transcrição em tempo real */}
        {transcript && isListening && (
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground mb-1">Reconhecendo:</p>
            <p className="text-lg font-medium">&ldquo;{transcript}&rdquo;</p>
          </div>
        )}

        {/* Último comando bem-sucedido */}
        {lastCommand && !isListening && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Adicionado: {lastCommand.quantity.toFixed(2)}kg
              </p>
              <p className="text-sm text-green-700">{lastCommand.product.name}</p>
            </div>
          </div>
        )}

        {/* Sugestões de produtos similares */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Você quis dizer:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map(product => (
                <Button
                  key={product.id}
                  onClick={() => {
                    const command = parseVoiceCommand(transcript)
                    if (command) {
                      onAddItem(product, command.quantity)
                      setLastCommand({ product, quantity: command.quantity })
                      setSuggestions([])
                      toast({
                        title: '✓ Adicionado',
                        description: `${command.quantity.toFixed(2)}kg de ${product.name}`
                      })
                    }
                  }}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-lg">🍗</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {product.price?.toFixed(2)}/{product.unit}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
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
              <li>&ldquo;1 quilo de coxa&rdquo;</li>
              <li>&ldquo;500 gramas de asa&rdquo;</li>
              <li>&ldquo;2 quilos de peito&rdquo;</li>
              <li>&ldquo;meio quilo de coração&rdquo;</li>
              <li>&ldquo;1.5 de sobrecoxa&rdquo;</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              Dica: Fale claramente o peso e o nome do produto
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
