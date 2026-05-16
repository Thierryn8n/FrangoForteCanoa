'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/stock/categories/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao excluir categoria')
      }

      window.location.reload()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      alert('Erro ao excluir categoria: ' + (error as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Excluir categoria"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
