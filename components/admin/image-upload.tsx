'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  bucket: 'product-images' | 'kit-images' | 'category-images'
  onImageChange: (imageUrl: string) => void
  currentImage?: string
}

// Lista de imagens disponíveis nas pastas public
const PUBLIC_IMAGES = {
  products: [
    '/products/asa-frango.png',
    '/products/coxa-sobrecoxa.png',
    '/products/frango-inteiro.png',
    '/products/miudo-frango.png',
    '/products/peito-frango.png',
  ],
  kits: [
    '/kits/kit-churrasco.png',
    '/kits/kit-economico.png',
    '/kits/kit-familia.png',
  ],
}

export default function ImageUpload({ bucket, onImageChange, currentImage }: ImageUploadProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Determinar quais imagens mostrar baseado no bucket
  const availableImages = bucket === 'product-images' 
    ? PUBLIC_IMAGES.products 
    : bucket === 'kit-images' 
      ? PUBLIC_IMAGES.kits 
      : []

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    if (file.size > 5242880) {
      alert('A imagem deve ter menos de 5MB')
      return
    }

    setLoading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName)
      onImageChange(publicData.publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Erro ao fazer upload da imagem')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleRemove = () => {
    setPreview(null)
    onImageChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSelectExisting = (imageUrl: string) => {
    setPreview(imageUrl)
    onImageChange(imageUrl)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Área de upload - menor */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-muted-foreground rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          {loading ? (
            <div className="space-y-2">
              <Loader className="w-6 h-6 mx-auto animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Fazendo upload...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Upload nova imagem</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WebP ou GIF. Máximo 5MB.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pré-visualização */}
        {preview && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Pré-visualização</p>
            <div className="relative inline-block w-full">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full hover:bg-destructive/90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de imagens existentes */}
      {availableImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Imagens disponíveis
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {availableImages.map((imageUrl) => (
              <button
                key={imageUrl}
                type="button"
                onClick={() => handleSelectExisting(imageUrl)}
                className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${
                  preview === imageUrl ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={imageUrl.split('/').pop()}
                  className="w-full h-full object-cover"
                />
                {preview === imageUrl && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-white rounded-full p-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
