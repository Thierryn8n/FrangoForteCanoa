'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { ProductImageManager } from '@/components/pdv/product-image-manager'
import { useToast } from '@/hooks/use-toast'
import { createProduct, updateProduct, getProductImages } from '@/lib/actions/pdv'
import { PdvProduct, PdvCategory, ProductImage } from '@/lib/types'

interface ProductModalProps {
  open: boolean
  product?: PdvProduct | null
  categories: PdvCategory[]
  onClose: () => void
  onSaved: (product: PdvProduct) => void
}

const EMPTY: Partial<PdvProduct> = {
  name: '',
  description: '',
  price_per_kg: 0,
  category_id: undefined,
  validity_days: undefined,
  product_kind: 'regular',
  requires_album_cover: false,
  is_active: true
}

export function ProductModal({ open, product, categories, onClose, onSaved }: ProductModalProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<Partial<PdvProduct>>(EMPTY)
  const [images, setImages] = useState<ProductImage[]>([])
  const [saving, setSaving] = useState(false)
  const [savedProductId, setSavedProductId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (product) {
        setForm({ ...product })
        setSavedProductId(product.id)
        getProductImages(product.id).then(imgs => setImages(imgs as ProductImage[]))
      } else {
        setForm({ ...EMPTY })
        setSavedProductId(null)
        setImages([])
      }
    }
  }, [open, product])

  function set<K extends keyof PdvProduct>(key: K, value: PdvProduct[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name?.trim()) {
      toast({ title: 'Nome obrigatorio.', variant: 'destructive' })
      return
    }
    
    // Garantir campos obrigatorios para compatibilidade com o banco
    const dataToSave = {
      ...form,
      price: form.price || form.price_per_kg || 0,
      price_per_kg: form.price_per_kg || form.price || 0,
      unit: form.unit || 'kg',
      stock_quantity: form.stock_quantity ?? 100,
      min_order_quantity: form.min_order_quantity ?? 1,
      slug: form.slug || form.name!.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    }

    if (dataToSave.price_per_kg <= 0) {
      toast({ title: 'Preco/kg deve ser maior que zero.', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      let saved: PdvProduct
      if (product?.id) {
        saved = await updateProduct(product.id, dataToSave)
      } else {
        saved = await createProduct(dataToSave)
        setSavedProductId(saved.id)
      }
      toast({ title: product ? 'Produto atualizado.' : 'Produto criado.' })
      onSaved(saved)
      if (!product) {
        // Mantém modal aberto para permitir upload de imagens
      }
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList className="w-full">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="imagens" disabled={!savedProductId}>
              Imagens {images.length > 0 ? `(${images.length})` : ''}
            </TabsTrigger>
          </TabsList>

          {/* === ABA DADOS === */}
          <TabsContent value="dados" className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                value={form.name || ''}
                onChange={e => set('name', e.target.value)}
                placeholder="Nome do produto"
              />
            </div>

            <div className="space-y-1">
              <Label>Descricao</Label>
              <Textarea
                value={form.description || ''}
                onChange={e => set('description', e.target.value)}
                placeholder="Descricao opcional..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Preco por kg (R$) *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price_per_kg || ''}
                  onChange={e => set('price_per_kg', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label>Dias de Validade</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.validity_days || ''}
                  onChange={e => set('validity_days', parseInt(e.target.value) || undefined)}
                  placeholder="Ex: 7"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select
                value={form.category_id || 'none'}
                onValueChange={v => set('category_id', v === 'none' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select
                value={form.product_kind || 'regular'}
                onValueChange={v => set('product_kind', v as 'regular' | 'audio')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.product_kind === 'audio' && (
              <div className="flex items-center justify-between">
                <Label>Requer capa do album</Label>
                <Switch
                  checked={form.requires_album_cover ?? false}
                  onCheckedChange={v => set('requires_album_cover', v)}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Produto ativo</Label>
              <Switch
                checked={form.is_active ?? true}
                onCheckedChange={v => set('is_active', v)}
              />
            </div>
          </TabsContent>

          {/* === ABA IMAGENS === */}
          <TabsContent value="imagens" className="pt-2">
            {savedProductId ? (
              <ProductImageManager
                productId={savedProductId}
                images={images}
                onChange={setImages}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Salve o produto primeiro para adicionar imagens.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
            {product ? 'Atualizar' : 'Criar Produto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
