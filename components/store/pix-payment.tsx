'use client'

import { useState } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PIXPaymentProps {
  pixCode: string
  orderId: string
  amount: number
  onConfirm: () => void
}

export function PIXPayment({ pixCode, orderId, amount, onConfirm }: PIXPaymentProps) {
  const [copied, setCopied] = useState(false)
  const [showInfo, setShowInfo] = useState(true)

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar código PIX:', err)
    }
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 md:p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Pagamento via PIX</h3>
        <p className="text-gray-600">Rápido, seguro e sem taxas</p>
      </div>

      {/* Alert Info */}
      {showInfo && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Como fazer a transferência PIX</p>
            <p className="text-sm text-blue-700 mt-1">
              Copie o código PIX abaixo, abra seu app de banco e realize a transferência. Você receberá confirmação em poucos segundos!
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Amount Display */}
      <div className="mb-6 text-center">
        <p className="text-gray-600 text-sm mb-2">Valor a pagar:</p>
        <p className="text-4xl font-bold text-orange-600">
          R$ {(amount / 100).toFixed(2).replace('.', ',')}
        </p>
      </div>

      {/* PIX Code Copy Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Código PIX Copia e Cola
        </label>
        <div className="relative">
          <div className="w-full p-4 bg-white border-2 border-dashed border-orange-300 rounded-lg text-sm font-mono text-gray-600 break-all pr-12">
            {pixCode}
          </div>
          <button
            onClick={copyPixCode}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
            title="Copiar código PIX"
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
        {copied && (
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Código copiado!
          </p>
        )}
      </div>

      {/* QR Code Info */}
      <div className="mb-6 text-center">
        <p className="text-gray-600 text-sm mb-3">Ou escanear código QR</p>
        <div className="w-48 h-48 mx-auto bg-white p-4 rounded-lg border-2 border-orange-300">
          <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded">
            <p className="text-sm text-gray-500">QR Code PIX</p>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Detalhes do pedido</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">ID do Pedido:</span>
            <span className="font-mono text-gray-900">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Valor:</span>
            <span className="font-semibold text-gray-900">
              R$ {(amount / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Método:</span>
            <span className="text-orange-600 font-medium">PIX</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={copyPixCode}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
        >
          <Copy className="w-5 h-5 mr-2" />
          Copiar Código PIX
        </Button>
        <Button
          onClick={onConfirm}
          variant="outline"
          className="w-full border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold py-3"
        >
          Já realizei a transferência
        </Button>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-600 text-center mt-4">
        Após realizar a transferência, clique em &quot;Já realizei a transferência&quot; para confirmar o pagamento
      </p>
    </div>
  )
}
