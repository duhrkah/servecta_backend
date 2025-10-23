'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Ticket, 
  Save, 
  Edit, 
  Trash2,
  ArrowLeft,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Tag,
  Mail,
  Phone,
  Building,
  MoreHorizontal
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  comments: Comment[]
}

interface Comment {
  _id: string
  content: string
  authorId: string
  authorName: string
  author?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  name: string
  email: string
  role: string
  status: string
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    type: '',
    assigneeId: '',
    dueDate: '',
    tags: [] as string[],
    departments: [] as ('IT' | 'DATENSCHUTZ')[]
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [quickAssignUserId, setQuickAssignUserId] = useState('')
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/v1/tickets-mongodb/${params.id}`)
        if (response.ok) {
          const ticketData = await response.json()
          
          const ticket: Ticket = {
            ...ticketData,
            assigneeName: ticketData.assignee?.name || 'Nicht zugewiesen',
            reporterName: ticketData.reporter?.name || 'Unbekannt',
            comments: ticketData.comments || [],
          }
          
          setTicket(ticket)
          setEditData({
            title: ticket.title,
            description: ticket.description || '',
            status: ticket.status,
            priority: ticket.priority,
            type: ticket.type,
            assigneeId: ticket.assigneeId || '',
            dueDate: formatDateForInput(ticket.dueDate || ''),
            tags: ticket.tags || [],
            departments: ticket.departments || []
          })
        } else {
          toast.error('Ticket nicht gefunden')
          router.push('/portal/tickets')
        }
      } catch (error) {
        console.error('Failed to fetch ticket:', error)
        toast.error('Fehler beim Laden des Tickets')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTicket()
    }
  }, [params.id, router])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/v1/users-mongodb?userType=STAFF')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }
    fetchUsers()
  }, [])

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/tickets-mongodb/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editData,
          assigneeId: editData.assigneeId || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update ticket')
      }

      const updatedTicket = await response.json()
      
      const ticket: Ticket = {
        ...updatedTicket,
        assigneeName: updatedTicket.assignee?.name || 'Nicht zugewiesen',
        reporterName: updatedTicket.reporter?.name || 'Unbekannt',
        comments: updatedTicket.comments || [],
      }
      
      setTicket(ticket)
      setEditing(false)
      toast.success('Ticket erfolgreich aktualisiert!')
    } catch (error) {
      console.error('Failed to save ticket:', error)
      toast.error('Fehler beim Speichern des Tickets')
    }
  }

  const handleQuickAssign = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/tickets-mongodb/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigneeId: userId || null }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign ticket')
      }

      const updatedTicketData = await response.json()
      
      const ticket: Ticket = {
        ...updatedTicketData,
        assigneeName: updatedTicketData.assignee?.name || 'Nicht zugewiesen',
        reporterName: updatedTicketData.reporter?.name || 'Unbekannt',
        comments: updatedTicketData.comments || [],
      }
      
      setTicket(ticket)
      setQuickAssignUserId('')
      toast.success(userId ? 'Ticket erfolgreich zugewiesen!' : 'Zuweisung erfolgreich entfernt!')
    } catch (error) {
      console.error('Failed to assign ticket:', error)
      toast.error('Fehler beim Zuweisen des Tickets')
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

  const handleDeleteTicket = async () => {
    try {
      const response = await fetch(`/api/v1/tickets-mongodb/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete ticket')
      }

      toast.success('Ticket erfolgreich gelöscht!')
      router.push('/portal/tickets')
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      toast.error('Fehler beim Löschen des Tickets')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`/api/v1/tickets-mongodb/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const updatedTicket = await response.json()
      
      const ticket: Ticket = {
        ...updatedTicket,
        assigneeName: updatedTicket.assignee?.name || 'Nicht zugewiesen',
        reporterName: updatedTicket.reporter?.name || 'Unbekannt',
        comments: updatedTicket.comments || [],
      }
      
      setTicket(ticket)
      setNewComment('')
      toast.success('Kommentar erfolgreich hinzugefügt!')
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Fehler beim Hinzufügen des Kommentars')
    } finally {
      setSubmittingComment(false)
    }
  }

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht festgelegt'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
  }

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ticket nicht gefunden</h2>
          <p className="text-muted-foreground mb-4">Das angeforderte Ticket existiert nicht.</p>
          <Button onClick={() => router.push('/portal/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Tickets
          </Button>
        </div>
      </AdminLayout>
    )
  }

  const daysUntilDue = getDaysUntilDue(ticket.dueDate)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/portal/tickets')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{ticket.title}</h1>
              <div className="flex items-center space-x-2 mt-2">
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
                {getTypeBadge(ticket.type)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Beschreibung</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ticket-Beschreibung..."
                    className="min-h-32"
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {ticket.description || 'Keine Beschreibung vorhanden'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Kommentare</CardTitle>
                <CardDescription>
                  {ticket.comments.length} Kommentare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Kommentar hinzufügen..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-20"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submittingComment}
                    >
                      {submittingComment ? 'Hinzufügen...' : 'Kommentar hinzufügen'}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                  {ticket.comments.length > 0 ? (
                    ticket.comments.map((comment) => (
                      <div key={comment._id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.authorName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{comment.authorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                      <p>Noch keine Kommentare vorhanden</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket-Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Titel</label>
                      <Input
                        value={editData.title}
                        onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ticket-Titel..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select
                        value={editData.status}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Offen</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
                          <SelectItem value="RESOLVED">Gelöst</SelectItem>
                          <SelectItem value="CLOSED">Geschlossen</SelectItem>
                          <SelectItem value="CANCELLED">Storniert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Priorität</label>
                      <Select
                        value={editData.priority}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Niedrig</SelectItem>
                          <SelectItem value="MEDIUM">Mittel</SelectItem>
                          <SelectItem value="HIGH">Hoch</SelectItem>
                          <SelectItem value="URGENT">Dringend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Typ</label>
                      <Select
                        value={editData.type}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUG">Bug</SelectItem>
                          <SelectItem value="FEATURE">Feature</SelectItem>
                          <SelectItem value="SUPPORT">Support</SelectItem>
                          <SelectItem value="TASK">Aufgabe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Zugewiesen an</label>
                      <Select
                        value={editData.assigneeId || "unassigned"}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, assigneeId: value === "unassigned" ? "" : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Benutzer auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Fälligkeitsdatum</label>
                      <Input
                        type="date"
                        value={editData.dueDate}
                        onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Abteilungen</label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="it-department-ticket"
                            checked={editData.departments.includes('IT')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditData(prev => ({ ...prev, departments: [...prev.departments, 'IT'] }))
                              } else {
                                setEditData(prev => ({ ...prev, departments: prev.departments.filter(d => d !== 'IT') }))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="it-department-ticket" className="text-sm">IT</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="datenschutz-department-ticket"
                            checked={editData.departments.includes('DATENSCHUTZ')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditData(prev => ({ ...prev, departments: [...prev.departments, 'DATENSCHUTZ'] }))
                              } else {
                                setEditData(prev => ({ ...prev, departments: prev.departments.filter(d => d !== 'DATENSCHUTZ') }))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="datenschutz-department-ticket" className="text-sm">Datenschutz</label>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Erstellt:</span>
                      <span className="ml-2 font-medium">{formatDate(ticket.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Aktualisiert:</span>
                      <span className="ml-2 font-medium">{formatDate(ticket.updatedAt)}</span>
                    </div>
                    {ticket.dueDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Fällig:</span>
                        <span className={`ml-2 font-medium ${
                          daysUntilDue && daysUntilDue < 0 ? 'text-red-600' :
                          daysUntilDue && daysUntilDue === 0 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {daysUntilDue && daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} Tage überfällig` :
                           daysUntilDue && daysUntilDue === 0 ? 'Heute fällig' :
                           daysUntilDue ? `in ${daysUntilDue} Tagen` : formatDate(ticket.dueDate)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Abteilungen:</span>
                  <div className="mt-2">
                    {getDepartmentBadge(ticket.departments)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignee */}
            <Card>
              <CardHeader>
                <CardTitle>Zugewiesener Benutzer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {ticket.assigneeName?.charAt(0) || 'N'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{ticket.assigneeName}</p>
                      <p className="text-sm text-muted-foreground">Zugewiesen</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Schnell zuweisen</label>
                    <div className="space-y-2">
                      <Select
                        value={quickAssignUserId || "unassigned"}
                        onValueChange={(value) => {
                          if (value === "unassigned") {
                            handleQuickAssign("")
                          } else if (value) {
                            handleQuickAssign(value)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Benutzer auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Wählen Sie einen Benutzer aus, um das Ticket sofort zuzuweisen
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reporter */}
            <Card>
              <CardHeader>
                <CardTitle>Melder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {ticket.reporterName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{ticket.reporterName}</p>
                    <p className="text-sm text-muted-foreground">Ticket erstellt</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {ticket.tags && ticket.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteTicket}
        title="Ticket löschen"
        description={`Sind Sie sicher, dass Sie das Ticket "${ticket.title}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`}
        entityName={ticket?.title || 'Ticket'}
        entityType="task"
      />
    </AdminLayout>
  )
}