'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'

export function useGoogleLogin() {
  const [showPopup, setShowPopup] = useState(false)
  const [timeOnPage, setTimeOnPage] = useState(0)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOnPage(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // SÓ mostrar popup se usuário NÃO estiver logado e estiver na página há 10 segundos
    if (timeOnPage >= 10 && !showPopup && !user) {
      setShowPopup(true)
    }
  }, [timeOnPage, showPopup, user])

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Erro no login Google:', error)
      }
    } catch (error) {
      console.error('Erro ao iniciar login Google:', error)
    }
  }

  return {
    showPopup,
    setShowPopup,
    handleGoogleLogin,
    timeOnPage
  }
}
