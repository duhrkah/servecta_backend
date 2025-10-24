'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import AdminLayout from '@/components/admin-layout'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, User, AlertCircle, CheckCircle, Pause, X, Flag, Eye } from 'lucide-react'
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
  _count?: {
    subtasks: number
    comments: number
  }
}

export default function ConsumerTaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [task, setTask] = useState<Task | null>(null)

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/tasks-mongodb/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Aufgabe nicht gefunden')
            router.push('/portal/consumer-tasks')
            return
          }
          throw new Error('Failed to fetch task')
        }
        
        const taskData = await response.json()
        setTask(taskData)
      } catch (error) {
        console.error('Failed to fetch task:', error)
        toast.error('Fehler beim Laden der Aufgabe')
        router.push('/portal/consumer-tasks')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTask()
    }
  }, [params.id, router])

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/portal/consumer-tasks"
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Aufgabe wird geladen...</h1>
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

  if (!task) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/portal/consumer-tasks"
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Aufgabe nicht gefunden</h1>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Aufgabe nicht verfügbar</h3>
                <p className="text-muted-foreground mb-4">
                  Die angeforderte Aufgabe konnte nicht gefunden werden oder Sie haben keine Berechtigung dafür.
                </p>
                <Link 
                  href="/portal/consumer-tasks"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Zurück zu den Aufgaben
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  const daysUntilDue = getDaysUntilDue(task.dueAt)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/portal/consumer-tasks"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
              {getTypeBadge(task.type)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hauptinhalt */}
          <div className="lg:col-span-2 space-y-6">
            {/* Aufgabenübersicht */}
            <Card>
              <CardHeader>
                <CardTitle>Aufgabenübersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <div>
                    <h4 className="font-medium mb-2">Beschreibung</h4>
                    <p className="text-muted-foreground">{task.description}</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Fälligkeitsdatum:</span>
                    <span className={`ml-2 font-medium ${daysUntilDue && daysUntilDue < 0 ? 'text-red-600' : ''}`}>
                      {formatDate(task.dueAt)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Erstellt:</span>
                    <span className="ml-2 font-medium">{formatDate(task.createdAt)}</span>
                  </div>
                  {task.completedAt && (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-muted-foreground">Abgeschlossen:</span>
                      <span className="ml-2 font-medium">{formatDate(task.completedAt)}</span>
                    </div>
                  )}
                </div>

                {daysUntilDue !== null && daysUntilDue < 0 && (
                  <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>Diese Aufgabe ist seit {Math.abs(daysUntilDue)} Tagen überfällig</span>
                  </div>
                )}
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
                    {task.assignee?.name || 'Nicht zugewiesen'}
                  </span>
                </div>
                
                {task.assignee?.email && (
                  <div className="text-sm text-muted-foreground">
                    {task.assignee.email}
                  </div>
                )}
                
                <Separator />
                
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Erstellt von:</span>
                  <span className="ml-2 font-medium">
                    {task.reporter?.name || 'Unbekannt'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Projektinformationen */}
            {task.project && (
              <Card>
                <CardHeader>
                  <CardTitle>Projekt</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link 
                    href={`/portal/consumer-projects/${task.project._id}`}
                    className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{task.project.name}</h3>
                        <p className="text-sm text-muted-foreground">{task.project.code}</p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Statistiken */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Unteraufgaben:</span>
                  <span className="font-medium">{task._count?.subtasks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kommentare:</span>
                  <span className="font-medium">{task._count?.comments || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
