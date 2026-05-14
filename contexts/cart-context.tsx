'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react'
import type { CartItem, Cart } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface CartState extends Cart {}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_DELIVERY_FEE'; payload: number }
  | { type: 'LOAD_CART'; payload: CartState }

function calculateTotals(items: CartItem[], deliveryFee: number): { subtotal: number; total: number } {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const total = subtotal + (items.length > 0 ? deliveryFee : 0)
  return { subtotal, total }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(item => item.id === action.payload.id)
      let newItems: CartItem[]
      
      if (existingIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        newItems = [...state.items, action.payload]
      }
      
      const { subtotal, total } = calculateTotals(newItems, state.deliveryFee)
      return { ...state, items: newItems, subtotal, total }
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      const { subtotal, total } = calculateTotals(newItems, state.deliveryFee)
      return { ...state, items: newItems, subtotal, total }
    }
    
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      )
      const { subtotal, total } = calculateTotals(newItems, state.deliveryFee)
      return { ...state, items: newItems, subtotal, total }
    }
    
    case 'CLEAR_CART': {
      return { items: [], subtotal: 0, deliveryFee: state.deliveryFee, total: 0 }
    }
    
    case 'SET_DELIVERY_FEE': {
      const { subtotal, total } = calculateTotals(state.items, action.payload)
      return { ...state, deliveryFee: action.payload, total }
    }
    
    case 'LOAD_CART': {
      return action.payload
    }
    
    default:
      return state
  }
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  deliveryFee: 5,
  total: 0,
}

interface CartContextType {
  cart: CartState
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setDeliveryFee: (fee: number) => void
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState)

  // Load delivery fee from store settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('store_settings').select('shipping_settings').single()
        if (data?.shipping_settings?.default_price != null) {
          const fee = parseFloat(data.shipping_settings.default_price)
          dispatch({ type: 'SET_DELIVERY_FEE', payload: fee })
        }
      } catch (e) {
        console.error('Failed to load delivery settings', e)
      }
    }
    loadSettings()
  }, [])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('frango-forte-cart')
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: 'LOAD_CART', payload: parsed })
        }
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e)
      }
    }
  }, [])
  
  // Save cart to localStorage on change, but only if it's not the initial empty state after loading
  useEffect(() => {
    // Evita salvar o estado inicial vazio se houver algo no localStorage
    const savedCart = localStorage.getItem('frango-forte-cart')
    if (cart.items.length === 0 && savedCart) {
      const parsed = JSON.parse(savedCart)
      if (parsed.items.length > 0) {
        // Se o cart atual está vazio mas o localStorage tem itens, 
        // significa que ainda estamos carregando ou acabou de ser limpo propositalmente.
        // Se for carregamento, não sobrescrevemos ainda.
        return
      }
    }
    localStorage.setItem('frango-forte-cart', JSON.stringify(cart))
  }, [cart])
  
  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...item, quantity: item.quantity || 1 } })
  }
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }
  
  const setDeliveryFee = (fee: number) => {
    dispatch({ type: 'SET_DELIVERY_FEE', payload: fee })
  }
  
  const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0)
  
  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setDeliveryFee,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
