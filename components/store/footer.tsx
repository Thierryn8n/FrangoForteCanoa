'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Phone, MapPin, Clock, Instagram, Facebook, Mail } from 'lucide-react'

interface Settings {
  store_name?: string
  footer_about?: string
  footer_whatsapp?: string
  footer_email?: string
  footer_address?: string
  footer_hours?: string
  footer_facebook_url?: string
  instagram_url?: string
  footer_copyright?: string
  general_settings?: {
    whatsapp_number?: string
    instagram_url?: string
    facebook_url?: string
    contact_email?: string
    contact_phone?: string
  }
}

interface FooterProps {
  settings?: Settings | null
}

export function Footer({ settings }: FooterProps) {
  const gs          = settings?.general_settings || {}
  const whatsapp    = settings?.footer_whatsapp   || gs.whatsapp_number || '5588996125274'
  const email       = settings?.footer_email      || gs.contact_email   || 'contato@frangofortecanoa.com.br'
  const address     = settings?.footer_address    || 'Canoa Quebrada - Aracati/CE'
  const hours       = settings?.footer_hours      || 'Seg a Sáb: 06h às 18h | Dom: 06h às 12h'
  const about       = settings?.footer_about      || 'Frango abatido na hora com qualidade, segurança e o melhor sabor para você e sua família.'
  const igUrl       = settings?.instagram_url     || gs.instagram_url   || 'https://instagram.com/frangofortecanoa'
  const fbUrl       = settings?.footer_facebook_url || gs.facebook_url  || '#'
  const copyright   = settings?.footer_copyright  || `${new Date().getFullYear()} Frango Forte Canoa. Todos os direitos reservados.`

  const [hoursMon, hoursSun] = hours.includes('|') ? hours.split('|') : [hours, '']

  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Logo & About */}
            <div>
              <Image
                src="/logo-oficial.png"
                alt="Frango Forte Canoa"
                width={120}
                height={120}
                className="mb-4 object-contain"
              />
              <p className="text-sm text-background/70 mb-4 leading-relaxed">{about}</p>
              <div className="flex gap-3">
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-[#25D366] transition-colors"
                  aria-label="WhatsApp"
                >
                  <Phone className="w-5 h-5" />
                </a>
                {fbUrl && fbUrl !== '#' && (
                  <a
                    href={fbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Institucional */}
            <div>
              <h4 className="font-bold text-lg mb-4">INSTITUCIONAL</h4>
              <ul className="space-y-2">
                {[
                  { href: '/quem-somos',        label: 'Quem Somos' },
                  { href: '/nossa-historia',     label: 'Nossa História' },
                  { href: '/nossas-lojas',       label: 'Nossas Lojas' },
                  { href: '/politica-qualidade', label: 'Política de Qualidade' },
                  { href: '/trabalhe-conosco',   label: 'Trabalhe Conosco' },
                ].map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-background/70 hover:text-primary transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ajuda */}
            <div>
              <h4 className="font-bold text-lg mb-4">AJUDA E SUPORTE</h4>
              <ul className="space-y-2">
                {[
                  { href: '/duvidas',           label: 'Dúvidas Frequentes' },
                  { href: '/politica-entrega',  label: 'Política de Entrega' },
                  { href: '/trocas-devolucoes', label: 'Trocas e Devoluções' },
                  { href: '/formas-pagamento',  label: 'Formas de Pagamento' },
                  { href: '/contato',           label: 'Fale Conosco' },
                ].map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-background/70 hover:text-primary transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Atendimento */}
            <div>
              <h4 className="font-bold text-lg mb-4">ATENDIMENTO</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    className="text-background/70 hover:text-primary transition-colors text-sm"
                  >
                    {whatsapp.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4')}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-background/70 hover:text-primary transition-colors text-sm break-all"
                  >
                    {email}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-background/70 text-sm">{address}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-background/70 text-sm">
                    {hoursMon && <p>{hoursMon.trim()}</p>}
                    {hoursSun && <p>{hoursSun.trim()}</p>}
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-background/10 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-background/60">{copyright}</p>
          <p className="text-sm text-background/60">
            Desenvolvido com <span className="text-destructive">&#9829;</span> para você!
          </p>
        </div>
      </div>

      {/* WhatsApp Float */}
      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="Fale conosco pelo WhatsApp"
      >
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </footer>
  )
}
