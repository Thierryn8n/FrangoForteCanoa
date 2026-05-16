import { createClient } from '@/lib/supabase/server'
import { getAlerts, markAlertAsRead, resolveAlert } from '@/lib/actions/stock'
import { AlertTriangle, CheckCircle, XCircle, Info, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AlertsPage() {
  const supabase = await createClient()
  const alerts = await getAlerts(false)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Crítico'
      case 'high':
        return 'Alto'
      case 'medium':
        return 'Médio'
      case 'low':
        return 'Baixo'
      default:
        return 'Desconhecido'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle className="w-5 h-5" />
      case 'out_of_stock':
        return <XCircle className="w-5 h-5" />
      case 'price_change':
        return <Info className="w-5 h-5" />
      case 'loss':
        return <XCircle className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const unreadCount = alerts?.filter((a: any) => !a.is_read).length || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alertas e Notificações</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} alerta(s) não lido(s)` : 'Todos os alertas foram lidos'}
          </p>
        </div>
        <Button 
          onClick={async () => {
            'use server'
            const unreadAlerts = alerts?.filter((a: any) => !a.is_read) || []
            for (const alert of unreadAlerts) {
              await markAlertAsRead(alert.id)
            }
          }}
          disabled={unreadCount === 0}
          className="bg-primary hover:bg-primary/90"
        >
          Marcar todos como lidos
        </Button>
      </div>

      {/* Alerts List */}
      {!alerts || alerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum alerta encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert: any) => (
            <Card key={alert.id} className={!alert.is_read ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getSeverityColor(alert.severity)} text-white`}>
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <p className="text-muted-foreground mt-1">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(alert.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)} text-white`}>
                          {getSeverityLabel(alert.severity)}
                        </span>
                        {alert.is_resolved && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            Resolvido
                          </span>
                        )}
                      </div>
                    </div>
                    {!alert.is_resolved && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={async () => {
                            'use server'
                            await markAlertAsRead(alert.id)
                          }}
                          variant="outline"
                          size="sm"
                          disabled={alert.is_read}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {alert.is_read ? 'Lido' : 'Marcar como lido'}
                        </Button>
                        <Button
                          onClick={async () => {
                            'use server'
                            await resolveAlert(alert.id)
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolver
                        </Button>
                      </div>
                    )}
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
