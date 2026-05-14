'use client'

import { useStickyHeader } from '@/hooks/use-sticky-header'
import { StickyHeader } from './sticky-header'

export function StickyHeaderWrapper() {
  const showStickyHeader = useStickyHeader()

  return (
    <>
      {/* Sticky Header - Aparece ao rolar 10% */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        showStickyHeader 
          ? 'transform translate-y-0 opacity-100' 
          : 'transform -translate-y-full opacity-0 pointer-events-none'
      }`}>
        <StickyHeader />
      </div>
      
      {/* Espaço para o sticky header quando visível */}
      {showStickyHeader && (
        <div className="h-32 md:h-40" style={{ marginTop: '-1px' }} />
      )}
    </>
  )
}
