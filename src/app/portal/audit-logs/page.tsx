'use client'

import AdminLayout from '@/components/admin-layout'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Download, Search, Filter, Calendar, AlertCircle, Activity } from 'lucide-react'
import { toast } from 'sonner'

interface AuditLog {
  _id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  userEmail: string
  changes?: any
  timestamp: string
  ipAddress: string
}

interface AuditLogsResponse {
  logs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchAuditLogs()
  }, [currentPage, searchTerm, entityFilter, actionFilter, dateFilter])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(entityFilter !== 'all' && { entityType: entityFilter }),
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(dateFilter !== 'all' && { dateRange: dateFilter }),
      })

      const response = await fetch(`/api/v1/audit-logs?${params}`)
      if (response.ok) {
        const data: AuditLogsResponse = await response.json()
        setLogs(data.logs)
      } else {
        setError('Fehler beim Laden der Audit-Logs')
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      setError('Fehler beim Laden der Audit-Logs')
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    const actionConfig = {
      CREATE: { label: 'Erstellt', className: 'bg-green-100 text-green-800' },
      UPDATE: { label: 'Aktualisiert', className: 'bg-blue-100 text-blue-800' },
      DELETE: { label: 'Gelöscht', className: 'bg-red-100 text-red-800' },
      LOGIN: { label: 'Anmeldung', className: 'bg-purple-100 text-purple-800' },
      LOGOUT: { label: 'Abmeldung', className: 'bg-gray-100 text-gray-800' },
      EXPORT: { label: 'Export', className: 'bg-orange-100 text-orange-800' },
      IMPORT: { label: 'Import', className: 'bg-indigo-100 text-indigo-800' }
    }
    
    const config = actionConfig[action as keyof typeof actionConfig] || actionConfig.UPDATE
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getEntityBadge = (entityType: string) => {
    const entityConfig = {
      USER: { label: 'Benutzer', className: 'bg-blue-100 text-blue-800' },
      CUSTOMER: { label: 'Kunde', className: 'bg-green-100 text-green-800' },
      PROJECT: { label: 'Projekt', className: 'bg-purple-100 text-purple-800' },
      TASK: { label: 'Aufgabe', className: 'bg-orange-100 text-orange-800' },
      TICKET: { label: 'Ticket', className: 'bg-red-100 text-red-800' },
      COMMENT: { label: 'Kommentar', className: 'bg-yellow-100 text-yellow-800' },
      QUOTE: { label: 'Angebot', className: 'bg-indigo-100 text-indigo-800' }
    }
    
    const config = entityConfig[entityType as keyof typeof entityConfig] || entityConfig.USER
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'gerade eben'
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Min`
    if (diffInMinutes < 1440) return `vor ${Math.floor(diffInMinutes / 60)} Std`
    return `vor ${Math.floor(diffInMinutes / 1440)} Tag${Math.floor(diffInMinutes / 1440) > 1 ? 'en' : ''}`
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/v1/audit-logs/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Audit-Logs erfolgreich exportiert!')
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Failed to export audit logs:', error)
      toast.error('Fehler beim Exportieren der Audit-Logs')
    }
  }

  const getActionDescription = (log: AuditLog) => {
    const entityName = getEntityBadge(log.entityType).props.children
    const actionName = getActionBadge(log.action).props.children
    
    switch (log.action) {
      case 'CREATE':
        return `${actionName}: Neuer ${entityName} wurde erstellt`
      case 'UPDATE':
        return `${actionName}: ${entityName} wurde aktualisiert`
      case 'DELETE':
        return `${actionName}: ${entityName} wurde gelöscht`
      default:
        return `${actionName}: ${entityName} Aktion`
    }
  }

  if (loading && logs.length === 0) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fehler beim Laden der Audit-Logs</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAuditLogs}>Erneut versuchen</Button>
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
            <h1 className="text-3xl font-bold tracking-tight">Audit-Logs</h1>
            <p className="text-muted-foreground">
              Überwachen Sie alle Benutzeraktivitäten und Systemereignisse.
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter & Suche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Suche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Benutzer, Aktion, Entität..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Entität</label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="USER">Benutzer</SelectItem>
                    <SelectItem value="CUSTOMER">Kunde</SelectItem>
                    <SelectItem value="PROJECT">Projekt</SelectItem>
                    <SelectItem value="TASK">Aufgabe</SelectItem>
                    <SelectItem value="TICKET">Ticket</SelectItem>
                    <SelectItem value="COMMENT">Kommentar</SelectItem>
                    <SelectItem value="QUOTE">Angebot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Aktion</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="CREATE">Erstellt</SelectItem>
                    <SelectItem value="UPDATE">Aktualisiert</SelectItem>
                    <SelectItem value="DELETE">Gelöscht</SelectItem>
                    <SelectItem value="LOGIN">Anmeldung</SelectItem>
                    <SelectItem value="LOGOUT">Abmeldung</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                    <SelectItem value="IMPORT">Import</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Zeitraum</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="today">Heute</SelectItem>
                    <SelectItem value="week">Diese Woche</SelectItem>
                    <SelectItem value="month">Dieser Monat</SelectItem>
                    <SelectItem value="year">Dieses Jahr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Audit-Logs ({logs.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Audit-Logs vorhanden</h3>
                <p className="text-muted-foreground">
                  {searchTerm || entityFilter !== 'all' || actionFilter !== 'all' || dateFilter !== 'all'
                    ? 'Keine Logs entsprechen den aktuellen Filtern.'
                    : 'Es wurden noch keine Aktivitäten protokolliert.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log._id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">{log.userEmail}</h3>
                        {getActionBadge(log.action)}
                        {getEntityBadge(log.entityType)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {getActionDescription(log)}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(log.timestamp)}
                        </span>
                        <span>•</span>
                        <span>{getRelativeTime(log.timestamp)}</span>
                        <span>•</span>
                        <span>IP: {log.ipAddress}</span>
                        {log.entityId && (
                          <>
                            <span>•</span>
                            <span>ID: {log.entityId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heute</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => {
                  const logDate = new Date(log.timestamp)
                  const today = new Date()
                  return logDate.toDateString() === today.toDateString()
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Aktivitäten heute
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erstellt</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => log.action === 'CREATE').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Neue Einträge
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktualisiert</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => log.action === 'UPDATE').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Änderungen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gelöscht</CardTitle>
              <Activity className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => log.action === 'DELETE').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Löschungen
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}