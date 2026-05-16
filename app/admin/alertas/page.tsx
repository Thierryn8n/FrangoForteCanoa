'use client'

import { useState, useEffect } from 'react'
import { getAlerts, markAlertAsRead, resolveAlert, getAlertsSummary } from '@/lib/actions/stock'
import { AlertTriangle, CheckCircle, XCircle, Info, Bell, DollarSign, Calendar, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AlertsPage() {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>([])
  const [costAlerts, setCostAlerts] = useState<any[]>([])
  const [alertsSummary, setAlertsSummary] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [systemAlerts, costAlertsData, summary] = await Promise.all([
          getAlerts(false),
          getAlertsSummary(),
          getAlertsSummary()
        ])
        setAlerts(systemAlerts || [])
        setCostAlerts(summary?.alerts || [])
        setAlertsSummary(summary)
      } catch (error) {
        console.error('Error fetching alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
      case 'due_soon':
        return <Calendar className="w-5 h-5" />
      case 'overdue':
        return <AlertTriangle className="w-5 h-5" />
      case 'recurring_payment':
        return <DollarSign className="w-5 h-5" />
      case 'cost_increase':
        return <TrendingUp className="w-5 h-5" />
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
  const totalAlerts = unreadCount + (costAlerts?.length || 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alertas e Notificações</h1>
          <p className="text-muted-foreground mt-1">
            {totalAlerts > 0 ? `${totalAlerts} alerta(s) ativo(s)` : 'Nenhum alerta ativo'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">Alertas ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {(alerts?.filter((a: any) => a.severity === 'critical').length || 0) + 
               (costAlerts?.filter((a: any) => a.severity === 'high').length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Operacionais</CardTitle>
            <DollarSign className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{costAlerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Alertas financeiros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidos</CardTitle>
            <Info className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Alerts */}
      {costAlerts && costAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              Alertas de Custos Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costAlerts.map((alert, index) => (
                <div key={`cost-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)} text-white`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    {alert.cost && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(alert.cost.amount))}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)} text-white`}>
                    {getSeverityLabel(alert.severity)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {!alerts || alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum alerta do sistema encontrado</p>
            </div>
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
                                await markAlertAsRead(alert.id)
                                const updated = await getAlerts(false)
                                setAlerts(updated || [])
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
                                await resolveAlert(alert.id)
                                const updated = await getAlerts(false)
                                setAlerts(updated || [])
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
        </CardContent>
      </Card>
    </div>
  )
}
