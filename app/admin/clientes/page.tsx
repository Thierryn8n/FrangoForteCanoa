'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Plus, Edit, Trash2, Phone, MapPin, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Cliente {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  address_number: string | null
  address_complement: string | null
  zip_code: string | null
  created_at: string
}

export default function ClientesPage() {
  const { toast } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    address_number: '',
    address_complement: '',
    zip_code: ''
  })

  const loadClientes = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('full_name')

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível carregar os clientes', 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])

  const filteredClientes = clientes.filter(cliente =>
    (cliente.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (cliente.phone || '').includes(searchTerm) ||
    (cliente.address?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (cliente.address_number || '').includes(searchTerm) ||
    (cliente.zip_code || '').includes(searchTerm)
  )

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' })
      return
    }

    try {
      const supabase = createClient()
      
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update({
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            address_number: formData.address_number.trim(),
            address_complement: formData.address_complement.trim(),
            zip_code: formData.zip_code.trim()
          })
          .eq('id', editingCliente.id)

        if (error) throw error
        toast({ title: 'Sucesso', description: 'Cliente atualizado' })
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert({
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            address_number: formData.address_number.trim(),
            address_complement: formData.address_complement.trim(),
            zip_code: formData.zip_code.trim()
          })

        if (error) throw error
        toast({ title: 'Sucesso', description: 'Cliente criado' })
      }

      await loadClientes()
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Não foi possível salvar o cliente', 
        variant: 'destructive' 
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: 'Sucesso', description: 'Cliente excluído' })
      await loadClientes()
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Não foi possível excluir o cliente', 
        variant: 'destructive' 
      })
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      full_name: cliente.full_name || '',
      phone: cliente.phone || '',
      address: cliente.address || '',
      address_number: cliente.address_number || '',
      address_complement: cliente.address_complement || '',
      zip_code: cliente.zip_code || ''
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ full_name: '', phone: '', address: '', address_number: '', address_complement: '', zip_code: '' })
    setEditingCliente(null)
  }

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, phone: formatted }))
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerenciar clientes cadastrados</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nome completo do cliente"
                  className={formData.full_name ? 'border-green-200 bg-green-50/50' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  placeholder="00000-000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereco</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, Avenida..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_number">Numero</Label>
                  <Input
                    id="address_number"
                    value={formData.address_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_complement">Complemento</Label>
                  <Input
                    id="address_complement"
                    value={formData.address_complement}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_complement: e.target.value }))}
                    placeholder="Apto, Casa..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  className="flex-1"
                  disabled={!formData.full_name.trim()}
                >
                  {editingCliente ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou endereco..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Carregando clientes...</div>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClientes.map(cliente => (
            <Card key={cliente.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-lg">{cliente.full_name}</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {cliente.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{cliente.phone}</span>
                        </div>
                      )}
                      
                      {cliente.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {cliente.address}
                            {cliente.address_number && `, ${cliente.address_number}`}
                            {cliente.address_complement && ` - ${cliente.address_complement}`}
                            {cliente.zip_code && ` (CEP: ${cliente.zip_code})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cliente)}
                      className="gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(cliente.id)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
