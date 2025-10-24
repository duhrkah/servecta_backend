'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import AdminLayout from '@/components/admin-layout'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, User, AlertCircle, CheckCircle, Pause, X, Flag, MessageSquare, Plus } from 'lucide-react'
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
  _count?: {
    comments: number
  }
}

export default function ConsumerTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/tickets-mongodb/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Ticket nicht gefunden')
            router.push('/portal/consumer-tickets')
            return
          }
          throw new Error('Failed to fetch ticket')
        }
        
        const ticketData = await response.json()
        setTicket(ticketData)
      } catch (error) {
        console.error('Failed to fetch ticket:', error)
        toast.error('Fehler beim Laden des Tickets')
        router.push('/portal/consumer-tickets')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTicket()
    }
  }, [params.id, router])

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
          <div className="flex items-center gap-4">
            <Link 
              href="/portal/consumer-tickets"
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Ticket wird geladen...</h1>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/portal/consumer-tickets"
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Ticket nicht gefunden</h1>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Ticket nicht verfügbar</h3>
                <p className="text-muted-foreground mb-4">
                  Das angeforderte Ticket konnte nicht gefunden werden oder Sie haben keine Berechtigung dafür.
                </p>
                <Link 
                  href="/portal/consumer-tickets"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Zurück zu den Tickets
                </Link>
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/portal/consumer-tickets"
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{ticket.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
                {getTypeBadge(ticket.type)}
              </div>
            </div>
          </div>
          <Button asChild>
            <Link href="/portal/tickets/new">
              <Plus className="h-4 w-4 mr-2" />
              Neues Ticket
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hauptinhalt */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticketübersicht */}
            <Card>
              <CardHeader>
                <CardTitle>Ticketübersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.description && (
                  <div>
                    <h4 className="font-medium mb-2">Beschreibung</h4>
                    <p className="text-muted-foreground">{ticket.description}</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Fälligkeitsdatum:</span>
                    <span className="ml-2 font-medium">{formatDate(ticket.dueDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Erstellt:</span>
                    <span className="ml-2 font-medium">{formatDate(ticket.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Letzte Aktualisierung:</span>
                    <span className="ml-2 font-medium">{formatDate(ticket.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kommentare */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Kommentare ({ticket._count?.comments || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Kommentarfunktion ist für Consumer-Benutzer nicht verfügbar.</p>
                  <p className="text-sm">Bei Fragen wenden Sie sich an Ihren Ansprechpartner.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Zuweisungen */}
            <Card>
              <CardHeader>
                <CardTitle>Zuweisungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Zugewiesen an:</span>
                  <span className="ml-2 font-medium">
                    {ticket.assignee?.name || 'Nicht zugewiesen'}
                  </span>
                </div>
                
                {ticket.assignee?.email && (
                  <div className="text-sm text-muted-foreground">
                    {ticket.assignee.email}
                  </div>
                )}
                
                <Separator />
                
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Erstellt von:</span>
                  <span className="ml-2 font-medium">
                    {ticket.reporter?.name || 'Unbekannt'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Aktionen */}
            <Card>
              <CardHeader>
                <CardTitle>Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/portal/tickets/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Ticket erstellen
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Kommentar hinzufügen
                </Button>
                <p className="text-xs text-muted-foreground">
                  Nur Ihr Ansprechpartner kann Kommentare hinzufügen.
                </p>
              </CardContent>
            </Card>

            {/* Statistiken */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kommentare:</span>
                  <span className="font-medium">{ticket._count?.comments || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{ticket.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Priorität:</span>
                  <span className="font-medium">{ticket.priority}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
