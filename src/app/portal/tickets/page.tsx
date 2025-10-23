'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Tag,
  Eye,
  Trash2,
  ArrowUpDown
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog'

interface Ticket {
  _id: string
  title: string
  description: string
  status: string
  priority: string
  type: string
  departments?: ('IT' | 'DATENSCHUTZ')[]
  assigneeId?: string
  assigneeName?: string
  assignee?: {
    _id: string
    name: string
    email: string
  }
  reporterId?: string
  reporterName?: string
  reporter?: {
    _id: string
    name: string
    email: string
  }
  dueDate?: string
  createdAt: string
  updatedAt: string
  tags: string[]
  _count: {
    comments: number
  }
}

interface User {
  _id: string
  name: string
  email: string
  role: string
  status: string
}

interface TicketsResponse {
  tickets: Ticket[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: '',
    assignee: ''
  })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(search && { search }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.priority && filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.assignee && filters.assignee !== 'all' && { assignee: filters.assignee }),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/v1/tickets-mongodb?${params}`)
      if (response.ok) {
        const data: TicketsResponse = await response.json()
        setTickets(data.tickets)
      } else {
        setError('Fehler beim Laden der Tickets')
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      setError('Fehler beim Laden der Tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/v1/users-mongodb')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  useEffect(() => {
    fetchTickets()
    fetchUsers()
  }, [search, filters, sortBy, sortOrder])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Offen</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">In Bearbeitung</Badge>
      case 'RESOLVED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Gelöst</Badge>
      case 'CLOSED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Geschlossen</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Storniert</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Badge variant="outline" className="border-green-500 text-green-600">Niedrig</Badge>
      case 'MEDIUM':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Mittel</Badge>
      case 'HIGH':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Hoch</Badge>
      case 'URGENT':
        return <Badge variant="destructive">Dringend</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BUG':
        return <Badge variant="destructive">Bug</Badge>
      case 'FEATURE':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Feature</Badge>
      case 'SUPPORT':
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Support</Badge>
      case 'TASK':
        return <Badge variant="secondary">Aufgabe</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const getDepartmentBadge = (departments?: string[]) => {
    const departmentConfig = {
      IT: { label: 'IT', className: 'bg-blue-100 text-blue-800' },
      DATENSCHUTZ: { label: 'Datenschutz', className: 'bg-purple-100 text-purple-800' }
    }
    
    // Fallback für alte Daten oder undefined
    const departmentsArray = Array.isArray(departments) ? departments : []
    
    return (
      <div className="flex gap-1 flex-wrap">
        {departmentsArray.map((department) => {
          const config = departmentConfig[department as keyof typeof departmentConfig]
          return config ? (
            <Badge key={department} variant="secondary" className={config.className}>
              {config.label}
            </Badge>
          ) : null
        })}
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Ticket className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht festgelegt'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleDeleteTicket = async (ticket: Ticket) => {
    try {
      const response = await fetch(`/api/v1/tickets-mongodb/${ticket._id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete ticket')
      }

      setTickets(tickets.filter(t => t._id !== ticket._id))
      setShowDeleteDialog(false)
      setTicketToDelete(null)
      toast.success('Ticket erfolgreich gelöscht!')
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      toast.error('Fehler beim Löschen des Tickets')
    }
  }

  const groupTicketsByStatus = () => {
    const groups = {
      OPEN: [] as Ticket[],
      IN_PROGRESS: [] as Ticket[],
      RESOLVED: [] as Ticket[],
      CLOSED: [] as Ticket[],
      CANCELLED: [] as Ticket[]
    }

    tickets.forEach(ticket => {
      if (groups[ticket.status as keyof typeof groups]) {
        groups[ticket.status as keyof typeof groups].push(ticket)
      }
    })

    return groups
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Offen'
      case 'IN_PROGRESS': return 'In Bearbeitung'
      case 'RESOLVED': return 'Gelöst'
      case 'CLOSED': return 'Geschlossen'
      case 'CANCELLED': return 'Storniert'
      default: return status
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
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
          <h2 className="text-xl font-semibold mb-2">Fehler beim Laden der Tickets</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchTickets}>Erneut versuchen</Button>
        </div>
      </AdminLayout>
    )
  }

  const ticketGroups = groupTicketsByStatus()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Support-Tickets und deren Bearbeitung.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
              >
                Liste
              </Button>
              <Button
                variant={view === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('kanban')}
              >
                Kanban
              </Button>
            </div>
            <Button className="bg-accent-blue hover:bg-accent-blue/90" asChild>
              <Link href="/portal/tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                Neues Ticket
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Tickets suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="OPEN">Offen</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
                  <SelectItem value="RESOLVED">Gelöst</SelectItem>
                  <SelectItem value="CLOSED">Geschlossen</SelectItem>
                  <SelectItem value="CANCELLED">Storniert</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priorität" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  <SelectItem value="LOW">Niedrig</SelectItem>
                  <SelectItem value="MEDIUM">Mittel</SelectItem>
                  <SelectItem value="HIGH">Hoch</SelectItem>
                  <SelectItem value="URGENT">Dringend</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="BUG">Bug</SelectItem>
                  <SelectItem value="FEATURE">Feature</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="TASK">Aufgabe</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.assignee} onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Zugewiesen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Content */}
        {view === 'list' ? (
          /* List View */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Alle Tickets</CardTitle>
                  <CardDescription>
                    {tickets.length} Tickets gefunden
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Erstellt</SelectItem>
                      <SelectItem value="updatedAt">Aktualisiert</SelectItem>
                      <SelectItem value="dueDate">Fälligkeitsdatum</SelectItem>
                      <SelectItem value="priority">Priorität</SelectItem>
                      <SelectItem value="title">Titel</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => {
                    const daysUntilDue = getDaysUntilDue(ticket.dueDate)
                    return (
                      <div
                        key={ticket._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Ticket className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{ticket.title}</h3>
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                              {getTypeBadge(ticket.type)}
                              {getDepartmentBadge(ticket.departments)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {ticket.assigneeName || 'Nicht zugewiesen'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {ticket.reporterName || 'Unbekannt'}
                              </span>
                              {ticket.dueDate && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {daysUntilDue && daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} Tage überfällig` :
                                     daysUntilDue && daysUntilDue === 0 ? 'Heute fällig' :
                                     daysUntilDue ? `in ${daysUntilDue} Tagen` : formatDate(ticket.dueDate)}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {ticket._count?.comments || 0} Kommentare
                              </span>
                              <span>•</span>
                              <span>Erstellt: {formatDate(ticket.createdAt)}</span>
                              {ticket.tags && ticket.tags.length > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center space-x-1">
                                    <Tag className="h-3 w-3" />
                                    {ticket.tags.slice(0, 2).map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {ticket.tags.length > 2 && (
                                      <span className="text-xs">+{ticket.tags.length - 2}</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/portal/tickets/${ticket._id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setTicketToDelete(ticket)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Keine Tickets gefunden</h3>
                    <p className="text-muted-foreground mb-4">
                      {search || Object.values(filters).some(f => f) 
                        ? 'Versuchen Sie andere Suchbegriffe oder Filter.' 
                        : 'Erstellen Sie Ihr erstes Ticket.'}
                    </p>
                    {!search && !Object.values(filters).some(f => f) && (
                      <Button asChild>
                        <Link href="/portal/tickets/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Erstes Ticket erstellen
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Kanban View */
          <div className="grid gap-6 md:grid-cols-5">
            {Object.entries(ticketGroups).map(([status, statusTickets]) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <CardTitle className="text-sm font-medium">
                      {getStatusLabel(status)}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {statusTickets.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusTickets.map((ticket) => {
                    const daysUntilDue = getDaysUntilDue(ticket.dueDate)
                    return (
                      <div
                        key={ticket._id}
                        className="p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/portal/tickets/${ticket._id}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">{ticket.title}</h4>
                            <div className="flex items-center space-x-1">
                              {getPriorityBadge(ticket.priority)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTypeBadge(ticket.type)}
                          </div>
                          {ticket.assignee && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <User className="h-3 w-3 mr-1" />
                              {ticket.assignee.name}
                            </div>
                          )}
                          {ticket.dueDate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {daysUntilDue && daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} Tage überfällig` :
                               daysUntilDue && daysUntilDue === 0 ? 'Heute fällig' :
                               daysUntilDue ? `in ${daysUntilDue} Tagen` : formatDate(ticket.dueDate)}
                            </div>
                          )}
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{ticket._count?.comments || 0} Kommentare</span>
                            <span>{formatDate(ticket.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {statusTickets.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Keine Tickets
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offene Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter(t => t.status === 'OPEN').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Benötigen Aufmerksamkeit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter(t => t.status === 'IN_PROGRESS').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Aktive Bearbeitung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gelöst</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter(t => t.status === 'RESOLVED').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Warten auf Bestätigung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durchschnittliche Bearbeitungszeit</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.length > 0 ? Math.round(tickets.reduce((sum, t) => {
                  const created = new Date(t.createdAt)
                  const updated = new Date(t.updatedAt)
                  return sum + Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
                }, 0) / tickets.length) : 0} Tage
              </div>
              <p className="text-xs text-muted-foreground">
                Durchschnittliche Bearbeitungszeit
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setTicketToDelete(null)
        }}
        onConfirm={async () => {
          if (ticketToDelete) {
            await handleDeleteTicket(ticketToDelete)
          }
        }}
        title="Ticket löschen"
        description={`Sind Sie sicher, dass Sie das Ticket "${ticketToDelete?.title}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`}
        entityName={ticketToDelete?.title || 'Ticket'}
        entityType="task"
      />
    </AdminLayout>
  )
}