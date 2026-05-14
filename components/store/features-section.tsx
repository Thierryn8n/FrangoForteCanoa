'use client'

import { Clock, Leaf, Truck, ShieldCheck, Heart } from 'lucide-react'

const features = [
  {
    icon: Clock,
    title: 'Abate na Hora',
    description: 'Frango sempre fresco para sua família.',
  },
  {
    icon: Leaf,
    title: 'Sem Conservantes',
    description: '100% natural, sem química.',
  },
  {
    icon: Truck,
    title: 'Entrega Rápida',
    description: 'Rapidez e segurança na sua entrega.',
  },
  {
    icon: ShieldCheck,
    title: 'Qualidade Garantida',
    description: 'Procedimentos seguros e rigorosos.',
  },
  {
    icon: Heart,
    title: 'Sabor Incomparável',
    description: 'Mais sabor, mais saúde para você.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            POR QUE <span className="text-primary">ESCOLHER</span> A FRANGO FORTE?
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-card border-2 border-border hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="w-20 h-20 mx-auto mb-4 border-2 border-primary/30 rounded-full flex items-center justify-center">
                <feature.icon className="w-10 h-10 text-primary stroke-[1.5]" />
              </div>
              <h3 className="font-bold text-foreground mb-2 text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
