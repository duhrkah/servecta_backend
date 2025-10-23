'use client'

import AdminLayout from '@/components/admin-layout'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Activity, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  FolderKanban,
  Ticket,
  CheckSquare
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemStatus {
  status: string
  uptime: string
  version: string
  lastBackup: string
  diskUsage: {
    used: number
    total: number
    percentage: number
  }
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  cpuUsage: number
  activeConnections: number
  databaseStats: {
    totalDocuments: number
    collections: number
    indexes: number
  }
  applicationStats: {
    users: number
    customers: number
    projects: number
    tasks: number
    tickets: number
  }
}

export default function SystemPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'UNKNOWN',
    uptime: '0d 0h 0m',
    version: '1.0.0',
    lastBackup: new Date().toISOString(),
    diskUsage: {
      used: 0,
      total: 0,
      percentage: 0
    },
    memoryUsage: {
      used: 0,
      total: 0,
      percentage: 0
    },
    cpuUsage: 0,
    activeConnections: 0,
    databaseStats: {
      totalDocuments: 0,
      collections: 0,
      indexes: 0
    },
    applicationStats: {
      users: 0,
      customers: 0,
      projects: 0,
      tasks: 0,
      tickets: 0
    }
  })

  useEffect(() => {
    fetchSystemStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSystemStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/v1/system/status')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      } else {
        throw new Error('Failed to fetch system status')
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error)
      setError('Fehler beim Laden der System-Informationen')
      
      // Fallback to mock data if API fails
      setSystemStatus({
        status: 'HEALTHY',
        uptime: '5d 12h 30m',
        version: '1.0.0',
        lastBackup: new Date().toISOString(),
        diskUsage: {
          used: 45.2,
          total: 100,
          percentage: 45.2
        },
        memoryUsage: {
          used: 2.1,
          total: 8,
          percentage: 26.25
        },
        cpuUsage: 15.5,
        activeConnections: 12,
        databaseStats: {
          totalDocuments: 1250,
          collections: 12,
          indexes: 25
        },
        applicationStats: {
          users: 15,
          customers: 45,
          projects: 23,
          tasks: 156,
          tickets: 8
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchSystemStatus()
      toast.success('System-Status aktualisiert!')
    } catch (error) {
      console.error('Failed to refresh system status:', error)
      toast.error('Fehler beim Aktualisieren des System-Status')
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      HEALTHY: { label: 'Gesund', className: 'bg-green-100 text-green-800' },
      WARNING: { label: 'Warnung', className: 'bg-yellow-100 text-yellow-800' },
      CRITICAL: { label: 'Kritisch', className: 'bg-red-100 text-red-800' },
      UNKNOWN: { label: 'Unbekannt', className: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UNKNOWN
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUsageColor = (percentage: number) => {
    if (percentage > 80) return 'bg-red-500'
    if (percentage > 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (loading && !error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">System-Status nicht verfügbar</h2>
          <p className="text-muted-foreground mb-4">
            Es werden Fallback-Daten angezeigt. {error}
          </p>
          <Button onClick={handleRefresh}>Erneut versuchen</Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System-Status</h1>
            <p className="text-muted-foreground">
              Überwachen Sie den System-Status und die Ressourcennutzung
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Aktualisieren...' : 'Aktualisieren'}
          </Button>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System-Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusBadge(systemStatus.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Version {systemStatus.version}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Betriebszeit</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.uptime}</div>
              <p className="text-xs text-muted-foreground">
                Seit letztem Neustart
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU-Auslastung</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.cpuUsage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Aktuelle Auslastung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Verbindungen</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.activeConnections}</div>
              <p className="text-xs text-muted-foreground">
                Datenbankverbindungen
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resource Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HardDrive className="h-5 w-5 mr-2" />
                Festplattennutzung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verwendet</span>
                  <span className="text-sm text-muted-foreground">
                    {formatBytes(systemStatus.diskUsage.used * 1024 * 1024 * 1024)} / {formatBytes(systemStatus.diskUsage.total * 1024 * 1024 * 1024)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(systemStatus.diskUsage.percentage)}`}
                    style={{ width: `${systemStatus.diskUsage.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.diskUsage.percentage.toFixed(1)}% verwendet
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="h-5 w-5 mr-2" />
                Arbeitsspeicher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verwendet</span>
                  <span className="text-sm text-muted-foreground">
                    {systemStatus.memoryUsage.used.toFixed(1)} GB / {systemStatus.memoryUsage.total} GB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(systemStatus.memoryUsage.percentage)}`}
                    style={{ width: `${systemStatus.memoryUsage.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.memoryUsage.percentage.toFixed(1)}% verwendet
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Datenbank-Statistiken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {systemStatus.databaseStats.totalDocuments.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Gesamte Dokumente</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {systemStatus.databaseStats.collections}
                </div>
                <p className="text-sm text-muted-foreground">Sammlungen</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {systemStatus.databaseStats.indexes}
                </div>
                <p className="text-sm text-muted-foreground">Indizes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Anwendungs-Statistiken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{systemStatus.applicationStats.users}</div>
                <p className="text-sm text-muted-foreground">Benutzer</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{systemStatus.applicationStats.customers}</div>
                <p className="text-sm text-muted-foreground">Kunden</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FolderKanban className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">{systemStatus.applicationStats.projects}</div>
                <p className="text-sm text-muted-foreground">Projekte</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckSquare className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-2xl font-bold">{systemStatus.applicationStats.tasks}</div>
                <p className="text-sm text-muted-foreground">Aufgaben</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Ticket className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-2xl font-bold">{systemStatus.applicationStats.tickets}</div>
                <p className="text-sm text-muted-foreground">Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System-Informationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Version</span>
                  <p className="font-medium">{systemStatus.version}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Betriebszeit</span>
                  <p className="font-medium">{systemStatus.uptime}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <div className="mt-1">
                    {getStatusBadge(systemStatus.status)}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Letztes Backup</span>
                  <p className="font-medium">{formatDate(systemStatus.lastBackup)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Aktive Verbindungen</span>
                  <p className="font-medium">{systemStatus.activeConnections}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">CPU-Auslastung</span>
                  <p className="font-medium">{systemStatus.cpuUsage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}