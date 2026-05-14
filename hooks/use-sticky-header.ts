'use client'

import { useState, useEffect } from 'react'

export function useStickyHeader() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollThreshold, setScrollThreshold] = useState(0)

  useEffect(() => {
    // Calcular 10% da altura da página
    const calculateThreshold = () => {
      const pageHeight = document.documentElement.scrollHeight - window.innerHeight
      const threshold = pageHeight * 0.1 // 10% da página
      setScrollThreshold(threshold)
    }

    // Calcular no carregamento e quando redimensionar
    calculateThreshold()
    window.addEventListener('resize', calculateThreshold)

    // Listener de scroll
    const handleScroll = () => {
      const currentScroll = window.scrollY
      
      // Mostrar header quando passar de 10% da página
      if (currentScroll > scrollThreshold) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', calculateThreshold)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrollThreshold])

  return isVisible
}
