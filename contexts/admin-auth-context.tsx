'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

// Cookie helpers
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

interface Admin {
  id: string
  email: string
  full_name: string
  phone: string | null
  is_active: boolean
  is_super_admin: boolean
  created_at: string
  last_login_at: string | null
}

interface AdminAuthContextType {
  admin: Admin | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAdminExists: () => Promise<boolean>
  createFirstAdmin: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<{ success: boolean; error?: string }>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Verificar sessão ao iniciar
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Try cookie first, then localStorage as fallback
        const cookieData = getCookie('admin_session')
        const storageData = localStorage.getItem('admin_session')
        const adminData = cookieData || storageData
        
        if (adminData) {
          const parsed = JSON.parse(adminData)
          setAdmin(parsed)
          // Sync cookie and localStorage
          localStorage.setItem('admin_session', adminData)
          setCookie('admin_session', adminData, 7)
        }
      } catch {
        localStorage.removeItem('admin_session')
        deleteCookie('admin_session')
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  const checkAdminExists = async (): Promise<boolean> => {
    const { data, error } = await supabase
      .rpc('check_admin_exists')
    
    if (error) {
      console.error('Erro ao verificar admin:', error)
      return false
    }
    
    return data || false
  }

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const createFirstAdmin = async (data: { 
    email: string; 
    password: string; 
    full_name: string; 
    phone?: string 
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const passwordHash = await hashPassword(data.password)
      
      // 1. Verificar se já existe algum admin usando uma query simples
      const { count, error: countError } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('Erro ao verificar admins:', countError)
        return { success: false, error: 'Erro ao verificar administradores existentes' }
      }

      if (count && count > 0) {
        return { success: false, error: 'Já existe um administrador cadastrado. Use o login normal.' }
      }

      // 2. Criar o primeiro admin como super admin diretamente na tabela
      const { data: newAdminData, error: insertError } = await supabase
        .from('admins')
        .insert([{
          email: data.email,
          password_hash: passwordHash,
          full_name: data.full_name,
          phone: data.phone || null,
          is_super_admin: true,
          is_active: true
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Erro ao inserir admin:', insertError)
        return { success: false, error: `Erro ao criar administrador: ${insertError.message}` }
      }

      if (newAdminData) {
        const adminSession: Admin = {
          id: newAdminData.id,
          email: newAdminData.email,
          full_name: newAdminData.full_name,
          phone: newAdminData.phone,
          is_active: newAdminData.is_active,
          is_super_admin: newAdminData.is_super_admin,
          created_at: newAdminData.created_at,
          last_login_at: null
        }
        
        setAdmin(adminSession)
        const adminJson = JSON.stringify(adminSession)
        localStorage.setItem('admin_session', adminJson)
        setCookie('admin_session', adminJson, 7)
        
        return { success: true }
      }

      return { success: false, error: 'Erro ao criar administrador' }
    } catch (err: any) {
      console.error('Unexpected error in createFirstAdmin:', err)
      return { success: false, error: `Erro inesperado: ${err.message}` }
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const passwordHash = await hashPassword(password)
      
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { success: false, error: 'E-mail ou senha incorretos' }
      }

      // Atualizar last_login_at
      await supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.id)

      const adminData: Admin = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        is_active: data.is_active,
        is_super_admin: data.is_super_admin,
        created_at: data.created_at,
        last_login_at: new Date().toISOString()
      }

      setAdmin(adminData)
      const adminJson = JSON.stringify(adminData)
      localStorage.setItem('admin_session', adminJson)
      setCookie('admin_session', adminJson, 7)
      
      return { success: true }
    } catch {
      return { success: false, error: 'Erro ao fazer login' }
    }
  }

  const logout = async () => {
    setAdmin(null)
    localStorage.removeItem('admin_session')
    deleteCookie('admin_session')
  }

  return (
    <AdminAuthContext.Provider value={{ 
      admin, 
      isLoading, 
      login, 
      logout, 
      checkAdminExists,
      createFirstAdmin 
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
