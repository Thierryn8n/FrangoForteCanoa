'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useGoogleLoginPopup } from '@/hooks/use-google-login-popup'

interface GoogleLoginPopupContextType {
  showPopup: boolean
  handleGoogleLogin: () => void
  handleSkip: () => void
  handleClose: () => void
}

const GoogleLoginPopupContext = createContext<GoogleLoginPopupContextType | undefined>(undefined)

export function GoogleLoginPopupProvider({ children }: { children: ReactNode }) {
  const value = useGoogleLoginPopup()

  return (
    <GoogleLoginPopupContext.Provider value={value}>
      {children}
    </GoogleLoginPopupContext.Provider>
  )
}

export function useGoogleLoginPopupContext() {
  const context = useContext(GoogleLoginPopupContext)
  if (context === undefined) {
    throw new Error('useGoogleLoginPopupContext must be used within a GoogleLoginPopupProvider')
  }
  return context
}
