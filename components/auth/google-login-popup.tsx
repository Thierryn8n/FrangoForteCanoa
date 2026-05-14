'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Chrome } from 'lucide-react'

interface GoogleLoginPopupProps {
  isOpen: boolean
  onClose: () => void
  onGoogleLogin: () => void
}

export function GoogleLoginPopup({ isOpen, onClose, onGoogleLogin }: GoogleLoginPopupProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // Redirecionar para o endpoint de login Google
      window.location.href = '/api/auth/google'
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error)
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    // Salvar que o usuário pulou o login para não mostrar novamente
    localStorage.setItem('google-login-skipped', 'true')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <Chrome className="w-6 h-6" />
            Faça Login com Google
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Entre com sua conta Google para ter a melhor experiência!
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <span>🛒</span>
                <span>Acompanhe seus pedidos</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <span>💾</span>
                <span>Salve seus favoritos</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <span>⚡</span>
                <span>Checkout mais rápido</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full gap-2"
              size="lg"
            >
              <Chrome className="w-5 h-5" />
              {isLoading ? 'Conectando...' : 'Entrar com Google'}
            </Button>

            <Button
              variant="outline"
              onClick={handleSkip}
              className="w-full"
              disabled={isLoading}
            >
              Agora não
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Ao fazer login, você aceita nossos{' '}
              <a href="/termos" className="text-primary hover:underline">
                termos de uso
              </a>{' '}
              e{' '}
              <a href="/privacidade" className="text-primary hover:underline">
                política de privacidade
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
