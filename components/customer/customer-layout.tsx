'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MapPin,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  Bell,
  User,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'

const sidebarLinks = [
  { href: '/minha-conta', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/minha-conta/pedidos', label: 'Meus Pedidos', icon: ShoppingBag },
  { href: '/minha-conta/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/minha-conta/enderecos', label: 'Endereços', icon: MapPin },
  { href: '/minha-conta/configuracoes', label: 'Configurações', icon: Settings },
]

interface CustomerLayoutProps {
  children: React.ReactNode
  customerName?: string | null
  customerEmail?: string | null
}

function Sidebar({ 
  mobile = false, 
  onClose,
  customerName,
}: { 
  mobile?: boolean
  onClose?: () => void
  customerName?: string | null
}) {
  const pathname = usePathname()

  return (
    <aside className={`${mobile ? 'w-full' : 'w-64'} bg-sidebar text-sidebar-foreground flex flex-col h-full`}>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3" onClick={onClose}>
          <Image
            src="/logo-oficial.png"
            alt="Frango Forte Canoa"
            width={50}
            height={50}
            className="object-contain"
          />
          <div>
            <p className="font-bold text-sm">Frango Forte</p>
            <p className="text-xs text-sidebar-foreground/60">Minha Conta</p>
          </div>
        </Link>
      </div>

      {/* Customer Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary text-sidebar-primary-foreground rounded-full flex items-center justify-center font-bold">
            {customerName ? customerName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{customerName || 'Cliente'}</p>
            <p className="text-xs text-sidebar-foreground/60">Cliente</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/minha-conta' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
              onClick={onClose}
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          onClick={onClose}
        >
          <Store className="w-5 h-5" />
          <span className="font-medium">Voltar à Loja</span>
        </Link>
      </div>
    </aside>
  )
}

export function CustomerLayout({ children, customerName, customerEmail }: CustomerLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <Sidebar customerName={customerName} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-card border-b shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar mobile onClose={() => setMobileMenuOpen(false)} customerName={customerName} />
              </SheetContent>
            </Sheet>

            {/* Title */}
            <h1 className="lg:hidden text-lg font-bold text-foreground">Minha Conta</h1>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      {customerName ? customerName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <span className="hidden md:block max-w-[150px] truncate">{customerName || 'Cliente'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{customerName || 'Cliente'}</p>
                    <p className="text-xs text-muted-foreground truncate">{customerEmail}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/minha-conta/configuracoes" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      Ir para Loja
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
