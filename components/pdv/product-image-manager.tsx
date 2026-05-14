'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Upload, X, Star, StarOff, GripVertical } from 'lucide-react'
import { ProductImage } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { setPrimaryImage, deleteProductImage } from '@/lib/actions/pdv'
import { useToast } from '@/hooks/use-toast'

interface ProductImageManagerProps {
  productId: string
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB

export function ProductImageManager({ productId, images, onChange }: ProductImageManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null)
  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!productId) {
        toast({ title: 'Salve o produto primeiro antes de adicionar imagens.', variant: 'destructive' })
        return
      }

      const validFiles = acceptedFiles.filter(file => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast({ title: `Tipo inválido: ${file.name}`, description: 'Apenas JPG, PNG, WebP e SVG são permitidos.', variant: 'destructive' })
          return false
        }
        if (file.size > MAX_SIZE_BYTES) {
          toast({ title: `Arquivo grande: ${file.name}`, description: 'Máximo 2MB por imagem.', variant: 'destructive' })
          return false
        }
        return true
      })

      if (validFiles.length === 0) return

      setUploading(true)
      const supabase = createClient()
      const newImages: ProductImage[] = []

      for (const file of validFiles) {
        const imageId = crypto.randomUUID()
        const ext = file.name.split('.').pop()
        const path = `products/${productId}/${imageId}_original.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(path, file, { upsert: false })

        if (uploadError) {
          toast({ title: `Erro ao enviar ${file.name}`, description: uploadError.message, variant: 'destructive' })
          continue
        }

        const { data: urlData } = supabase.storage.from('products').getPublicUrl(path)
        const imageUrl = urlData.publicUrl

        const isFirst = images.length === 0 && newImages.length === 0
        const { data: savedImage, error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: imageUrl,
            image_variants: { original: imageUrl },
            sort_order: images.length + newImages.length,
            is_primary: isFirst,
            status: 'active'
          })
          .select()
          .single()

        if (dbError) {
          toast({ title: `Erro ao salvar ${file.name}`, description: dbError.message, variant: 'destructive' })
          continue
        }

        newImages.push(savedImage as ProductImage)
      }

      onChange([...images, ...newImages])
      setUploading(false)

      if (newImages.length > 0) {
        toast({ title: `${newImages.length} imagem(ns) enviada(s) com sucesso.` })
      }
    },
    [productId, images, onChange, toast]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg']
    },
    maxSize: MAX_SIZE_BYTES,
    multiple: true
  })

  async function handleSetPrimary(image: ProductImage) {
    setSettingPrimaryId(image.id)
    try {
      await setPrimaryImage(productId, image.id)
      const updated = images.map(img => ({ ...img, is_primary: img.id === image.id }))
      onChange(updated)
      toast({ title: 'Imagem principal definida.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setSettingPrimaryId(null)
    }
  }

  async function handleDelete(image: ProductImage) {
    setDeletingId(image.id)
    try {
      const supabase = createClient()
      // Remover do storage
      const urlPath = image.image_url.split('/storage/v1/object/public/products/')[1]
      if (urlPath) {
        await supabase.storage.from('products').remove([urlPath])
      }
      await deleteProductImage(image.id)
      const remaining = images.filter(img => img.id !== image.id)
      // Se a deletada era primária, definir a próxima como primária
      if (image.is_primary && remaining.length > 0) {
        await setPrimaryImage(productId, remaining[0].id)
        remaining[0] = { ...remaining[0], is_primary: true }
      }
      onChange(remaining)
      toast({ title: 'Imagem removida.' })
    } catch (e: any) {
      toast({ title: 'Erro ao remover', description: e.message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/60'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <Spinner className="h-6 w-6 text-primary" />
              <p className="text-sm text-muted-foreground">Enviando imagens...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive ? 'Solte aqui' : 'Arraste ou clique para adicionar imagens'}
              </p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP, SVG — máx. 2MB cada</p>
            </>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map(image => (
            <div
              key={image.id}
              className={`
                relative group rounded-lg overflow-hidden border-2 transition-all
                ${image.is_primary ? 'border-primary' : 'border-transparent'}
              `}
            >
              <img
                src={image.image_url}
                alt={image.title || 'Imagem do produto'}
                className="h-24 w-full object-cover"
              />

              {/* Overlay de ações */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {/* Definir como primária */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-white hover:text-yellow-400"
                  onClick={() => handleSetPrimary(image)}
                  disabled={settingPrimaryId === image.id || image.is_primary}
                  title={image.is_primary ? 'Imagem principal' : 'Definir como principal'}
                >
                  {settingPrimaryId === image.id ? (
                    <Spinner className="h-3 w-3" />
                  ) : image.is_primary ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>

                {/* Remover */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-white hover:text-red-400"
                  onClick={() => handleDelete(image)}
                  disabled={deletingId === image.id}
                  title="Remover imagem"
                >
                  {deletingId === image.id ? (
                    <Spinner className="h-3 w-3" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Badge principal */}
              {image.is_primary && (
                <Badge className="absolute bottom-1 left-1 text-xs px-1 py-0" variant="default">
                  Capa
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <p className="text-xs text-muted-foreground text-center">Nenhuma imagem adicionada ainda.</p>
      )}
    </div>
  )
}
