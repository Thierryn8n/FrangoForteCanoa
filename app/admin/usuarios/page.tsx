import { createClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/lib/actions/users'
import { Users, Shield, UserCheck, UserX, Crown, Briefcase, DollarSign, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UsersPage() {
  const supabase = await createClient()
  const users = await getAllUsers()

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-5 h-5" />
      case 'gerente':
        return <Briefcase className="w-5 h-5" />
      case 'caixa':
        return <DollarSign className="w-5 h-5" />
      case 'funcionario':
        return <User className="w-5 h-5" />
      default:
        return <Shield className="w-5 h-5" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'gerente':
        return 'Gerente'
      case 'caixa':
        return 'Caixa'
      case 'funcionario':
        return 'Funcionário'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'gerente':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'caixa':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'funcionario':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
  }

  const activeUsers = users?.filter((u: any) => u.is_active).length || 0
  const inactiveUsers = users?.filter((u: any) => !u.is_active).length || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Controle de Usuários</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os usuários e suas permissões no sistema
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Com acesso ao sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <UserX className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">Sem acesso ao sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários e Permissões</CardTitle>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: any) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <h3 className="font-semibold">ID: {user.user_id.slice(0, 8)}...</h3>
                        <p className="text-sm text-muted-foreground">
                          Cadastrado em {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <UserCheck className="w-4 h-4" />
                            Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-red-600">
                            <UserX className="w-4 h-4" />
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Descrição dos Papéis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Administrador</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Acesso total ao sistema. Pode gerenciar usuários, produtos, estoque, custos e relatórios.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Gerente</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Pode gerenciar estoque, produtos e visualizar relatórios. Não pode gerenciar usuários.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Caixa</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Pode registrar vendas no PDV e visualizar relatórios básicos. Acesso limitado ao sistema.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold">Funcionário</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Acesso básico ao sistema. Pode visualizar informações limitadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
