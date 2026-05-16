'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// === GERENCIAMENTO DE USUÁRIOS E PAPEIS ===

export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

export async function getAllUsers() {
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return userRoles
}

export async function assignUserRole(userId: string, role: 'admin' | 'gerente' | 'caixa' | 'funcionario') {
  const { data, error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateUserRole(userId: string, role: 'admin' | 'gerente' | 'caixa' | 'funcionario') {
  const { data, error } = await supabase
    .from('user_roles')
    .update({ role })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deactivateUser(userId: string) {
  const { error } = await supabase
    .from('user_roles')
    .update({ is_active: false })
    .eq('user_id', userId)

  if (error) throw error
}

export async function activateUser(userId: string) {
  const { error } = await supabase
    .from('user_roles')
    .update({ is_active: true })
    .eq('user_id', userId)

  if (error) throw error
}

export async function checkUserRole(userId: string, requiredRole: string) {
  const userRole = await getUserRole(userId)
  
  if (!userRole || !userRole.is_active) {
    return false
  }

  const roleHierarchy = {
    admin: ['admin', 'gerente', 'caixa', 'funcionario'],
    gerente: ['gerente', 'caixa', 'funcionario'],
    caixa: ['caixa', 'funcionario'],
    funcionario: ['funcionario']
  }

  return roleHierarchy[requiredRole as keyof typeof roleHierarchy]?.includes(userRole.role) || false
}
