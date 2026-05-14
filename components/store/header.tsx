'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, Search, Heart, ShoppingCart, Phone, ChevronDown, User, LogOut, Settings, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/contexts/auth-context'
import { CartDrawer } from './cart-drawer'

const navLinks = [
  { href: '/', label: 'Início' },
  {
    href: '/produtos',
    label: 'Produtos',
    submenu: [
      { href: '/produtos/frango-inteiro', label: 'Frango Inteiro' },
      { href: '/produtos/cortes-nobres', label: 'Cortes Nobres' },
      { href: '/produtos/asas-coxinhas', label: 'Asas e Coxinhas' },
      { href: '/produtos/miudos', label: 'Miúdos' },
    ],
  },
  { href: '/kits', label: 'Kits e Ofertas' },
  { href: '/quem-somos', label: 'Quem Somos' },
  { href: '/duvidas', label: 'Dúvidas' },
  { href: '/contato', label: 'Contato' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const { itemCount } = useCart()
  const { user, customer, signOut, loading: authLoading } = useAuth()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/produtos?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <>
      {/* Top Bar - Green */}
      <div className="bg-[#2D5A27] text-white py-2 px-4 text-xs md:text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="flex items-center gap-1">
              <span className="text-lg">🐔</span>
              <span className="hidden sm:inline">Bem-vindo à Frango Forte Canoa!</span>
              <span className="sm:hidden">Bem-vindo!</span>
            </span>
            <span className="hidden md:flex items-center gap-1">
              <span className="text-lg">🚚</span>
              Entrega rápida e segura em Canoa Quebrada e região
            </span>
          </div>
          <a
            href="https://wa.me/5588996125274"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 md:gap-2 font-semibold hover:opacity-80 transition-opacity"
          >
            <span className="text-lg">📞</span>
            <span className="hidden md:inline">Atendimento:</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              (88) 99612-5274
            </span>
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4 relative">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 relative z-10">
              <Image
                src="/logo-oficial.png"
                alt="Frango Forte Canoa"
                width={140}
                height={140}
                className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-xl -mb-8 md:-mb-12"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/" className="text-orange-600 font-bold text-sm hover:opacity-80 transition">
                Início
              </Link>
              <div className="group relative">
                <button className="text-gray-700 font-medium text-sm hover:text-orange-600 transition flex items-center gap-1">
                  Produtos
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute left-0 mt-0 w-48 bg-white rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Frango Inteiro</Link>
                  <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cortes Nobres</Link>
                  <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Asas e Coxinhas</Link>
                </div>
              </div>
              <Link href="#" className="text-gray-700 font-medium text-sm hover:text-orange-600 transition">
                Kits e Ofertas
              </Link>
              <Link href="#" className="text-gray-700 font-medium text-sm hover:text-orange-600 transition">
                Quem Somos
              </Link>
              <Link href="#" className="text-gray-700 font-medium text-sm hover:text-orange-600 transition">
                Dúvidas
              </Link>
              <Link href="#" className="text-gray-700 font-medium text-sm hover:text-orange-600 transition">
                Contato
              </Link>
            </nav>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-xs">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="search"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 rounded-full bg-gray-100 border-0 text-sm focus:bg-white focus:ring-2 focus:ring-orange-600"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                  <Search className="w-5 h-5 text-gray-400 hover:text-orange-600 transition" />
                </button>
              </form>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* User Menu */}
              {authLoading ? (
                <div className="hidden md:flex w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:flex text-gray-700 hover:text-orange-600">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        {customer?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium truncate">
                        {customer?.full_name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/minha-conta" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Minha Conta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/minha-conta/pedidos" className="cursor-pointer">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Meus Pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/minha-conta/favoritos" className="cursor-pointer">
                        <Heart className="w-4 h-4 mr-2" />
                        Favoritos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/minha-conta/configuracoes" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" className="hidden md:flex text-gray-700 hover:text-orange-600" asChild>
                  <Link href="/auth/login">
                    <User className="w-5 h-5 mr-2" />
                    Entrar
                  </Link>
                </Button>
              )}

              {/* Acompanhar Pedidos - only show for logged in users */}
              {user && (
                <Button variant="ghost" size="icon" className="hidden md:flex text-gray-700 hover:text-orange-600" asChild>
                  <Link href="/minha-conta/pedidos" title="Acompanhar Pedidos">
                    <Package className="w-5 h-5" />
                  </Link>
                </Button>
              )}

              {/* Favorites - only show for logged in users */}
              {user && (
                <Button variant="ghost" size="icon" className="hidden md:flex text-gray-700 hover:text-orange-600" asChild>
                  <Link href="/minha-conta/favoritos" title="Favoritos">
                    <Heart className="w-5 h-5" />
                  </Link>
                </Button>
              )}

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-orange-600"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-gray-700">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b bg-primary">
                      <Image
                        src="/logo-oficial.png"
                        alt="Frango Forte Canoa"
                        width={80}
                        height={80}
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    <nav className="flex-1 py-4 overflow-y-auto">
                      {/* User Section Mobile */}
                      {user ? (
                        <div className="px-4 py-3 mb-2 bg-muted/50 border-b">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                              {customer?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {customer?.full_name || user.email?.split('@')[0]}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Link
                              href="/minha-conta"
                              className="flex-1 text-center py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Minha Conta
                            </Link>
                            <button
                              onClick={() => {
                                signOut()
                                setMobileMenuOpen(false)
                              }}
                              className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-medium"
                            >
                              Sair
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-3 mb-2 border-b">
                          <Link
                            href="/auth/login"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="w-5 h-5" />
                            Entrar ou Criar Conta
                          </Link>
                        </div>
                      )}
                      
                      {/* Search Mobile */}
                      <div className="px-4 py-3 border-b">
                        <form onSubmit={handleSearch} className="relative w-full">
                          <Input
                            type="search"
                            placeholder="Buscar produtos..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full px-4 py-2 rounded-full bg-gray-100 border-0 text-sm focus:bg-white focus:ring-2 focus:ring-orange-600"
                          />
                          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                            <Search className="w-5 h-5 text-gray-400 hover:text-orange-600 transition" />
                          </button>
                        </form>
                      </div>
                      
                      {navLinks.map((link) => (
                        <div key={link.href}>
                          <Link
                            href={link.href}
                            className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium text-sm"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                          {link.submenu && (
                            <div className="bg-gray-50">
                              {link.submenu.map((sublink) => (
                                <Link
                                  key={sublink.href}
                                  href={sublink.href}
                                  className="block px-8 py-2 text-xs text-gray-600 hover:text-orange-600"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {sublink.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </nav>
                    <div className="p-4 border-t">
                      <a
                        href="https://wa.me/5588996125274"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-lg font-semibold text-sm"
                      >
                        <Phone className="w-5 h-5" />
                        Fale no WhatsApp
                      </a>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
