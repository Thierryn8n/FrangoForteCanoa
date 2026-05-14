'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, Shield, CheckCircle } from 'lucide-react'
import { useAdminAuth } from '@/contexts/admin-auth-context'

export default function AdminAuthPage() {
  const router = useRouter()
  const { login, checkAdminExists, createFirstAdmin, admin } = useAdminAuth()
  
  const [isFirstSetup, setIsFirstSetup] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [setupData, setSetupData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // Verificar se já está logado ou se é primeiro setup
  useEffect(() => {
    const checkAuth = async () => {
      if (admin) {
        router.push('/admin')
        return
      }

      const exists = await checkAdminExists()
      setIsFirstSetup(!exists)
      setIsLoading(false)
    }

    checkAuth()
  }, [admin, checkAdminExists, router])

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await login(loginData.email, loginData.password)

    if (result.success) {
      router.push('/admin')
    } else {
      setError(result.error || 'Erro ao fazer login')
      setIsLoading(false)
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validações
    if (setupData.password !== setupData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (setupData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setIsLoading(false)
      return
    }

    const result = await createFirstAdmin({
      email: setupData.email,
      password: setupData.password,
      full_name: setupData.full_name,
      phone: setupData.phone || undefined
    })

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/admin')
      }, 2000)
    } else {
      console.error('Setup failed with result:', result)
      setError(result.error || 'Erro ao criar administrador')
      setIsLoading(false)
    }
  }

  if (isLoading && isFirstSetup === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Spinner className="w-8 h-8 text-white" />
      </div>
    )
  }

  // Tela de sucesso após setup
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Administrador Criado!
            </h1>
            <p className="text-slate-400">
              Você será redirecionado para o painel admin...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Setup inicial - Cadastro do primeiro admin
  if (isFirstSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-oficial.png"
                alt="Frango Forte Canoa"
                width={100}
                height={100}
                className="mx-auto"
              />
            </Link>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <span className="text-orange-500 font-semibold">Setup Inicial do Admin</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">
              Crie o primeiro administrador do sistema. Esta tela só aparecerá uma vez.
            </p>
          </div>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Criar Administrador</CardTitle>
              <CardDescription className="text-slate-400">
                Preencha os dados do super administrador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-slate-300">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Seu nome completo"
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      value={setupData.full_name}
                      onChange={(e) => setSetupData({ ...setupData, full_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@empresa.com"
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      value={setupData.email}
                      onChange={(e) => setSetupData({ ...setupData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">Telefone/WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      value={setupData.phone}
                      onChange={(e) => setSetupData({ ...setupData, phone: formatPhone(e.target.value) })}
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      value={setupData.password}
                      onChange={(e) => setSetupData({ ...setupData, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full text-slate-500 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      value={setupData.confirmPassword}
                      onChange={(e) => setSetupData({ ...setupData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Criando...
                    </>
                  ) : (
                    'Criar Administrador'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
              Voltar para a loja
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Login normal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/logo-oficial.png"
              alt="Frango Forte Canoa"
              width={100}
              height={100}
              className="mx-auto"
            />
          </Link>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            <span className="text-orange-500 font-semibold">Painel Administrativo</span>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Login do Admin</CardTitle>
            <CardDescription className="text-slate-400">
              Acesse o painel de administração
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@empresa.com"
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full text-slate-500 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-4">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
            Voltar para a loja
          </Link>
          <p className="text-xs text-slate-600">
            Acesso restrito a administradores autorizados.
          </p>
        </div>
      </div>
    </div>
  )
}
