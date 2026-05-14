'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MapPin, Plus, Pencil, Trash2, Star, Home, Building, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CustomerAddress } from '@/lib/types'
import { Spinner } from '@/components/ui/spinner'

const addressLabels = [
  { value: 'Casa', icon: Home },
  { value: 'Trabalho', icon: Briefcase },
  { value: 'Outro', icon: Building },
]

export default function EnderecosPage() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
  const [formData, setFormData] = useState({
    label: 'Casa',
    address: '',
    address_number: '',
    address_complement: '',
    neighborhood: '',
    city: 'Aracati',
    state: 'CE',
    zip_code: '',
    is_default: false,
  })
  
  const supabase = createClient()

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      console.log('Buscando endereços...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Erro auth:', authError)
        setLoading(false)
        return
      }
      
      if (!user) {
        console.log('Usuário não autenticado')
        setLoading(false)
        return
      }

      console.log('Usuário autenticado:', user.id)
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar endereços:', error)
        setLoading(false)
        return
      }

      console.log('Endereços encontrados:', data)
      setAddresses(data || [])
    } catch (e) {
      console.error('Erro inesperado em fetchAddresses:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const resetForm = () => {
    setFormData({
      label: 'Casa',
      address: '',
      address_number: '',
      address_complement: '',
      neighborhood: '',
      city: 'Aracati',
      state: 'CE',
      zip_code: '',
      is_default: false,
    })
    setEditingAddress(null)
  }

  const openEditDialog = (address: CustomerAddress) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      address: address.address,
      address_number: address.address_number || '',
      address_complement: address.address_complement || '',
      neighborhood: address.neighborhood || '',
      city: address.city,
      state: address.state,
      zip_code: address.zip_code || '',
      is_default: address.is_default,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    // If setting as default, unset other defaults first
    if (formData.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', user.id)
    }

    if (editingAddress) {
      // Update existing
      await supabase
        .from('customer_addresses')
        .update(formData)
        .eq('id', editingAddress.id)
    } else {
      // Create new
      await supabase
        .from('customer_addresses')
        .insert({
          customer_id: user.id,
          ...formData,
        })
    }

    await fetchAddresses()
    setDialogOpen(false)
    resetForm()
    setSaving(false)
  }

  const deleteAddress = async (id: string) => {
    await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', id)
    
    setAddresses(addresses.filter(a => a.id !== id))
  }

  const setAsDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Unset all defaults
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', user.id)

    // Set this one as default
    await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', id)

    await fetchAddresses()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Meus Endereços</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus endereços de entrega</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Editar Endereço' : 'Novo Endereço'}</DialogTitle>
              <DialogDescription>
                {editingAddress ? 'Atualize as informações do endereço.' : 'Adicione um novo endereço de entrega.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Label Selection */}
              <div className="space-y-2">
                <Label>Tipo de Endereço</Label>
                <div className="flex gap-2">
                  {addressLabels.map(({ value, icon: Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={formData.label === value ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, label: value })}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {value}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Rua/Avenida *</Label>
                  <Input
                    id="address"
                    placeholder="Ex: Rua das Flores"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_number">Número</Label>
                  <Input
                    id="address_number"
                    placeholder="Ex: 123"
                    value={formData.address_number}
                    onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_complement">Complemento</Label>
                  <Input
                    id="address_complement"
                    placeholder="Ex: Apt 101"
                    value={formData.address_complement}
                    onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Ex: Centro"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    placeholder="Ex: 62800-000"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Definir como endereço padrão
                </Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner className="w-4 h-4 mr-2" /> : null}
                  {editingAddress ? 'Salvar Alterações' : 'Adicionar Endereço'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Addresses List */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => {
            const LabelIcon = addressLabels.find(l => l.value === address.label)?.icon || MapPin
            
            return (
              <Card key={address.id} className={`relative ${address.is_default ? 'ring-2 ring-primary' : ''}`}>
                {address.is_default && (
                  <Badge className="absolute -top-2 -right-2 bg-primary">
                    <Star className="w-3 h-3 mr-1" />
                    Padrão
                  </Badge>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <LabelIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{address.label}</h3>
                      <p className="text-muted-foreground mt-1">
                        {address.address}
                        {address.address_number && `, ${address.address_number}`}
                        {address.address_complement && ` - ${address.address_complement}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.neighborhood && `${address.neighborhood} - `}
                        {address.city}/{address.state}
                        {address.zip_code && ` - ${address.zip_code}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    {!address.is_default && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setAsDefault(address.id)}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Definir Padrão
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(address)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir endereço?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O endereço será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAddress(address.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione endereços para agilizar suas entregas.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Endereço
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
