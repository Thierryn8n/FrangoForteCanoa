'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Barcode, Camera, X } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState('')
  const [useCamera, setUseCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.length !== 44) {
      setError('A chave de acesso deve ter exatamente 44 dígitos')
      return
    }
    onScan(manualInput)
    onClose()
  }

  const handleManualInput = (value: string) => {
    // Remove caracteres não numéricos
    const cleaned = value.replace(/\D/g, '')
    setManualInput(cleaned)
    setError(null)
  }

  // Formata a chave de acesso para visualização (grupos de 4 dígitos)
  const formatAccessKey = (key: string) => {
    return key.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Barcode className="w-5 h-5" />
              Ler Chave de Acesso
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Opções de entrada */}
          <div className="flex gap-2">
            <Button
              variant={!useCamera ? "default" : "outline"}
              className="flex-1"
              onClick={() => setUseCamera(false)}
            >
              Manual
            </Button>
            <Button
              variant={useCamera ? "default" : "outline"}
              className="flex-1"
              onClick={() => setUseCamera(true)}
            >
              <Camera className="w-4 h-4 mr-2" />
              Câmera
            </Button>
          </div>

          {/* Entrada manual */}
          {!useCamera && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="access_key">Chave de Acesso (44 dígitos)</Label>
                <Input
                  id="access_key"
                  value={formatAccessKey(manualInput)}
                  onChange={(e) => handleManualInput(e.target.value)}
                  placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                  maxLength={48} // 44 dígitos + 11 espaços
                  className="font-mono text-lg tracking-wider"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {manualInput.length}/44 dígitos
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={manualInput.length !== 44}
              >
                Confirmar Chave
              </Button>
            </form>
          )}

          {/* Scanner de câmera */}
          {useCamera && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-32 border-2 border-white/50 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Aponte a câmera para o código de barras da chave de acesso
              </p>
              <p className="text-xs text-center text-muted-foreground">
                Nota: A leitura por câmera requer biblioteca adicional. Use a entrada manual por enquanto.
              </p>
            </div>
          )}

          {/* Informações */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Dica:</strong> A chave de acesso de 44 dígitos está localizada no DANFE (Documento Auxiliar da Nota Fiscal Eletrônica).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
