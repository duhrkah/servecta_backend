'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
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
  FolderKanban
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: '',
    assignee: '',
    project: ''
  })
  const [view, setView] = useState<'list' | 'kanban'>('list')

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.type && { type: filters.type }),
        ...(filters.assignee && { assignee: filters.assignee }),
        ...(filters.project && { project: filters.project })
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
        return <Badge variant="default" className="bg-green-100 text-green-800">Erledigt</Badge>
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
        return <Badge variant="outline">{priority}</Badge>
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TASK':
        return <Badge variant="outline">Aufgabe</Badge>
      case 'BUG':
        return <Badge variant="destructive">Bug</Badge>
      case 'FEATURE':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Feature</Badge>
      case 'IMPROVEMENT':
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Verbesserung</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht festgelegt'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const getDaysUntilDue = (dueAt?: string) => {
    if (!dueAt) return null
    const due = new Date(dueAt)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const groupTasksByStatus = () => {
    const groups = {
      TODO: [] as Task[],
      IN_PROGRESS: [] as Task[],
      DONE: [] as Task[],
      CANCELLED: [] as Task[]
    }

    tasks.forEach(task => {
      if (groups[task.status as keyof typeof groups]) {
        groups[task.status as keyof typeof groups].push(task)
      }
    })

    return groups
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
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
          <h2 className="text-xl font-semibold mb-2">Fehler beim Laden der Aufgaben</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchTasks}>Erneut versuchen</Button>
        </div>
      </AdminLayout>
    )
  }

  const taskGroups = groupTasksByStatus()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aufgaben</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Aufgaben, Zuweisungen und Deadlines.
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
              <Link href="/portal/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                Neue Aufgabe
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
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Aufgaben suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Content */}
        {view === 'list' ? (
          /* List View */
          <Card>
            <CardHeader>
              <CardTitle>Alle Aufgaben</CardTitle>
              <CardDescription>
                {tasks.length} Aufgaben gefunden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const daysUntilDue = getDaysUntilDue(task.dueAt)
                    return (
                      <div
                        key={task._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <CheckSquare className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{task.title}</h3>
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                              {getTypeBadge(task.type)}
                              {getDepartmentBadge(task.departments)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              {task.project && (
                                <>
                                  <span className="flex items-center">
                                    <FolderKanban className="h-3 w-3 mr-1" />
                                    {task.project.name} ({task.project.code})
                                  </span>
                                  <span>•</span>
                                </>
                              )}
                              {task.assignee && (
                                <>
                                  <span className="flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {task.assignee.name}
                                  </span>
                                  <span>•</span>
                                </>
                              )}
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(task.createdAt)}
                              </span>
                              {task.dueAt && (
                                <>
                                  <span>•</span>
                                  <span className={`flex items-center ${daysUntilDue && daysUntilDue < 0 ? 'text-red-600' : daysUntilDue && daysUntilDue < 3 ? 'text-yellow-600' : ''}`}>
                                    <Clock className="h-3 w-3 mr-1" />
                                    {daysUntilDue && daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} Tage überfällig` :
                                     daysUntilDue && daysUntilDue === 0 ? 'Heute fällig' :
                                     daysUntilDue ? `in ${daysUntilDue} Tagen` : formatDate(task.dueAt)}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{task._count?.subtasks || 0} Unteraufgaben</span>
                              <span>•</span>
                              <span>{task._count?.comments || 0} Kommentare</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/portal/tasks/${task._id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Keine Aufgaben gefunden</h3>
                    <p className="text-muted-foreground mb-4">
                      {search || Object.values(filters).some(f => f) 
                        ? 'Versuchen Sie andere Suchbegriffe oder Filter.' 
                        : 'Erstellen Sie Ihre erste Aufgabe.'}
                    </p>
                    {!search && !Object.values(filters).some(f => f) && (
                      <Button asChild>
                        <Link href="/portal/tasks/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Erste Aufgabe erstellen
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
          <div className="grid gap-6 md:grid-cols-6">
            {Object.entries(taskGroups).map(([status, statusTasks]) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium capitalize">
                      {status === 'TODO' ? 'Zu erledigen' :
                       status === 'IN_PROGRESS' ? 'In Bearbeitung' :
                       status === 'DONE' ? 'Erledigt' :
                       status === 'CANCELLED' ? 'Abgebrochen' : status}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {statusTasks.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusTasks.map((task) => {
                    const daysUntilDue = getDaysUntilDue(task.dueAt)
                    return (
                      <div
                        key={task._id}
                        className="p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/portal/tasks/${task._id}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <div className="flex flex-col items-end space-y-1">
                              {getPriorityBadge(task.priority)}
                              {getTypeBadge(task.type)}
                            </div>
                          </div>
                          {task.project && (
                            <p className="text-xs text-muted-foreground">
                              {task.project.name}
                            </p>
                          )}
                          {task.assignee && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <User className="h-3 w-3 mr-1" />
                              {task.assignee.name}
                            </div>
                          )}
                          {task.dueAt && (
                            <div className={`text-xs ${daysUntilDue && daysUntilDue < 0 ? 'text-red-600' : daysUntilDue && daysUntilDue < 3 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                              <Clock className="h-3 w-3 mr-1 inline" />
                              {daysUntilDue && daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} Tage überfällig` :
                               daysUntilDue && daysUntilDue === 0 ? 'Heute fällig' :
                               daysUntilDue ? `in ${daysUntilDue} Tagen` : formatDate(task.dueAt)}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{task._count?.subtasks || 0} Unteraufgaben</span>
                            <span>{formatDate(task.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {statusTasks.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Keine Aufgaben
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
              <CardTitle className="text-sm font-medium">Zu erledigen</CardTitle>
              <CheckSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.filter(t => t.status === 'TODO').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Neue Aufgaben
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
                {tasks.filter(t => t.status === 'IN_PROGRESS').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Aktive Aufgaben
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Überfällige Aufgaben</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.filter(t => {
                  const daysUntilDue = getDaysUntilDue(t.dueAt)
                  return daysUntilDue && daysUntilDue < 0
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Sofortige Bearbeitung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erledigte Aufgaben</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.filter(t => t.status === 'DONE').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Diese Woche
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
