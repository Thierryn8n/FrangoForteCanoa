'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribeNewsletter } from '@/lib/actions/pdv'
import { useToast } from '@/hooks/use-toast'

interface Settings {
  newsletter_title?: string
  newsletter_description?: string
  instagram_handle?: string
  instagram_url?: string
  instagram_photos?: { url: string; alt?: string }[]
}

interface Props {
  settings: Settings | null
}

export function NewsletterInstagram({ settings }: Props) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const title       = settings?.newsletter_title       || 'RECEBA NOSSAS OFERTAS'
  const description = settings?.newsletter_description || 'Cadastre-se e receba ofertas exclusivas no seu e-mail!'
  const handle      = settings?.instagram_handle       || '@frangofortecanoa'
  const igUrl       = settings?.instagram_url          || 'https://instagram.com/frangofortecanoa'
  const photos      = settings?.instagram_photos       || []

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await subscribeNewsletter(email)
      setEmail('')
      toast({ title: 'Cadastrado com sucesso!', description: 'Você receberá nossas ofertas em breve.' })
    } catch {
      toast({ title: 'Erro ao cadastrar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-12 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

          {/* Newsletter */}
          <div>
            <p className="text-primary font-extrabold text-sm tracking-widest uppercase mb-2">{title}</p>
            <h3 className="text-foreground font-bold text-2xl md:text-3xl leading-tight mb-5">
              Cadastre-se e receba ofertas<br />exclusivas no seu e-mail!
            </h3>
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                required
                className="flex-1 bg-background border-border"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 uppercase tracking-wide"
              >
                {loading ? '...' : 'Cadastrar'}
              </Button>
            </form>
          </div>

          {/* Instagram */}
          <div>
            <h3 className="text-foreground font-extrabold text-xl uppercase tracking-wide mb-1">
              Siga Nosso Instagram
            </h3>
            <p className="text-muted-foreground text-sm mb-4">{handle}</p>

            {photos.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.slice(0, 5).map((photo, i) => (
                  <a
                    key={i}
                    href={igUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden relative"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.alt || `Instagram ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                ))}
              </div>
            ) : (
              /* Placeholder quando não há fotos cadastradas */
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl bg-muted border border-border"
                  />
                ))}
              </div>
            )}

            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 border border-primary text-primary font-bold px-5 py-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors text-sm uppercase tracking-wide"
            >
              Ver mais no Instagram
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
