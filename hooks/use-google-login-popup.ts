'use client'

import { useState, useEffect } from 'react'

export function useGoogleLoginPopup() {
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    // Verificar se o usuário já pulou o popup
    const hasSkipped = localStorage.getItem('google-login-skipped')
    if (hasSkipped === 'true') {
      return
    }

    // Verificar se o usuário já está logado
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        
        if (!response.ok) {
          console.warn('API de autenticação não disponível:', response.status)
          return // Continuar sem mostrar popup se API não estiver disponível
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Resposta não é JSON:', contentType)
          return // Continuar sem mostrar popup se resposta não for JSON
        }
        
        const data = await response.json()
        const { user } = data
        if (user) {
          return // Usuário já logado, não mostrar popup
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        // Não mostrar popup em caso de erro para não incomodar usuário
      }
    }

    checkAuth()

    // Mostrar popup após 10 segundos
    const timer = setTimeout(() => {
      setShowPopup(true)
    }, 10000) // 10 segundos

    return () => clearTimeout(timer)
  }, [])

  const handleGoogleLogin = () => {
    // Redirecionar para o endpoint de login Google
    window.location.href = '/api/auth/google'
  }

  const handleSkip = () => {
    localStorage.setItem('google-login-skipped', 'true')
    setShowPopup(false)
  }

  const handleClose = () => {
    setShowPopup(false)
  }

  return {
    showPopup,
    handleGoogleLogin,
    handleSkip,
    handleClose
  }
}
