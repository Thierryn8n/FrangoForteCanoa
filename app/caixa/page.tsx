'use client'

import { useCallback, useState, useEffect } from 'react'
import { useProducts, useCategories, useStoreSettings } from '@/lib/hooks'
import { createPdvOrder, deleteProduct, createCategory, updateCategory } from '@/lib/actions/pdv'
import { createClient } from '@/lib/supabase/client'
import { ProductGrid } from '@/components/pdv/product-grid'
import { VoiceOrderInput } from '@/components/pdv/voice-order-input'
import { Receipt } from '@/components/pdv/receipt'
import { ProductModal } from '@/components/pdv/product-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
// Imports de Dialog e AlertDialog removidos - usando popups customizados
import { Plus, Pencil, Trash2, Search, Tag, ShoppingBag, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PdvProduct, PdvOrderItem, PdvCategory } from '@/lib/types'
import { Label } from '@/components/ui/label'

const formatPrice = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function CaixaPage() {
  const { products, isLoading: productsLoading, mutate: mutateProducts } = useProducts()
  const { categories, mutate: mutateCategories } = useCategories()
  const { settings } = useStoreSettings()
  const { toast } = useToast()

  // ── Venda Direta ──
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cartItems, setCartItems] = useState<Array<{product: PdvProduct, quantity: number}>>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'pix' | 'credit' | 'debit'>('money')
  const [orderType, setOrderType] = useState<'balcao' | 'delivery'>('balcao')
  const [clientes, setClientes] = useState<any[]>([])
  const [selectedCliente, setSelectedCliente] = useState<any>(null)

  // ── Produtos CRUD ──
  const [productSearch, setProductSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<PdvProduct | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<PdvProduct | null>(null)

  // ── Categorias CRUD ──
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<PdvCategory | null>(null)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('')
  const [catColor, setCatColor] = useState('#22c55e')

  // ──────────────────────────────────────────
  // Venda Direta
  // ──────────────────────────────────────────

  const handleSelectProduct = (product: PdvProduct) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id)
      if (existingItem) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prev, { product, quantity: 1 }]
      }
    })
    toast({ title: 'Produto adicionado', description: `${product.name} adicionado ao carrinho` })
  }

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId))
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId)
      return
    }
    setCartItems(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      )
    )
  }

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.product.price_per_kg * item.quantity), 0)
  }

  // ── Carregar Clientes ──
  const loadClientes = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('full_name')
      
      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  // Carregar clientes ao montar o componente
  useEffect(() => {
    loadClientes()
  }, [])

  const handleSelectCliente = (cliente: any) => {
    setSelectedCliente(cliente)
    setCustomerName(cliente.full_name || '')
    setCustomerPhone(cliente.phone || '')
    setCustomerAddress(cliente.address || '')
  }

  const handleDirectSale = async () => {
    if (cartItems.length === 0) {
      toast({ title: 'Adicione produtos ao carrinho', variant: 'destructive' })
      return
    }
    
    if (!customerName.trim()) {
      toast({ title: 'Informe o nome do cliente', variant: 'destructive' })
      return
    }
    
    setIsProcessing(true)
    try {
      const orderItems: PdvOrderItem[] = cartItems.map(item => ({
        id: crypto.randomUUID(),
        order_id: '',
        product_id: item.product.id,
        product_name: item.product.name,
        weight_kg: item.quantity,
        price_per_kg: item.product.price_per_kg,
        total_price: item.quantity * item.product.price_per_kg,
        created_at: new Date().toISOString()
      }))

      const subtotal = getTotalAmount()
      const order = await createPdvOrder(
        {
          customer_name: customerName,
          customer_phone: customerPhone || '',
          customer_address: customerAddress || '',
          order_type: orderType,
          subtotal: subtotal,
          discount: 0,
          total: subtotal,
          payment_method: paymentMethod,
          status: paymentMethod === 'pix' ? 'pending' : 'completed'
        },
        orderItems
      )

      setLastOrder({ ...order, items: orderItems })
      setCartItems([])
      setCustomerName('')
      setCustomerPhone('')
      setCustomerAddress('')
      setSelectedCliente(null)
      setIsReceiptOpen(true)
      toast({ title: 'Venda finalizada!' })
    } catch (error: any) {
      toast({ title: 'Erro ao finalizar', description: error.message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  // ──────────────────────────────────────────
  // Produtos CRUD
  // ──────────────────────────────────────────

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase())
    const matchCat = !filterCategory || p.category_id === filterCategory
    return matchSearch && matchCat
  })

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return
    try {
      await deleteProduct(deletingProduct.id)
      mutateProducts()
      toast({ title: 'Produto excluido.' })
    } catch (e: any) {
      toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' })
    } finally {
      setDeletingProduct(null)
    }
  }

  // ──────────────────────────────────────────
  // Categorias CRUD
  // ──────────────────────────────────────────

  function openCatModal(cat?: PdvCategory) {
    setEditingCat(cat || null)
    setCatName(cat?.name || '')
    setCatIcon(cat?.icon || '')
    setCatColor(cat?.color || '#22c55e')
    setCatModalOpen(true)
  }

  async function handleSaveCat() {
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name: catName, icon: catIcon, color: catColor })
      } else {
        await createCategory({ name: catName, icon: catIcon, color: catColor })
      }
      mutateCategories()
      setCatModalOpen(false)
      toast({ title: editingCat ? 'Categoria atualizada.' : 'Categoria criada.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  // ──────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{settings?.store_name || 'PDV'}</h1>
            <p className="text-sm text-muted-foreground">Sistema de Caixa</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('/caixa/organizar-pedidos', '_blank')}
              className="gap-2"
            >
              <Package className="h-5 w-5" />
              Organizar Pedidos
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pdv">
          <TabsList className="mb-4">
            <TabsTrigger value="pdv" className="gap-2">
              <ShoppingBag className="h-4 w-4" /> PDV / Venda
            </TabsTrigger>
            <TabsTrigger value="produtos" className="gap-2">
              <Tag className="h-4 w-4" /> Produtos
            </TabsTrigger>
          </TabsList>

          {/* ────── ABA PDV ────── */}
          <TabsContent value="pdv" className="space-y-4">
            {/* Layout Lado a Lado: Seleção Rápida e Venda Direta */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Seleção Rápida - Lado Esquerdo (Mais Larga) */}
              <div className="lg:col-span-2">
                <div className="bg-background rounded-lg border p-4 h-full">
                  <h3 className="text-lg font-semibold mb-4">Seleção Rápida</h3>
                  {productsLoading ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      Carregando produtos...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {products.filter(p => p.is_active).map(product => {
                        const cat = categories.find(c => c.id === product.category_id)
                        return (
                          <div
                            key={product.id}
                            onClick={() => handleSelectProduct(product)}
                            className={`
                              relative bg-card border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105
                              ${cartItems.some(item => item.product.id === product.id) 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-border hover:border-primary/50'
                              }
                            `}
                          >
                            {/* Imagem do Produto */}
                            <div className="w-full h-16 mb-3 flex items-center justify-center">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-full w-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Badge de Categoria */}
                            {cat && (
                              <div className="absolute top-2 right-2">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs px-2 py-1 bg-background/90 backdrop-blur-sm border-border"
                                >
                                  {cat.icon}
                                </Badge>
                              </div>
                            )}

                            {/* Nome do Produto */}
                            <div className="text-sm font-semibold text-foreground mb-2 line-clamp-2 leading-tight">
                              {product.name}
                            </div>

                            {/* Preço e Badge de Status */}
                            <div className="flex flex-col gap-2">
                              <div className="text-lg font-bold text-primary">
                                {formatPrice(product.price_per_kg)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                por kg
                              </div>
                              
                              {/* Indicador de Quantidade no Carrinho */}
                              {cartItems.some(item => item.product.id === product.id) && (
                                <div className="flex items-center justify-center mt-2">
                                  <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                                    {cartItems.find(item => item.product.id === product.id)?.quantity || 1}x
                                  </div>
                                </div>
                              )}

                              </div>

                            {/* Efeito de brilho quando no carrinho */}
                            {cartItems.some(item => item.product.id === product.id) && (
                              <div className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"></div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Venda Direta - Lado Direito */}
              <div className="lg:col-span-1">
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Venda Direta
                    </h3>
                  </div>

                  <div className="p-6 space-y-6">
                    
                    {/* Cliente */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground">Cliente</Label>
                      <div className="relative">
                        <select 
                          className="w-full p-3 pr-10 border-border bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                          value={selectedCliente?.id || ''}
                          onChange={(e) => {
                            const cliente = clientes.find(c => c.id === e.target.value)
                            if (cliente) handleSelectCliente(cliente)
                          }}
                        >
                          <option value="">Selecione um cliente...</option>
                          {clientes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                              {cliente.full_name} {cliente.phone && `- ${cliente.phone}`}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg text-center">
                        ou preencha manualmente abaixo
                      </div>
                    </div>

                    {/* Dados do Cliente */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                          Nome do Cliente <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Nome completo do cliente"
                          className={customerName ? 'border-green-200 bg-green-50/50' : ''}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Telefone</Label>
                        <Input 
                          value={customerPhone}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '')
                            const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
                            if (match) {
                              setCustomerPhone(`(${match[1]}) ${match[2]}-${match[3]}`)
                            } else {
                              setCustomerPhone(e.target.value)
                            }
                          }}
                          placeholder="(00) 00000-0000"
                          type="tel"
                          maxLength={15}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Endereço</Label>
                        <Input 
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Rua, número, bairro..."
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('/admin/clientes', '_blank')}
                          className="w-full gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Cadastrar Novo Cliente
                        </Button>
                      </div>
                    </div>

                    {/* Tipo e Pagamento */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-foreground">Tipo</Label>
                        <div className="relative">
                          <select 
                            className="w-full p-3 pr-10 border-border bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer text-sm"
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                          >
                            <option value="balcao">🏪 Balcão</option>
                            <option value="delivery">🚚 Delivery</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-foreground">Pagamento</Label>
                        <div className="relative">
                          <select 
                            className="w-full p-3 pr-10 border-border bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer text-sm"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <option value="money">💵 Dinheiro</option>
                            <option value="pix">📱 PIX</option>
                            <option value="credit">💳 Crédito</option>
                            <option value="debit">💳 Débito</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Carrinho de Produtos */}
                    {cartItems.length > 0 && (
                      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <h4 className="font-semibold text-foreground">Carrinho ({cartItems.length})</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCartItems([])}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {cartItems.map((item, index) => (
                            <div key={item.product.id} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-foreground">{item.product.name}</div>
                                <div className="text-xs text-muted-foreground">{formatPrice(item.product.price_per_kg)}/kg</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    -
                                  </Button>
                                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    +
                                  </Button>
                                </div>
                                <div className="text-sm font-semibold text-primary w-16 text-right">
                                  {formatPrice(item.product.price_per_kg * item.quantity)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.product.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-primary/20 pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">Total:</span>
                            <span className="text-xl font-bold text-primary">
                              {formatPrice(getTotalAmount())}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botão de Venda */}
                    <Button 
                      onClick={handleDirectSale}
                      disabled={cartItems.length === 0 || !customerName.trim() || isProcessing}
                      className="w-full py-3 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                          Processando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5" />
                          Finalizar Venda ({cartItems.length} itens)
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ────── ABA PRODUTOS CRUD ────── */}
          <TabsContent value="produtos" className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => openCatModal()}
                  className="gap-2"
                >
                  <Tag className="h-4 w-4" /> Categorias
                </Button>
                <Button
                  onClick={() => {
                    setEditingProduct(null)
                    setProductModalOpen(true)
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Novo Produto
                </Button>
              </div>
            </div>

            {/* Filtro por categoria */}
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={filterCategory === null ? 'default' : 'outline'}
                  onClick={() => setFilterCategory(null)}
                >
                  Todos
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={filterCategory === cat.id ? 'default' : 'outline'}
                    onClick={() => setFilterCategory(cat.id)}
                  >
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Tabela de Produtos */}
            <div className="bg-background rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Img</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preco/kg</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map(product => {
                      const cat = categories.find(c => c.id === product.category_id)
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                -
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            {cat ? (
                              <Badge variant="outline">
                                {cat.icon} {cat.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>{formatPrice(product.price_per_kg)}</TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? 'default' : 'secondary'}>
                              {product.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingProduct(product)
                                  setProductModalOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingProduct(product)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      
      {/* ── Receipt (sem popup) ── */}
      {lastOrder && isReceiptOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recibo da Venda</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsReceiptOpen(false)}
              >
                ✕
              </Button>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <Receipt order={lastOrder} settings={settings} />
            </div>
            <div className="text-center text-sm text-green-600 mt-2 mb-2">
              Pedido enviado para impressora!
            </div>
            <Button
              onClick={() => {
                setIsReceiptOpen(false)
              }}
              className="w-full mt-2"
              variant="outline"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* ── Product Modal (sem popup) ── */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setProductModalOpen(false)
                  setEditingProduct(null)
                }}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input 
                  value={editingProduct?.name || ''} 
                  onChange={e => setEditingProduct(editingProduct ? {...editingProduct, name: e.target.value} : null)}
                  placeholder="Nome do produto" 
                />
              </div>
              <div>
                <Label>Preço *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={editingProduct?.price || ''} 
                  onChange={e => setEditingProduct(editingProduct ? {...editingProduct, price: parseFloat(e.target.value)} : null)}
                  placeholder="0.00" 
                />
              </div>
              <div>
                <Label>Estoque</Label>
                <Input 
                  type="number"
                  value={editingProduct?.stock || ''} 
                  onChange={e => setEditingProduct(editingProduct ? {...editingProduct, stock: parseInt(e.target.value)} : null)}
                  placeholder="0" 
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={editingProduct?.category_id || ''}
                  onChange={e => setEditingProduct(editingProduct ? {...editingProduct, category_id: e.target.value} : null)}
                >
                  <option value="">Selecione...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <Button 
                onClick={() => {
                  // Aqui você implementaria a lógica de salvar
                  setProductModalOpen(false)
                  setEditingProduct(null)
                  mutateProducts()
                }}
                className="w-full"
              >
                {editingProduct ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm (sem popup) ── */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Excluir produto?</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir <strong>{deletingProduct.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDeletingProduct(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleDeleteProduct} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Categoria Modal (sem popup) ── */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingCat ? 'Editar Categoria' : 'Gerenciar Categorias'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCatModalOpen(false)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              {/* Lista de categorias existentes */}
              {!editingCat && categories.length > 0 && (
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span>
                        {cat.icon && <span className="mr-1">{cat.icon}</span>}
                        {cat.name}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openCatModal(cat)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-3 space-y-3">
                <p className="text-sm font-medium">
                  {editingCat ? `Editando: ${editingCat.name}` : 'Nova Categoria'}
                </p>
                <div className="space-y-1">
                  <Label>Nome *</Label>
                  <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Nome da categoria" />
                </div>
                <div className="space-y-1">
                  <Label>Ícone</Label>
                  <Input value={catIcon} onChange={e => setCatIcon(e.target.value)} placeholder="🍔" />
                </div>
                <div className="space-y-1">
                  <Label>Cor</Label>
                  <Input value={catColor} onChange={e => setCatColor(e.target.value)} placeholder="#22c55e" />
                </div>
                <div className="space-y-2">
                  <Button onClick={handleSaveCat} className="w-full">
                    {editingCat ? 'Atualizar' : 'Criar'}
                  </Button>
                  {editingCat && (
                    <Button variant="outline" className="w-full" onClick={() => setEditingCat(null)}>
                      Nova Categoria
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

          </main>
  )
}
