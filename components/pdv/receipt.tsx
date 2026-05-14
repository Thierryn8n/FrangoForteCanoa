'use client'

import { PdvOrder, PdvOrderItem, StoreSettings } from '@/lib/types'

interface ReceiptProps {
  order: PdvOrder & { items: PdvOrderItem[] }
  settings: StoreSettings
}

export function Receipt({ order, settings }: ReceiptProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(date))

  return (
    <div
      className="w-80 bg-white text-black p-4 space-y-2 receipt-thermal"
      style={{ 
        maxWidth: '80mm',
        fontFamily: "'Courier New', 'Courier', monospace",
        fontSize: '14px',
        fontWeight: 900,
        lineHeight: 1.3,
        color: '#000',
        WebkitFontSmoothing: 'none',
        MozOsxFontSmoothing: 'unset',
        textRendering: 'geometricPrecision'
      }}
    >
      {/* Logo e Nome */}
      {settings.logo_url && (
        <div className="text-center mb-2">
          <img
            src={settings.logo_url}
            alt="Logo"
            className="h-12 mx-auto"
          />
        </div>
      )}

      <div 
        className="text-center border-b pb-2"
        style={{ 
          fontSize: '18px', 
          fontWeight: 900,
          letterSpacing: '1px'
        }}
      >
        {settings.store_name || 'LOJA'}
      </div>

      {/* Dados da Loja */}
      <div className="text-center space-y-1">
        {settings.address && <div>{settings.address}</div>}
        {settings.phone && <div>Tel: {settings.phone}</div>}
      </div>

      <div 
        className="border-t border-b py-2 text-center"
        style={{ borderWidth: '3px 0', borderColor: '#000' }}
      >
        <div style={{ fontWeight: 900 }}>Pedido #{order.order_number}</div>
        <div>{formatDate(order.created_at)}</div>
      </div>

      {/* Dados do Cliente */}
      {order.customer_name || order.customer_phone ? (
        <div className="border-b pb-2" style={{ borderColor: '#000', borderWidth: '0 0 2px 0' }}>
          <div style={{ fontWeight: 900 }}>CLIENTE</div>
          {order.customer_name && <div>{order.customer_name}</div>}
          {order.customer_phone && <div>Fone: {order.customer_phone}</div>}
        </div>
      ) : null}

      {/* Itens */}
      <div className="border-b py-2 space-y-1" style={{ borderColor: '#000', borderWidth: '0 0 2px 0' }}>
        <div style={{ fontWeight: 900, borderBottom: '2px dashed #000', paddingBottom: '4px', marginBottom: '8px' }}>
          ITENS
        </div>
        {order.items?.map((item, idx) => (
          <div key={idx} className="space-y-0.5" style={{ marginBottom: '8px', fontWeight: 900 }}>
            <div className="flex justify-between">
              <span style={{ fontWeight: 900 }}>{item.product_name}</span>
              <span>{item.weight_kg.toFixed(3)}kg</span>
            </div>
            <div className="flex justify-between">
              <span>@{formatCurrency(item.price_per_kg)}/kg</span>
              <span style={{ fontWeight: 900 }}>{formatCurrency(item.total_price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo */}
      <div className="border-b py-2 space-y-1" style={{ borderColor: '#000', borderWidth: '0 0 2px 0' }}>
        <div style={{ fontWeight: 900, borderBottom: '2px dashed #000', paddingBottom: '4px', marginBottom: '8px' }}>
          RESUMO
        </div>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span>Desconto:</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        <div 
          className="flex justify-between"
          style={{ fontSize: '15px', fontWeight: 900, borderTop: '3px solid #000', paddingTop: '4px', marginTop: '4px' }}
        >
          <span>TOTAL:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Pagamento */}
      <div 
        className="text-center py-2"
        style={{ borderTop: '3px solid #000', borderBottom: '3px solid #000' }}
      >
        <div style={{ fontWeight: 900 }}>PAGAMENTO</div>
        <div>Forma: {order.payment_method?.toUpperCase()}</div>
        <div style={{ fontWeight: 900 }}>Status: PAGO</div>
      </div>

      {/* Rodapé */}
      <div className="text-center pt-2 space-y-1">
        <div style={{ fontSize: '11px' }}>Documento não fiscal</div>
        <div style={{ fontWeight: 900 }}>Obrigado pela preferência!</div>
        <div>Volte sempre</div>
        <div style={{ fontSize: '10px', marginTop: '8px' }}>
          {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
      
      {/* Espaço para corte */}
      <div style={{ height: '40px' }}></div>
    </div>
  )
}
