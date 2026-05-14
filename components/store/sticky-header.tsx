'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, Search, Heart, ShoppingCart, Phone, ChevronDown, User, LogOut, Settings } from 'lucide-react'
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

export function StickyHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
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
      {/* Sticky Header - Simplificado e Compacto */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg transform transition-all duration-300 ease-in-out">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4" style={{ minHeight: '60px' }}>
            {/* Logo - Maior e metade para dentro */}
            <Link href="/" className="flex-shrink-0 relative" style={{ marginBottom: '-40px', marginLeft: '-12px' }}>
              <Image
                src="/logo-oficial.png"
                alt="Frango Forte Canoa"
                width={160}
                height={160}
                className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-xl"
                priority
              />
            </Link>

            {/* Desktop Navigation - Simplificada */}
            <nav className="hidden lg:flex items-center gap-4">
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
                Kits
              </Link>
              <Link href="#" className="text-gray-700 font-medium text-sm hover:text-orange-600 transition">
                Contato
              </Link>
            </nav>

            {/* Search Bar - Compacta */}
            <div className="hidden md:flex flex-1 max-w-xs">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="search"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-1.5 rounded-full bg-gray-100 border-0 text-sm focus:bg-white focus:ring-2 focus:ring-orange-600"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                  <Search className="w-4 h-4 text-gray-400 hover:text-orange-600 transition" />
                </button>
              </form>
            </div>

            {/* Action Buttons - Compactos */}
            <div className="flex items-center gap-2">
              {/* User Menu - Simplificado */}
              {authLoading ? (
                <div className="hidden md:flex w-6 h-6 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:flex text-gray-700 hover:text-orange-600 h-8 w-8">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs">
                        {customer?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium truncate">
                        {customer?.full_name || user.email?.split('@')[0]}
                      </p>
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
                        Pedidos
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
                <Button variant="ghost" size="sm" className="hidden md:flex text-gray-700 hover:text-orange-600 h-8 px-3 text-xs" asChild>
                  <Link href="/auth/login">
                    <User className="w-4 h-4 mr-1" />
                    Entrar
                  </Link>
                </Button>
              )}

              {/* Cart - Sempre visível */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-orange-600 h-8 w-8"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-gray-700 h-8 w-8">
                    <Menu className="w-4 h-4" />
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
