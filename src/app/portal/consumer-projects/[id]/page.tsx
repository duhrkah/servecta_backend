'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import AdminLayout from '@/components/admin-layout'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, Users, DollarSign, Eye, CheckSquare, Ticket } from 'lucide-react'
import Link from 'next/link'

interface Project {
  _id: string
  name: string
  code: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  budget?: number
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
  departments?: ('IT' | 'DATENSCHUTZ')[]
  _count?: {
    tasks: number
    tickets: number
  }
}

export default function ConsumerProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/projects-mongodb/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Projekt nicht gefunden')
            router.push('/portal/consumer-projects')
            return
          }
          throw new Error('Failed to fetch project')
        }
        
        const projectData = await response.json()
        setProject(projectData)
      } catch (error) {
        console.error('Failed to fetch project:', error)
        toast.error('Fehler beim Laden des Projekts')
        router.push('/portal/consumer-projects')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProject()
    }
  }, [params.id, router])

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

  const getDepartmentBadge = (departments?: ('IT' | 'DATENSCHUTZ')[]) => {
    if (!departments || departments.length === 0) {
      return <Badge variant="outline">Keine Abteilung</Badge>
    }
    return departments.map((dept) => (
      <Badge key={dept} variant="outline" className="mr-1">
        {dept}
      </Badge>
    ))
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht festgelegt'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Nicht festgelegt'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/portal/consumer-projects"
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Projekt wird geladen...</h1>
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

  if (!project) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/portal/consumer-projects"
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Projekt nicht gefunden</h1>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Projekt nicht verfügbar</h3>
                <p className="text-muted-foreground mb-4">
                  Das angeforderte Projekt konnte nicht gefunden werden oder Sie haben keine Berechtigung dafür.
                </p>
                <Link 
                  href="/portal/consumer-projects"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Zurück zu den Projekten
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
        <div className="flex items-center gap-4">
          <Link 
            href="/portal/consumer-projects"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">Projektcode: {project.code}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hauptinhalt */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projektübersicht */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Projektübersicht</span>
                  {getStatusBadge(project.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <div>
                    <h4 className="font-medium mb-2">Beschreibung</h4>
                    <p className="text-muted-foreground">{project.description}</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Startdatum:</span>
                    <span className="ml-2 font-medium">{formatDate(project.startDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Enddatum:</span>
                    <span className="ml-2 font-medium">{formatDate(project.endDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="ml-2 font-medium">{formatCurrency(project.budget)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Erstellt:</span>
                    <span className="ml-2 font-medium">{formatDate(project.createdAt)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <span className="text-sm text-muted-foreground">Abteilungen:</span>
                  <div className="mt-2">
                    {getDepartmentBadge(project.departments)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verwandte Inhalte */}
            <Card>
              <CardHeader>
                <CardTitle>Verwandte Inhalte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link 
                    href={`/portal/consumer-tasks?project=${project._id}`}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">Aufgaben</h3>
                        <p className="text-sm text-muted-foreground">
                          {project._count?.tasks || 0} Aufgaben in diesem Projekt
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link 
                    href={`/portal/consumer-tickets?project=${project._id}`}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-medium">Tickets</h3>
                        <p className="text-sm text-muted-foreground">
                          {project._count?.tickets || 0} Tickets in diesem Projekt
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Projektinformationen */}
            <Card>
              <CardHeader>
                <CardTitle>Projektinformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Ansprechpartner:</span>
                  <span className="ml-2 font-medium">
                    {project.assignee?.name || 'Nicht zugewiesen'}
                  </span>
                </div>
                
                {project.assignee?.email && (
                  <div className="text-sm text-muted-foreground">
                    {project.assignee.email}
                  </div>
                )}
                
                <Separator />
                
                <div className="text-sm text-muted-foreground">
                  <div>Letzte Aktualisierung:</div>
                  <div className="font-medium">{formatDate(project.updatedAt)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiken */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Aufgaben:</span>
                  <span className="font-medium">{project._count?.tasks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tickets:</span>
                  <span className="font-medium">{project._count?.tickets || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
