'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FolderKanban,
  Search,
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  X,
  Eye
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  _id: string
  name: string
  code: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  customer?: {
    _id: string
    legalName: string
    tradeName?: string
  }
  assignee?: {
    _id: string
    name: string
    email: string
  }
  _count?: {
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

export default function ConsumerProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: ''
  })

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(search && { search }),
        ...(filters.status && { status: filters.status })
      })

      const response = await fetch(`/api/v1/projects-mongodb?${params}`)
      if (response.ok) {
        const data: ProjectsResponse = await response.json()
        console.log('Fetched projects for consumer:', data.projects)
        setProjects(data.projects)
      } else {
        const errorData = await response.json()
        console.error('Error fetching projects:', errorData)
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
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ON_HOLD':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      case 'CANCELLED':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
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
              <h1 className="text-3xl font-bold">Meine Projekte</h1>
              <p className="text-muted-foreground">Übersicht über alle Ihre Projekte</p>
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
              <h1 className="text-3xl font-bold">Meine Projekte</h1>
              <p className="text-muted-foreground">Übersicht über alle Ihre Projekte</p>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fehler beim Laden</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <button 
                  onClick={fetchProjects}
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
            <h1 className="text-3xl font-bold">Meine Projekte</h1>
            <p className="text-muted-foreground">Übersicht über alle Ihre Projekte</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Suche</label>
                <input
                  type="text"
                  placeholder="Projektname oder Code suchen..."
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
                  <option value="PLANNING">Planung</option>
                  <option value="ACTIVE">Aktiv</option>
                  <option value="ON_HOLD">Pausiert</option>
                  <option value="COMPLETED">Abgeschlossen</option>
                  <option value="CANCELLED">Abgebrochen</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projekte Liste */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Projekte gefunden</h3>
                <p className="text-muted-foreground">
                  {search || filters.status ? 'Keine Projekte entsprechen Ihren Suchkriterien.' : 'Sie haben noch keine Projekte.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => (
              <Card key={project._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm">{project.code}</code>
                        {getStatusBadge(project.status)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(project.status)}
                      <Link 
                        href={`/portal/consumer-projects/${project._id}`}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        title="Projekt anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Start:</span>
                      <span>{formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Ende:</span>
                      <span>{formatDate(project.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Ansprechpartner:</span>
                      <span>{project.assignee?.name || 'Nicht zugewiesen'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{project._count?.tasks || 0} Aufgaben</span>
                      <span>{project._count?.tickets || 0} Tickets</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Erstellt: {formatDate(project.createdAt)}
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
