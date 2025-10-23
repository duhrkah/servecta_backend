'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FolderKanban,
  Ticket,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Server,
  Database,
  Calendar,
  Info,
  XCircle,
  Shield as ShieldIcon,
  CheckSquare,
  Plus,
  Eye,
  RefreshCw,
  Settings
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface CustomerDashboardStats {
  stats: {
    customers: {
      total: number
      active: number
    }
    projects: {
      total: number
      active: number
      completed: number
    }
    tasks: {
      total: number
      completed: number
      overdue: number
    }
    tickets: {
      total: number
      open: number
      urgent: number
    }
  }
  recentItems: {
    customers: any[]
    projects: any[]
    tasks: any[]
    tickets: any[]
  }
  userRole: string
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<CustomerDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/customer-dashboard')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          toast.error('Fehler beim Laden der Dashboard-Daten.')
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        toast.error('Fehler beim Laden der Dashboard-Daten.')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchStats()
      const interval = setInterval(fetchStats, 300000); // Refresh every 5 minutes
      return () => clearInterval(interval);
    }
  }, [session])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'gerade eben'
    if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Min.`
    if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)} Std.`
    if (diffInSeconds < 2592000) return `vor ${Math.floor(diffInSeconds / 86400)} Tagen`
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      USER: { label: 'Benutzer', className: 'bg-green-100 text-green-800' },
      MANAGER: { label: 'Manager', className: 'bg-blue-100 text-blue-800' },
      ADMIN: { label: 'Administrator', className: 'bg-red-100 text-red-800' }
    }
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.USER
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getQuickActions = (userRole: string) => {
    const baseActions = [
      { name: 'Neues Ticket', href: '/portal/tickets/new', icon: Plus, roles: ['MITARBEITER', 'MANAGER', 'ADMIN', 'KUNDE'] },
      { name: 'Projekte anzeigen', href: '/portal/projects', icon: Eye, roles: ['MITARBEITER', 'MANAGER', 'ADMIN', 'KUNDE'] },
      { name: 'Aufgaben anzeigen', href: '/portal/tasks', icon: Eye, roles: ['MITARBEITER', 'MANAGER', 'ADMIN', 'KUNDE'] },
    ]

    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
      baseActions.push(
        { name: 'Neuer Kunde', href: '/portal/customers/new', icon: Plus, roles: ['MANAGER', 'ADMIN'] },
        { name: 'Neues Projekt', href: '/portal/projects/new', icon: Plus, roles: ['MANAGER', 'ADMIN'] },
        { name: 'Neue Aufgabe', href: '/portal/tasks/new', icon: Plus, roles: ['MANAGER', 'ADMIN'] }
      )
    }

    if (userRole === 'ADMIN') {
      baseActions.push(
        { name: 'Neuer Mitarbeiter', href: '/portal/users/new', icon: Plus, roles: ['ADMIN'] },
        { name: 'System-Status', href: '/portal/system', icon: Server, roles: ['ADMIN'] },
        { name: 'Einstellungen', href: '/portal/settings', icon: Settings, roles: ['ADMIN'] }
      )
    }

    return baseActions.filter(action => action.roles.includes(userRole))
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4"><Skeleton className="h-[300px] w-full" /></Card>
            <Card className="col-span-3"><Skeleton className="h-[300px] w-full" /></Card>
          </div>
          <Card><Skeleton className="h-40 w-full" /></Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card><Skeleton className="h-32 w-full" /></Card>
            <Card><Skeleton className="h-32 w-full" /></Card>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fehler beim Laden der Dashboard-Daten</h2>
          <p className="text-muted-foreground mb-4">
            Die Dashboard-Daten konnten nicht geladen werden.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Seite neu laden
          </Button>
        </div>
      </AdminLayout>
    )
  }

  const quickActions = getQuickActions(stats.userRole)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Willkommen zurück, {session?.user?.name}! {getRoleBadge(stats.userRole)}
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Kunden
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.customers.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.stats.customers.active} aktiv
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Projekte
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.projects.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.stats.projects.active} aktiv, {stats.stats.projects.completed} abgeschlossen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aufgaben
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.tasks.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.stats.tasks.completed} abgeschlossen, {stats.stats.tasks.overdue} überfällig
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tickets
              </CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.tickets.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.stats.tickets.open} offen, {stats.stats.tickets.urgent} dringend
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>
              Häufig verwendete Aktionen basierend auf Ihren Berechtigungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <action.icon className="h-6 w-6" />
                    <span className="text-sm text-center">{action.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Items */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Recent Customers */}
          {stats.userRole === 'MANAGER' || stats.userRole === 'ADMIN' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Neueste Kunden
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentItems.customers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Kunden vorhanden</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentItems.customers.map((customer) => (
                      <div key={customer._id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{customer.legalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(customer.createdAt)}
                          </p>
                        </div>
                        <Badge variant={customer.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {customer.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderKanban className="h-5 w-5 mr-2" />
                Neueste Projekte
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentItems.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Projekte vorhanden</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentItems.projects.map((project) => (
                    <div key={project._id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(project.createdAt)}
                        </p>
                      </div>
                      <Badge variant={
                        project.status === 'ACTIVE' ? 'default' :
                        project.status === 'COMPLETED' ? 'secondary' : 'outline'
                      }>
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                Neueste Aufgaben
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentItems.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Aufgaben vorhanden</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentItems.tasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(task.createdAt)}
                        </p>
                      </div>
                      <Badge variant={
                        task.status === 'COMPLETED' ? 'default' :
                        task.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                      }>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ticket className="h-5 w-5 mr-2" />
                Neueste Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentItems.tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Tickets vorhanden</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentItems.tickets.map((ticket) => (
                    <div key={ticket._id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <Badge variant={
                        ticket.priority === 'URGENT' ? 'destructive' :
                        ticket.priority === 'HIGH' ? 'default' :
                        ticket.priority === 'MEDIUM' ? 'secondary' : 'outline'
                      }>
                        {ticket.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
