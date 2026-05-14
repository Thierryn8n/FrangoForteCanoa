'use client'

import useSWR from 'swr'
import { getProducts, getCategories, getPdvOrders, getPrintJobs, getStoreSettings } from '@/lib/actions/pdv'

const fetcher = (fn: () => Promise<any>) => fn()

// Produtos
export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR(
    'products',
    () => getProducts(),
    { revalidateOnFocus: false }
  )

  return {
    products: data || [],
    isLoading,
    error,
    mutate
  }
}

// Categorias
export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    'categories',
    () => getCategories(),
    { revalidateOnFocus: false }
  )

  return {
    categories: data || [],
    isLoading,
    error,
    mutate
  }
}

// Pedidos PDV
export function usePdvOrders() {
  const { data, error, isLoading, mutate } = useSWR(
    'orders',
    () => getPdvOrders(),
    { revalidateOnFocus: false }
  )

  return {
    orders: data || [],
    isLoading,
    error,
    mutate
  }
}

// Print Jobs
export function usePrintJobs(status?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    status ? ['print_jobs', status] : 'print_jobs',
    () => getPrintJobs(status),
    { revalidateOnFocus: false }
  )

  return {
    jobs: data || [],
    isLoading,
    error,
    mutate
  }
}

// Configurações
export function useStoreSettings() {
  const { data, error, isLoading, mutate } = useSWR(
    'store_settings',
    () => getStoreSettings(),
    { revalidateOnFocus: false }
  )

  return {
    settings: data || {},
    isLoading,
    error,
    mutate
  }
}
