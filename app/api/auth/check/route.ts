import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao verificar autenticação',
          user: null 
        },
        { status: 401 }
      )
    }

    // Retornar dados do usuário se estiver autenticado
    return NextResponse.json({
      success: true,
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || null,
        provider: user.app_metadata?.provider || 'email'
      } : null
    })

  } catch (error) {
    console.error('Erro na API de verificação de autenticação:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        user: null 
      },
      { status: 500 }
    )
  }
}
