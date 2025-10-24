'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  CheckSquare, 
  Search, 
  Filter,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Pause,
  X,
  Flag,
  FileText,
  Building,
  FolderKanban,
  Eye
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Task {
  _id: string
  title: string
  description?: string
  status: string
  priority: string
  type: string
  dueAt?: string
  completedAt?: string
  departments?: ('IT' | 'DATENSCHUTZ')[]
  createdAt: string
  updatedAt: string
  project?: {
    _id: string
    name: string
    code: string
  }
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
    subtasks: number
    comments: number
  }
}

interface TasksResponse {
  tasks: Task[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ConsumerTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: ''
  })

  const fetchTasks = async () => {
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

      const response = await fetch(`/api/v1/tasks-mongodb?${params}`)
      if (response.ok) {
        const data: TasksResponse = await response.json()
        setTasks(data.tasks)
      } else {
        setError('Fehler beim Laden der Aufgaben')
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      setError('Fehler beim Laden der Aufgaben')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [search, filters])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Zu erledigen</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Bearbeitung</Badge>
      case 'DONE':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Erledigt</Badge>
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Abgeschlossen</Badge>
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
      case 'TASK':
        return <Badge variant="outline">Aufgabe</Badge>
      case 'IMPROVEMENT':
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Verbesserung</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const getDaysUntilDue = (dueAt?: string) => {
    if (!dueAt) return null
    const due = new Date(dueAt)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
              <h1 className="text-3xl font-bold">Meine Aufgaben</h1>
              <p className="text-muted-foreground">Übersicht über alle Ihre Aufgaben</p>
            </div>
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
              <h1 className="text-3xl font-bold">Meine Aufgaben</h1>
              <p className="text-muted-foreground">Übersicht über alle Ihre Aufgaben</p>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fehler beim Laden</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <button 
                  onClick={fetchTasks}
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
            <h1 className="text-3xl font-bold">Meine Aufgaben</h1>
            <p className="text-muted-foreground">Übersicht über alle Ihre Aufgaben</p>
          </div>
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
                  placeholder="Aufgabe suchen..."
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
                  <option value="TODO">Zu erledigen</option>
                  <option value="IN_PROGRESS">In Bearbeitung</option>
                  <option value="DONE">Erledigt</option>
                  <option value="COMPLETED">Abgeschlossen</option>
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
                  <option value="TASK">Aufgabe</option>
                  <option value="BUG">Fehler</option>
                  <option value="FEATURE">Feature</option>
                  <option value="IMPROVEMENT">Verbesserung</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aufgaben Liste */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Aufgaben gefunden</h3>
                <p className="text-muted-foreground">
                  {search || filters.status || filters.priority || filters.type 
                    ? 'Keine Aufgaben entsprechen Ihren Suchkriterien.' 
                    : 'Sie haben noch keine Aufgaben.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {tasks.map((task) => {
              const daysUntilDue = getDaysUntilDue(task.dueAt)
              return (
                <Card key={task._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{task.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                          {getTypeBadge(task.type)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                      <Link 
                        href={`/portal/consumer-tasks/${task._id}`}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        title="Aufgabe anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-gray-500" />
                        <span className="text-muted-foreground">Projekt:</span>
                        <span>{task.project?.name || 'Kein Projekt'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-muted-foreground">Zugewiesen:</span>
                        <span>{task.assignee?.name || 'Nicht zugewiesen'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-muted-foreground">Fällig:</span>
                        <span className={daysUntilDue && daysUntilDue < 0 ? 'text-red-600 font-medium' : ''}>
                          {formatDate(task.dueAt)}
                        </span>
                      </div>
                    </div>

                    {daysUntilDue !== null && daysUntilDue < 0 && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>Überfällig seit {Math.abs(daysUntilDue)} Tagen</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{task._count.subtasks} Unteraufgaben</span>
                        <span>{task._count.comments} Kommentare</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Erstellt: {formatDate(task.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
