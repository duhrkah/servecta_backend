'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FolderKanban, 
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
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  _id: string
  code: string
  name: string
  status: string
  startDate?: string
  endDate?: string
  description?: string
  departments?: ('IT' | 'DATENSCHUTZ')[]
  createdAt: string
  updatedAt: string
  customer: {
    _id: string
    legalName: string
    tradeName?: string
  }
  assignee?: {
    _id: string
    name: string
    email: string
  }
  _count: {
    tasks: number
    tickets: number
  }
}

interface ProjectsResponse {
  projects: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    customer: ''
  })
  const [view, setView] = useState<'list' | 'kanban'>('list')

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.customer && { customer: filters.customer })
      })

      const response = await fetch(`/api/v1/projects-mongodb?${params}`)
      if (response.ok) {
        const data: ProjectsResponse = await response.json()
        setProjects(data.projects)
      } else {
        setError('Fehler beim Laden der Projekte')
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setError('Fehler beim Laden der Projekte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [search, filters])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Planung</Badge>
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aktiv</Badge>
      case 'ON_HOLD':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pausiert</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Abgeschlossen</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Abgebrochen</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'ON_HOLD':
        return <Pause className="h-4 w-4 text-yellow-600" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      case 'CANCELLED':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht festgelegt'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const getProgressPercentage = (project: Project) => {
    // Mock calculation - in real app, this would be based on completed tasks
    switch (project.status) {
      case 'PLANNED': return 0
      case 'ACTIVE': return Math.floor(Math.random() * 60) + 20 // 20-80%
      case 'PAUSED': return Math.floor(Math.random() * 40) + 10 // 10-50%
      case 'DONE': return 100
      case 'CANCELLED': return 0
      default: return 0
    }
  }

  const groupProjectsByStatus = () => {
    const groups = {
      PLANNED: [] as Project[],
      ACTIVE: [] as Project[],
      PAUSED: [] as Project[],
      DONE: [] as Project[],
      CANCELLED: [] as Project[]
    }

    projects.forEach(project => {
      if (groups[project.status as keyof typeof groups]) {
        groups[project.status as keyof typeof groups].push(project)
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
          <h2 className="text-xl font-semibold mb-2">Fehler beim Laden der Projekte</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchProjects}>Erneut versuchen</Button>
        </div>
      </AdminLayout>
    )
  }

  const projectGroups = groupProjectsByStatus()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projekte</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Projekte und deren Fortschritt.
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
              <Link href="/portal/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Neues Projekt
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
                    placeholder="Projekte suchen..."
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

        {/* Projects Content */}
        {view === 'list' ? (
          /* List View */
          <Card>
            <CardHeader>
              <CardTitle>Alle Projekte</CardTitle>
              <CardDescription>
                {projects.length} Projekte gefunden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div
                      key={(project as any)._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{project.name}</h3>
                            <Badge variant="outline">{project.code}</Badge>
                            {getStatusBadge(project.status)}
                            {getDepartmentBadge(project.departments)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{project.customer?.legalName || 'Kein Kunde zugewiesen'}</span>
                            {project.assignee && (
                              <>
                                <span>•</span>
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {project.assignee.name}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate((project as any).startDate)} - {formatDate((project as any).endDate)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Status: {project.status}</span>
                            <span>•</span>
                            <span>Erstellt: {new Date(project.createdAt).toLocaleDateString('de-DE')}</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-64">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Fortschritt</span>
                              <span>{getProgressPercentage(project)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-accent-blue h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getProgressPercentage(project)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/portal/projects/${(project as any)._id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Keine Projekte gefunden</h3>
                    <p className="text-muted-foreground mb-4">
                      {search || Object.values(filters).some(f => f) 
                        ? 'Versuchen Sie andere Suchbegriffe oder Filter.' 
                        : 'Erstellen Sie Ihr erstes Projekt.'}
                    </p>
                    {!search && !Object.values(filters).some(f => f) && (
                      <Button asChild>
                        <Link href="/portal/projects/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Erstes Projekt erstellen
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
            {Object.entries(projectGroups).map(([status, statusProjects]) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <CardTitle className="text-sm font-medium capitalize">
                      {status === 'PLANNED' ? 'Geplant' :
                       status === 'ACTIVE' ? 'Aktiv' :
                       status === 'PAUSED' ? 'Pausiert' :
                       status === 'DONE' ? 'Abgeschlossen' :
                       status === 'CANCELLED' ? 'Storniert' : status}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {statusProjects.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusProjects.map((project) => (
                    <div
                      key={(project as any)._id}
                      className="p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/portal/projects/${(project as any)._id}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{project.name}</h4>
                          <Badge variant="outline" className="text-xs">{project.code}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {project.customer?.legalName || 'Kein Kunde zugewiesen'}
                        </p>
                        {project.assignee && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            {project.assignee.name}
                          </div>
                        )}
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Erstellt: {new Date(project.createdAt).toLocaleDateString('de-DE')}</span>
                          <span>{getProgressPercentage(project)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-accent-blue h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(project)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {statusProjects.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Keine Projekte
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
              <CardTitle className="text-sm font-medium">Aktive Projekte</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Laufende Projekte
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Geplante Projekte</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'PLANNED').length}
              </div>
              <p className="text-xs text-muted-foreground">
                In Planung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'DONE').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Erfolgreich beendet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durchschnittliche Laufzeit</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + getProgressPercentage(p), 0) / projects.length) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Durchschnittlicher Fortschritt
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
