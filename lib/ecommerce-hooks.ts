'use client'

import useSWR from 'swr'
import { useState, useCallback } from 'react'
import {
  getEcommerceOrders,
  getEcommerceOrder,
  getDeliveryAreas,
  getAllDeliveryAreas,
  getCoupons,
  validateCoupon,
  calculateDelivery,
  createEcommerceOrder,
  updateEcommerceOrderStatus
} from '@/lib/actions/ecommerce'
import { EcommerceOrder, EcommerceOrderItem, Coupon, DeliveryArea } from '@/lib/types'

// === Pedidos E-commerce ===

export function useEcommerceOrders(limit = 50) {
  const { data, error, isLoading, mutate } = useSWR(
    ['ecommerce_orders', limit],
    () => getEcommerceOrders(limit),
    { revalidateOnFocus: false }
  )

  return {
    orders: (data || []) as EcommerceOrder[],
    isLoading,
    error,
    mutate
  }
}

export function useEcommerceOrder(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['ecommerce_order', id] : null,
    () => getEcommerceOrder(id!),
    { revalidateOnFocus: false }
  )

  return {
    order: data as EcommerceOrder | undefined,
    isLoading,
    error,
    mutate
  }
}

// === Áreas de Entrega ===

export function useDeliveryAreas(onlyActive = true) {
  const { data, error, isLoading, mutate } = useSWR(
    ['delivery_areas', onlyActive],
    () => (onlyActive ? getDeliveryAreas() : getAllDeliveryAreas()),
    { revalidateOnFocus: false }
  )

  return {
    areas: (data || []) as DeliveryArea[],
    isLoading,
    error,
    mutate
  }
}

// === Cupons ===

export function useCoupons() {
  const { data, error, isLoading, mutate } = useSWR(
    'coupons',
    () => getCoupons(),
    { revalidateOnFocus: false }
  )

  return {
    coupons: (data || []) as Coupon[],
    isLoading,
    error,
    mutate
  }
}

// === Aplicar Cupom ===

export function useApplyCoupon() {
  const [loading, setLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(async (code: string, orderTotal: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await validateCoupon(code, orderTotal)
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon)
        return result.coupon
      } else {
        setError(result.error || 'Cupom inválido.')
        setAppliedCoupon(null)
        return null
      }
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(() => {
    setAppliedCoupon(null)
    setError(null)
  }, [])

  const getDiscount = useCallback((subtotal: number): number => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.discount_type === 'percentage') {
      return (subtotal * appliedCoupon.discount_value) / 100
    }
    return Math.min(appliedCoupon.discount_value, subtotal)
  }, [appliedCoupon])

  return { apply, remove, getDiscount, appliedCoupon, loading, error }
}

// === Cálculo de Frete ===

export function useDeliveryCalculation(areaId: string | null, subtotal: number) {
  const { data, error, isLoading } = useSWR(
    areaId && subtotal >= 0 ? ['delivery_calc', areaId, subtotal] : null,
    () => calculateDelivery(areaId!, subtotal),
    { revalidateOnFocus: false }
  )

  return {
    fee: data?.fee ?? 0,
    isFree: data?.isFree ?? false,
    estimatedMinutes: data?.estimatedMinutes,
    isLoading,
    error
  }
}

// === Checkout E-commerce ===

export function useEcommerceCheckout() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<EcommerceOrder | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (
    orderData: Omit<EcommerceOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'items'>,
    items: Omit<EcommerceOrderItem, 'id' | 'order_id' | 'created_at'>[]
  ) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const order = await createEcommerceOrder(orderData, items)
      setLastOrder(order)
      return order
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return { submit, isSubmitting, lastOrder, error }
}

// === Atualizar status ===

export function useUpdateOrderStatus() {
  const [isUpdating, setIsUpdating] = useState(false)

  const update = useCallback(async (
    id: string,
    status: EcommerceOrder['status'],
    trackingCode?: string
  ) => {
    setIsUpdating(true)
    try {
      const updated = await updateEcommerceOrderStatus(id, status, trackingCode)
      return updated
    } finally {
      setIsUpdating(false)
    }
  }, [])

  return { update, isUpdating }
}
