import type { Metadata, Viewport } from 'next'
import { Poppins, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { CartProvider } from '@/contexts/cart-context'
import { GoogleLoginPopupProvider } from '@/contexts/google-login-popup-context'
import { GoogleLoginPopup } from '@/components/auth/google-login-popup'
import { useGoogleLoginPopupContext } from '@/contexts/google-login-popup-context'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Frango Forte Canoa | Frango Fresco Abatido na Hora',
  description: 'Frango fresco abatido na hora em Canoa Quebrada. Qualidade, frescor e sabor incomparável para sua família. Entrega rápida e segura na região.',
  keywords: ['frango fresco', 'canoa quebrada', 'frango abatido na hora', 'delivery frango', 'frango forte'],
  authors: [{ name: 'Frango Forte Canoa' }],
  openGraph: {
    title: 'Frango Forte Canoa | Frango Fresco Abatido na Hora',
    description: 'Frango fresco abatido na hora em Canoa Quebrada. Qualidade, frescor e sabor incomparável para sua família.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Frango Forte Canoa',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frango Forte Canoa | Frango Fresco Abatido na Hora',
    description: 'Frango fresco abatido na hora em Canoa Quebrada.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FF6A00',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${poppins.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <GoogleLoginPopupProvider>
              {children}
            </GoogleLoginPopupProvider>
          </CartProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
