'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/admin-auth-context'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Bell,
  Gift,
  Mail,
  Calculator,
  Scale,
  DollarSign,
  FileText,
  AlertTriangle,
  Shield,
  BarChart3,
  Scissors,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/kits', label: 'Kits e Ofertas', icon: Gift },
  { href: '/admin/estoque', label: 'Gestão de Estoque', icon: Scale },
  { href: '/admin/producao/notas-entrada', label: 'Notas de Entrada', icon: FileText },
  { href: '/admin/producao/abate', label: 'Controle de Abate', icon: Scissors },
  { href: '/admin/financeiro', label: 'Dashboard Financeiro', icon: BarChart3 },
  { href: '/admin/custos/granja', label: 'Custos da Granja', icon: DollarSign },
  { href: '/admin/custos/operacionais', label: 'Custos Operacionais', icon: DollarSign },
  { href: '/admin/custos/preco-frango', label: 'Preço Ideal Frango', icon: Calculator },
  { href: '/admin/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/admin/alertas', label: 'Alertas', icon: AlertTriangle },
  { href: '/admin/usuarios', label: 'Usuários', icon: Shield },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/depoimentos', label: 'Depoimentos', icon: MessageSquare },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

const externalLinks = [
  { href: '/caixa', label: 'PDV / Caixa', icon: Calculator, external: true },
]

function UserMenu() {
  const { admin, logout } = useAdminAuth()
  const router = useRouter()
  
  const handleLogout = async () => {
    await logout()
    router.push('/adm-adm')
  }
  
  const initials = admin?.full_name 
    ? admin.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A'
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 md:px-4">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
            {initials}
          </div>
          <span className="hidden sm:block max-w-[100px] truncate">{admin?.full_name || 'Admin'}</span>
          <ChevronDown className="w-4 h-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-muted-foreground">
          {admin?.email}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/configuracoes">Configurações</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/">Voltar à Loja</Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className={`${mobile ? 'w-full' : 'w-64'} bg-sidebar text-sidebar-foreground flex flex-col h-full`}>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/admin" className="flex items-center gap-3" onClick={onClose}>
          <Image
            src="/logo-oficial.png"
            alt="Frango Forte Canoa"
            width={50}
            height={50}
            className="object-contain"
          />
          <div>
            <p className="font-bold text-sm">Frango Forte</p>
            <p className="text-xs text-sidebar-foreground/60">Painel Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
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
        <div className="my-2 border-t border-sidebar-border" />
        {externalLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
              onClick={onClose}
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </a>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Voltar à Loja</span>
        </Link>
      </div>
    </aside>
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <Sidebar />
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
                <Sidebar mobile onClose={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Search */}
            <div className="hidden lg:block flex-1 max-w-md ml-4">
              <input
                type="search"
                placeholder="Buscar..."
                className="w-full px-4 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2 ml-auto lg:ml-0">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
