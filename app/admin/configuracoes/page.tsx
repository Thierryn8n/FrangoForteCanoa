'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { getStoreSettings, updateStoreSettings } from '@/lib/actions/pdv'
import { StoreSettings } from '@/lib/types'
import { Store, CreditCard, Truck, Settings, LayoutDashboard, Plus, Trash2 } from 'lucide-react'

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getStoreSettings().then(data => {
      setSettings(data as StoreSettings)
      setLoading(false)
    })
  }, [])

  async function handleSave(partial: Partial<StoreSettings>) {
    if (!settings) return
    setSaving(true)
    try {
      const updated = await updateStoreSettings({ id: settings.id, ...partial })
      setSettings(updated as StoreSettings)
      toast({ title: 'Configuracoes salvas com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuracoes</h1>
        <p className="text-muted-foreground mt-1">Gerencie as configuracoes da sua loja</p>
      </div>

      <Tabs defaultValue="loja">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap whitespace-nowrap">
          <TabsTrigger value="loja" className="gap-2">
            <Store className="h-4 w-4" /> <span className="hidden sm:inline">Loja</span>
          </TabsTrigger>
          <TabsTrigger value="pagamento" className="gap-2">
            <CreditCard className="h-4 w-4" /> <span className="hidden sm:inline">Pagamento</span>
          </TabsTrigger>
          <TabsTrigger value="envio" className="gap-2">
            <Truck className="h-4 w-4" /> <span className="hidden sm:inline">Envio</span>
          </TabsTrigger>
          <TabsTrigger value="geral" className="gap-2">
            <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="vitrine" className="gap-2">
            <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Vitrine</span>
          </TabsTrigger>
        </TabsList>

        {/* === ABA LOJA === */}
        <TabsContent value="loja">
          <LojaTab settings={settings} onSave={handleSave} saving={saving} />
        </TabsContent>

        {/* === ABA PAGAMENTO === */}
        <TabsContent value="pagamento">
          <PagamentoTab settings={settings} onSave={handleSave} saving={saving} />
        </TabsContent>

        {/* === ABA ENVIO === */}
        <TabsContent value="envio">
          <EnvioTab settings={settings} onSave={handleSave} saving={saving} />
        </TabsContent>

        {/* === ABA GERAL === */}
        <TabsContent value="geral">
          <GeralTab settings={settings} onSave={handleSave} saving={saving} />
        </TabsContent>

        {/* === ABA VITRINE === */}
        <TabsContent value="vitrine">
          <VitrineTab settings={settings} onSave={handleSave} saving={saving} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// ABA LOJA
// ============================================================
function LojaTab({
  settings,
  onSave,
  saving
}: {
  settings: StoreSettings
  onSave: (partial: Partial<StoreSettings>) => Promise<void>
  saving: boolean
}) {
  const [storeName, setStoreName] = useState(settings.store_name || '')
  const [cnpj, setCnpj] = useState(settings.cnpj || '')
  const [address, setAddress] = useState(settings.address || '')
  const [phone, setPhone] = useState(settings.phone || '')
  const [description, setDescription] = useState(settings.description || '')
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacoes da Loja</CardTitle>
        <CardDescription>Dados publicos exibidos no site e nos recibos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Nome da Loja *</Label>
            <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Minha Loja" />
          </div>
          <div className="space-y-1">
            <Label>CNPJ</Label>
            <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Endereco</Label>
          <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, numero, bairro, cidade - UF" />
        </div>
        <div className="space-y-1">
          <Label>Telefone</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(88) 99999-9999" />
        </div>
        <div className="space-y-1">
          <Label>Descricao</Label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Breve descricao da loja..."
            rows={3}
          />
        </div>
        <div className="space-y-1">
          <Label>URL do Logo</Label>
          <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-12 mt-2 rounded object-contain border p-1" />
          )}
        </div>
        <Button
          onClick={() =>
            onSave({
              store_name: storeName,
              cnpj,
              address,
              phone,
              description,
              logo_url: logoUrl
            })
          }
          disabled={saving}
          className="w-full"
        >
          {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
          Salvar Loja
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================
// ABA PAGAMENTO
// ============================================================
function PagamentoTab({
  settings,
  onSave,
  saving
}: {
  settings: StoreSettings
  onSave: (partial: Partial<StoreSettings>) => Promise<void>
  saving: boolean
}) {
  const ps = settings.payment_settings || {}
  const [gateway, setGateway] = useState(ps.gateway || 'manual')
  const [pixEnabled, setPixEnabled] = useState(ps.pix_enabled ?? true)
  const [cardEnabled, setCardEnabled] = useState(ps.card_enabled ?? true)
  const [feePercent, setFeePercent] = useState(String(ps.transaction_fee_percent ?? 0))
  const [stripeTestMode, setStripeTestMode] = useState(ps.stripe_test_mode ?? true)
  const [stripePubKey, setStripePubKey] = useState(ps.stripe_public_key || '')
  const [stripeSecretKey, setStripeSecretKey] = useState(ps.stripe_secret_key || '')
  const [stripeWebhook, setStripeWebhook] = useState(ps.stripe_webhook_secret || '')
  const [pixKey, setPixKey] = useState(ps.pix_key || '')
  const [pixQrUrl, setPixQrUrl] = useState(ps.pix_qr_code_url || '')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gateway de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Gateway</Label>
            <Select value={gateway} onValueChange={setGateway}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                <SelectItem value="pagseguro">PagSeguro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Habilitar PIX</Label>
            <Switch checked={pixEnabled} onCheckedChange={setPixEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Habilitar Cartao</Label>
            <Switch checked={cardEnabled} onCheckedChange={setCardEnabled} />
          </div>
          <div className="space-y-1">
            <Label>Taxa de Transacao (%)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={feePercent}
              onChange={e => setFeePercent(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {gateway === 'stripe' && (
        <Card>
          <CardHeader>
            <CardTitle>Stripe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Modo Teste</Label>
              <Switch checked={stripeTestMode} onCheckedChange={setStripeTestMode} />
            </div>
            <div className="space-y-1">
              <Label>Public Key</Label>
              <Input value={stripePubKey} onChange={e => setStripePubKey(e.target.value)} placeholder="pk_..." />
            </div>
            <div className="space-y-1">
              <Label>Secret Key</Label>
              <Input type="password" value={stripeSecretKey} onChange={e => setStripeSecretKey(e.target.value)} placeholder="sk_..." />
            </div>
            <div className="space-y-1">
              <Label>Webhook Secret</Label>
              <Input type="password" value={stripeWebhook} onChange={e => setStripeWebhook(e.target.value)} placeholder="whsec_..." />
            </div>
          </CardContent>
        </Card>
      )}

      {pixEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>PIX Manual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Chave PIX</Label>
              <Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="email, telefone, CPF ou aleatoria" />
            </div>
            <div className="space-y-1">
              <Label>URL do QR Code estatico (opcional)</Label>
              <Input value={pixQrUrl} onChange={e => setPixQrUrl(e.target.value)} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() =>
          onSave({
            payment_settings: {
              gateway,
              pix_enabled: pixEnabled,
              card_enabled: cardEnabled,
              transaction_fee_percent: parseFloat(feePercent) || 0,
              stripe_test_mode: stripeTestMode,
              stripe_public_key: stripePubKey || undefined,
              stripe_secret_key: stripeSecretKey || undefined,
              stripe_webhook_secret: stripeWebhook || undefined,
              pix_key: pixKey || undefined,
              pix_qr_code_url: pixQrUrl || undefined
            }
          })
        }
        disabled={saving}
        className="w-full"
      >
        {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
        Salvar Pagamento
      </Button>
    </div>
  )
}

// ============================================================
// ABA ENVIO
// ============================================================
function EnvioTab({
  settings,
  onSave,
  saving
}: {
  settings: StoreSettings
  onSave: (partial: Partial<StoreSettings>) => Promise<void>
  saving: boolean
}) {
  const ss = settings.shipping_settings || {}
  const [defaultPrice, setDefaultPrice] = useState(String(ss.default_price ?? 5))
  const [freeMin, setFreeMin] = useState(String(ss.free_shipping_min_total ?? 150))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracoes de Entrega</CardTitle>
        <CardDescription>As entregas sao feitas no mesmo dia em Canoa Quebrada.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Taxa de Entrega (R$)</Label>
            <Input type="number" min="0" step="0.01" value={defaultPrice} onChange={e => setDefaultPrice(e.target.value)} />
            <p className="text-xs text-muted-foreground">Valor cobrado para entregas.</p>
          </div>
          <div className="space-y-1">
            <Label>Frete Gratis a partir de (R$)</Label>
            <Input type="number" min="0" step="0.01" value={freeMin} onChange={e => setFreeMin(e.target.value)} />
            <p className="text-xs text-muted-foreground">Digite 0 para desabilitar frete gratis.</p>
          </div>
        </div>

        <Button
          onClick={() =>
            onSave({
              shipping_settings: {
                default_price: parseFloat(defaultPrice) || 5,
                free_shipping_min_total: parseFloat(freeMin) || undefined
              }
            })
          }
          disabled={saving}
          className="w-full"
        >
          {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
          Salvar Entrega
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================
// ABA GERAL
// ============================================================
function GeralTab({
  settings,
  onSave,
  saving
}: {
  settings: StoreSettings
  onSave: (partial: Partial<StoreSettings>) => Promise<void>
  saving: boolean
}) {
  const gs = settings.general_settings || {}
  const [currency, setCurrency] = useState(gs.currency || 'BRL')
  const [language, setLanguage] = useState(gs.language || 'pt-BR')
  const [timezone, setTimezone] = useState(gs.timezone || 'America/Fortaleza')
  const [contactEmail, setContactEmail] = useState(gs.contact_email || '')
  const [contactPhone, setContactPhone] = useState(gs.contact_phone || '')
  const [whatsapp, setWhatsapp] = useState(gs.whatsapp_number || '')
  const [facebook, setFacebook] = useState(gs.facebook_url || '')
  const [instagram, setInstagram] = useState(gs.instagram_url || '')
  const [metaTitle, setMetaTitle] = useState(gs.meta_title || '')
  const [metaDesc, setMetaDesc] = useState(gs.meta_description || '')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Regional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                  <SelectItem value="USD">USD - Dolar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Portugues (BR)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Espanol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fuso Horario</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Fortaleza">Fortaleza (UTC-3)</SelectItem>
                  <SelectItem value="America/Sao_Paulo">Sao Paulo (UTC-3)</SelectItem>
                  <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                  <SelectItem value="America/Belem">Belem (UTC-3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Email de Contato</Label>
              <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contato@loja.com" />
            </div>
            <div className="space-y-1">
              <Label>Telefone de Contato</Label>
              <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="(88) 99999-9999" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>WhatsApp (numero completo com DDD)</Label>
            <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5588999999999" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>URL Facebook</Label>
            <Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1">
            <Label>URL Instagram</Label>
            <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Meta Title</Label>
            <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Titulo da pagina para buscadores" maxLength={60} />
            <p className="text-xs text-muted-foreground">{metaTitle.length}/60 caracteres</p>
          </div>
          <div className="space-y-1">
            <Label>Meta Description</Label>
            <Textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Descricao para buscadores..." rows={3} maxLength={160} />
            <p className="text-xs text-muted-foreground">{metaDesc.length}/160 caracteres</p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() =>
          onSave({
            general_settings: {
              currency,
              language,
              timezone,
              contact_email: contactEmail || undefined,
              contact_phone: contactPhone || undefined,
              whatsapp_number: whatsapp || undefined,
              facebook_url: facebook || undefined,
              instagram_url: instagram || undefined,
              meta_title: metaTitle || undefined,
              meta_description: metaDesc || undefined
            }
          })
        }
        disabled={saving}
        className="w-full"
      >
        {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
        Salvar Geral
      </Button>
    </div>
  )
}

// ============================================================
// ABA VITRINE
// ============================================================
function VitrineTab({
  settings,
  onSave,
  saving
}: {
  settings: StoreSettings & {
    subheader_features?: { icon: string; title: string; description: string }[]
    instagram_handle?: string
    instagram_url?: string
    instagram_photos?: { url: string; alt?: string }[]
    newsletter_title?: string
    newsletter_description?: string
    footer_about?: string
    footer_whatsapp?: string
    footer_email?: string
    footer_address?: string
    footer_hours?: string
    footer_facebook_url?: string
    footer_copyright?: string
  }
  onSave: (partial: Partial<any>) => Promise<void>
  saving: boolean
}) {
  const [features, setFeatures] = useState<{ icon: string; title: string; description: string }[]>(
    settings.subheader_features || [
      { icon: 'CreditCard',  title: 'Formas de Pagamento',    description: 'Cartão, PIX, Dinheiro e Transferência.' },
      { icon: 'ShieldCheck', title: 'Ambiente Higienizado',   description: 'Seguimos todas as normas de higiene e segurança.' },
      { icon: 'Package',     title: 'Embalagem Segura',       description: 'Embalagens resistentes que garantem qualidade.' },
      { icon: 'Headphones',  title: 'Atendimento Humanizado', description: 'Estamos sempre prontos para te atender!' },
    ]
  )

  const [igHandle, setIgHandle]   = useState(settings.instagram_handle || '@frangofortecanoa')
  const [igUrl, setIgUrl]         = useState(settings.instagram_url    || 'https://instagram.com/frangofortecanoa')
  const [igPhotos, setIgPhotos]   = useState<{ url: string; alt?: string }[]>(settings.instagram_photos || [])
  const [newPhotoUrl, setNewPhotoUrl] = useState('')

  const [newsletterTitle, setNewsletterTitle]   = useState(settings.newsletter_title       || 'RECEBA NOSSAS OFERTAS')
  const [newsletterDesc,  setNewsletterDesc]    = useState(settings.newsletter_description || 'Cadastre-se e receba ofertas exclusivas no seu e-mail!')

  const [footerAbout,    setFooterAbout]    = useState(settings.footer_about     || '')
  const [footerWhatsapp, setFooterWhatsapp] = useState(settings.footer_whatsapp  || '')
  const [footerEmail,    setFooterEmail]    = useState(settings.footer_email     || '')
  const [footerAddress,  setFooterAddress]  = useState(settings.footer_address   || '')
  const [footerHours,    setFooterHours]    = useState(settings.footer_hours     || 'Seg a Sáb: 06h às 18h | Dom: 06h às 12h')
  const [footerFb,       setFooterFb]       = useState(settings.footer_facebook_url || '')
  const [footerCopy,     setFooterCopy]     = useState(settings.footer_copyright || '')

  const ICON_OPTIONS = ['CreditCard','ShieldCheck','Package','Headphones','Truck','Star','Clock','Leaf']

  function updateFeature(index: number, field: string, value: string) {
    setFeatures(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
  }

  function addPhoto() {
    if (!newPhotoUrl.trim()) return
    setIgPhotos(prev => [...prev, { url: newPhotoUrl.trim() }])
    setNewPhotoUrl('')
  }

  function removePhoto(index: number) {
    setIgPhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    await onSave({
      subheader_features:     features,
      instagram_handle:       igHandle,
      instagram_url:          igUrl,
      instagram_photos:       igPhotos,
      newsletter_title:       newsletterTitle,
      newsletter_description: newsletterDesc,
      footer_about:           footerAbout    || undefined,
      footer_whatsapp:        footerWhatsapp || undefined,
      footer_email:           footerEmail    || undefined,
      footer_address:         footerAddress  || undefined,
      footer_hours:           footerHours    || undefined,
      footer_facebook_url:    footerFb       || undefined,
      footer_copyright:       footerCopy     || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Subheader */}
      <Card>
        <CardHeader>
          <CardTitle>Faixa de Diferenciais (Subheader)</CardTitle>
          <CardDescription>4 diferenciais exibidos na faixa vermelha abaixo do header.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {features.map((feature, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-3 p-3 border rounded-lg">
              <div className="space-y-1">
                <Label>Ícone</Label>
                <Select value={feature.icon} onValueChange={v => updateFeature(i, 'icon', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(ico => (
                      <SelectItem key={ico} value={ico}>{ico}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Título</Label>
                <Input value={feature.title} onChange={e => updateFeature(i, 'title', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Input value={feature.description} onChange={e => updateFeature(i, 'description', e.target.value)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Newsletter */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Título</Label>
            <Input value={newsletterTitle} onChange={e => setNewsletterTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input value={newsletterDesc} onChange={e => setNewsletterDesc(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Instagram */}
      <Card>
        <CardHeader>
          <CardTitle>Instagram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Handle (@...)</Label>
              <Input value={igHandle} onChange={e => setIgHandle(e.target.value)} placeholder="@frangofortecanoa" />
            </div>
            <div className="space-y-1">
              <Label>URL do Perfil</Label>
              <Input value={igUrl} onChange={e => setIgUrl(e.target.value)} placeholder="https://instagram.com/..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fotos do Instagram (URLs)</Label>
            <div className="flex gap-2">
              <Input
                value={newPhotoUrl}
                onChange={e => setNewPhotoUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
              />
              <Button type="button" variant="outline" onClick={addPhoto} className="gap-1">
                <Plus className="w-4 h-4" /> Adicionar
              </Button>
            </div>
            {igPhotos.length > 0 && (
              <div className="space-y-2 mt-2">
                {igPhotos.map((photo, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                    <span className="flex-1 text-xs text-muted-foreground truncate">{photo.url}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removePhoto(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Rodapé (Footer)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Texto de apresentação</Label>
            <Textarea value={footerAbout} onChange={e => setFooterAbout(e.target.value)} rows={2} placeholder="Breve descrição da loja..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>WhatsApp (somente números)</Label>
              <Input value={footerWhatsapp} onChange={e => setFooterWhatsapp(e.target.value)} placeholder="5588996125274" />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input type="email" value={footerEmail} onChange={e => setFooterEmail(e.target.value)} placeholder="contato@..." />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Endereço</Label>
            <Input value={footerAddress} onChange={e => setFooterAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
          </div>
          <div className="space-y-1">
            <Label>Horário de funcionamento</Label>
            <Input value={footerHours} onChange={e => setFooterHours(e.target.value)} placeholder="Seg a Sáb: 06h às 18h | Dom: 06h às 12h" />
            <p className="text-xs text-muted-foreground">Use | para separar linha 1 e linha 2.</p>
          </div>
          <div className="space-y-1">
            <Label>URL Facebook</Label>
            <Input value={footerFb} onChange={e => setFooterFb(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1">
            <Label>Copyright</Label>
            <Input value={footerCopy} onChange={e => setFooterCopy(e.target.value)} placeholder={`${new Date().getFullYear()} Frango Forte Canoa. Todos os direitos reservados.`} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
        Salvar Vitrine
      </Button>
    </div>
  )
}
