'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import AdminLayout from '@/components/admin-layout'
import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog'
import { toast } from 'sonner'
import { ArrowLeft, Edit, Save, X, Calendar, Clock, Users, DollarSign, Trash2 } from 'lucide-react'

interface Project {
  _id: string
  name: string
  description: string
  status: string
  customerId: string
  customerName: string
  departments?: ('IT' | 'DATENSCHUTZ')[]
  assigneeId?: string
  assigneeName?: string
  assignee?: {
    _id: string
    name: string
    email: string
  }
  budget: number
  startDate: string
  endDate: string
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

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    status: '',
    budget: 0,
    startDate: '',
    endDate: '',
    assigneeId: '',
    departments: [] as ('IT' | 'DATENSCHUTZ')[]
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [quickAssignUserId, setQuickAssignUserId] = useState('')

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/projects-mongodb/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Projekt nicht gefunden')
            return
          }
          throw new Error('Failed to fetch project')
        }
        
        const projectData = await response.json()
        
        // Ensure arrays exist and handle customer data
        const project: Project = {
          ...projectData,
          customerName: projectData.customer?.legalName || 'Unbekannter Kunde',
          assigneeName: projectData.assignee?.name || 'Nicht zugewiesen',
          tasks: projectData.tasks || [],
        }
        
        setProject(project)
        setEditData({
          name: project.name,
          description: project.description || '',
          status: project.status,
          budget: project.budget || 0,
          startDate: formatDateForInput(project.startDate),
          endDate: formatDateForInput(project.endDate),
          assigneeId: project.assigneeId || '',
          departments: project.departments || []
        })
      } catch (error) {
        console.error('Failed to fetch project:', error)
        toast.error('Fehler beim Laden des Projekts')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id])

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PLANNING: { label: 'Planung', className: 'bg-blue-100 text-blue-800' },
      ACTIVE: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
      ON_HOLD: { label: 'Pausiert', className: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Abgeschlossen', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Abgebrochen', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PLANNING
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/projects-mongodb/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      const updatedProject = await response.json()
      
      // Ensure arrays exist and handle customer data
      const project: Project = {
        ...updatedProject,
        customerName: updatedProject.customer?.legalName || 'Unbekannter Kunde',
        assigneeName: updatedProject.assignee?.name || 'Nicht zugewiesen',
          tasks: updatedProject.tasks || [],
      }
      
      setProject(project)
      setEditing(false)
      toast.success('Projekt erfolgreich aktualisiert!')
    } catch (error) {
      console.error('Failed to save project:', error)
      toast.error('Fehler beim Speichern des Projekts')
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

  const handleDeleteProject = async () => {
    try {
      const response = await fetch(`/api/v1/projects-mongodb/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Deletion result:', result)
        toast.success('Projekt und alle verknüpften Daten erfolgreich gelöscht!')
        router.push('/portal/projects')
      } else {
        throw new Error('Failed to delete project')
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  }

  const handleQuickAssign = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/projects-mongodb/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigneeId: userId || null }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign project')
      }

      const updatedProjectData = await response.json()
      
      const project: Project = {
        ...updatedProjectData,
        customerName: updatedProjectData.customer?.legalName || 'Unbekannter Kunde',
        assigneeName: updatedProjectData.assignee?.name || 'Nicht zugewiesen',
          tasks: updatedProjectData.tasks || [],
      }
      
      setProject(project)
      setQuickAssignUserId('')
      toast.success(userId ? 'Projekt erfolgreich zugewiesen!' : 'Zuweisung erfolgreich entfernt!')
    } catch (error) {
      console.error('Failed to assign project:', error)
      toast.error('Fehler beim Zuweisen des Projekts')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!project) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Fehler</h2>
          <p className="text-red-700">Projekt nicht gefunden</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              Projekt Details und Informationen
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              {editing ? 'Abbrechen' : 'Bearbeiten'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projekt Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Beschreibung</label>
                    <Textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="PLANNING">Planung</SelectItem>
                          <SelectItem value="ACTIVE">Aktiv</SelectItem>
                          <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                          <SelectItem value="ON_HOLD">Pausiert</SelectItem>
                          <SelectItem value="CANCELLED">Abgebrochen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Budget</label>
                      <Input
                        type="number"
                        value={editData.budget}
                        onChange={(e) => setEditData(prev => ({ ...prev, budget: parseFloat(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Startdatum</label>
                      <Input
                        type="date"
                        value={editData.startDate}
                        onChange={(e) => setEditData(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Enddatum</label>
                      <Input
                        type="date"
                        value={editData.endDate}
                        onChange={(e) => setEditData(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
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
                    <label className="text-sm font-medium mb-2 block">Abteilungen</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="it-department-project"
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
                        <label htmlFor="it-department-project" className="text-sm">IT</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="datenschutz-department-project"
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
                        <label htmlFor="datenschutz-department-project" className="text-sm">Datenschutz</label>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                    <p className="text-muted-foreground">{project.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(project.status)}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="ml-2 font-medium">{formatCurrency(project.budget)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Start:</span>
                      <span className="ml-2 font-medium">{formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Ende:</span>
                      <span className="ml-2 font-medium">{formatDate(project.endDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Erstellt:</span>
                      <span className="ml-2 font-medium">{formatDate(project.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Zugewiesen an:</span>
                      <span className="ml-2 font-medium">{project.assigneeName}</span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Abteilungen:</span>
                    <div className="mt-2">
                      {getDepartmentBadge(project.departments)}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kunde Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Kunde:</span>
                  <p className="font-medium">{project.customerName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Projekt-ID:</span>
                  <p className="font-mono text-sm">{project._id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zugewiesener Benutzer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{project.assigneeName}</p>
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
                      Wählen Sie einen Benutzer aus, um das Projekt sofort zuzuweisen
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Aufgaben anzeigen
              </Button>
              <Button variant="outline" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Rechnungen anzeigen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteProject}
        title="Projekt löschen"
        description={`Möchten Sie das Projekt "${project.name}" wirklich löschen?`}
        entityName={project.name}
        entityType="project"
      />
    </AdminLayout>
  )
}