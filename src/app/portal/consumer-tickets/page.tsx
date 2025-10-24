'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Ticket,
  Search,
  Filter,
  Plus,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Pause,
  X,
  Flag,
  Eye,
  MessageSquare
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Ticket {
  _id: string
  title: string
  description?: string
  status: string
  priority: string
  type: string
  dueDate?: string
  createdAt: string
  updatedAt: string
  assignee?: {
    _id: string
    name: string
    email: string
  }
  reporter?: {
    _id: string
    name: string
    email: string
  }
  _count: {
    comments: number
  }
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

export default function ConsumerTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: ''
  })

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.type && { type: filters.type })
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

  useEffect(() => {
    fetchTickets()
  }, [search, filters])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Offen</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Bearbeitung</Badge>
      case 'RESOLVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Gelöst</Badge>
      case 'CLOSED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Geschlossen</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Abgebrochen</Badge>
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
        return <Badge variant="destructive">Fehler</Badge>
      case 'FEATURE':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Feature</Badge>
      case 'SUPPORT':
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Support</Badge>
      case 'TASK':
        return <Badge variant="outline">Aufgabe</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht festgelegt'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Meine Tickets</h1>
              <p className="text-muted-foreground">Übersicht über alle Ihre Tickets</p>
            </div>
            <Button asChild>
              <Link href="/portal/tickets/new">
                <Plus className="h-4 w-4 mr-2" />
                Neues Ticket
              </Link>
            </Button>
          </div>
          
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Meine Tickets</h1>
              <p className="text-muted-foreground">Übersicht über alle Ihre Tickets</p>
            </div>
            <Button asChild>
              <Link href="/portal/tickets/new">
                <Plus className="h-4 w-4 mr-2" />
                Neues Ticket
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fehler beim Laden</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <button 
                  onClick={fetchTickets}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Erneut versuchen
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meine Tickets</h1>
            <p className="text-muted-foreground">Übersicht über alle Ihre Tickets</p>
          </div>
          <Button asChild>
            <Link href="/portal/tickets/new">
              <Plus className="h-4 w-4 mr-2" />
              Neues Ticket
            </Link>
          </Button>
        </div>

        {/* Such- und Filterbereich */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Suchen und Filtern
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Suche</label>
                <input
                  type="text"
                  placeholder="Ticket suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Status</option>
                  <option value="OPEN">Offen</option>
                  <option value="IN_PROGRESS">In Bearbeitung</option>
                  <option value="RESOLVED">Gelöst</option>
                  <option value="CLOSED">Geschlossen</option>
                  <option value="CANCELLED">Abgebrochen</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Priorität</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Prioritäten</option>
                  <option value="LOW">Niedrig</option>
                  <option value="MEDIUM">Mittel</option>
                  <option value="HIGH">Hoch</option>
                  <option value="URGENT">Dringend</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Typ</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Typen</option>
                  <option value="SUPPORT">Support</option>
                  <option value="BUG">Fehler</option>
                  <option value="FEATURE">Feature</option>
                  <option value="TASK">Aufgabe</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Liste */}
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Tickets gefunden</h3>
                <p className="text-muted-foreground mb-4">
                  {search || filters.status || filters.priority || filters.type 
                    ? 'Keine Tickets entsprechen Ihren Suchkriterien.' 
                    : 'Sie haben noch keine Tickets.'}
                </p>
                <Button asChild>
                  <Link href="/portal/tickets/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Erstes Ticket erstellen
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {tickets.map((ticket) => (
              <Card key={ticket._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{ticket.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        {getTypeBadge(ticket.type)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/portal/consumer-tickets/${ticket._id}`}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        title="Ticket anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ticket.description && (
                    <p className="text-sm text-muted-foreground">{ticket.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Zugewiesen:</span>
                      <span>{ticket.assignee?.name || 'Nicht zugewiesen'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Erstellt von:</span>
                      <span>{ticket.reporter?.name || 'Unbekannt'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Fällig:</span>
                      <span>{formatDate(ticket.dueDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {ticket._count.comments} Kommentare
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Erstellt: {formatDate(ticket.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
