'use client'

import { CreditCard, ShieldCheck, Package, Headphones } from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  CreditCard,
  ShieldCheck,
  Package,
  Headphones,
}

interface Feature {
  icon: string
  title: string
  description: string
}

const DEFAULT_FEATURES: Feature[] = [
  { icon: 'CreditCard',  title: 'Pagamento',    description: 'Cartão, PIX, Dinheiro e Transferência.' },
  { icon: 'ShieldCheck', title: 'Higienizado',   description: 'Ambiente seguro e limpo.' },
  { icon: 'Package',     title: 'Embalagem',    description: 'Embalagens resistentes e seguras.' },
  { icon: 'Headphones',  title: 'Atendimento',  description: 'Sempre prontos para te atender!' },
]

interface SubheaderFeaturesProps {
  features: Feature[] | null
}

export function SubheaderFeatures({ features }: SubheaderFeaturesProps) {
  const items = features && features.length > 0 ? features : DEFAULT_FEATURES

  return (
    <section
      className="py-2 md:py-6"
      style={{ background: 'linear-gradient(135deg, #cc2200 0%, #e63000 60%, #cc2200 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-2 md:px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
          {items.map((feature, i) => {
            const Icon = ICON_MAP[feature.icon] ?? CreditCard
            return (
              <div key={i} className="flex items-center gap-1.5 md:gap-4">
                <div className="flex-shrink-0 w-6 h-6 md:w-12 md:h-12 border-2 border-white/40 rounded-full flex items-center justify-center">
                  <Icon className="w-3 h-3 md:w-6 md:h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-[10px] md:text-sm leading-tight">{feature.title}</p>
                  <p className="text-white/75 text-[8px] leading-snug mt-0.5 hidden md:block">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
