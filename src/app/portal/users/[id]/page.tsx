'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import AdminLayout from '@/components/admin-layout'
import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog'
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  CheckSquare,
  FolderKanban,
  Ticket
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  _id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'MITARBEITER'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  departments?: ('IT' | 'DATENSCHUTZ')[]
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  _count?: {
    tasks: number
    projects: number
    tickets: number
  }
}

interface Task {
  _id: string
  title: string
  status: string
  priority: string
  dueDate?: string
  project?: {
    _id: string
    name: string
  }
}

interface Project {
  _id: string
  name: string
  status: string
  customer?: {
    _id: string
    legalName: string
  }
}

interface Ticket {
  _id: string
  title: string
  status: string
  priority: string
  customer?: {
    _id: string
    legalName: string
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    departments: [] as ('IT' | 'DATENSCHUTZ')[]
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [params.id])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/users-mongodb/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Benutzer nicht gefunden')
          return
        }
        throw new Error('Failed to fetch user')
      }
      
      const userData = await response.json()
      setUser(userData)
      setEditData({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        departments: userData.departments || []
      })
    } catch (error) {
      console.error('Failed to fetch user:', error)
      toast.error('Benutzer nicht gefunden')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/users-mongodb/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      const updatedUser = await response.json()
      setUser(updatedUser)
      setEditing(false)
      toast.success('Benutzer erfolgreich aktualisiert!')
    } catch (error) {
      console.error('Failed to save user:', error)
      toast.error('Fehler beim Speichern des Benutzers')
    }
  }

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`/api/v1/users-mongodb/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Benutzer erfolgreich gelöscht!')
        router.push('/portal/users')
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { label: 'Administrator', className: 'bg-red-100 text-red-800' },
      MANAGER: { label: 'Manager', className: 'bg-blue-100 text-blue-800' },
      MITARBEITER: { label: 'Mitarbeiter', className: 'bg-green-100 text-green-800' }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.MITARBEITER
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Aktiv', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      INACTIVE: { label: 'Inaktiv', className: 'bg-gray-100 text-gray-800', icon: XCircle },
      PENDING: { label: 'Ausstehend', className: 'bg-yellow-100 text-yellow-800', icon: Clock }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    const Icon = config.icon
    
    return (
      <Badge variant="secondary" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getDepartmentBadge = (departments: string[]) => {
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

  const getStatusBadgeForTask = (status: string) => {
    const statusConfig = {
      TODO: { label: 'Zu erledigen', className: 'bg-gray-100 text-gray-800' },
      IN_PROGRESS: { label: 'In Bearbeitung', className: 'bg-blue-100 text-blue-800' },
      DONE: { label: 'Erledigt', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Abgebrochen', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.TODO
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: 'Niedrig', className: 'bg-green-100 text-green-800' },
      MEDIUM: { label: 'Mittel', className: 'bg-yellow-100 text-yellow-800' },
      HIGH: { label: 'Hoch', className: 'bg-orange-100 text-orange-800' },
      URGENT: { label: 'Dringend', className: 'bg-red-100 text-red-800' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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

  if (!user) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Fehler</h2>
          <p className="text-red-700">Benutzer nicht gefunden</p>
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
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`https://ui-avatars.com/api/v1/?name=${encodeURIComponent(user.name)}&background=random`} />
              <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>
            </div>
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
        {/* User Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Benutzer Details</CardTitle>
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
                    <label className="text-sm font-medium mb-2 block">E-Mail</label>
                    <Input
                      value={editData.email}
                      onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <div>
                      <label className="text-sm font-medium mb-2 block">Abteilungen</label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="it-department"
                            checked={editData.departments.includes('IT')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditData(prev => ({ 
                                  ...prev, 
                                  departments: [...prev.departments, 'IT'] 
                                }))
                              } else {
                                setEditData(prev => ({ 
                                  ...prev, 
                                  departments: prev.departments.filter(d => d !== 'IT') 
                                }))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="it-department" className="text-sm">IT</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="datenschutz-department"
                            checked={editData.departments.includes('DATENSCHUTZ')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditData(prev => ({ 
                                  ...prev, 
                                  departments: [...prev.departments, 'DATENSCHUTZ'] 
                                }))
                              } else {
                                setEditData(prev => ({ 
                                  ...prev, 
                                  departments: prev.departments.filter(d => d !== 'DATENSCHUTZ') 
                                }))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="datenschutz-department" className="text-sm">Datenschutz</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rolle</label>
                      <Select
                        value={editData.role}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MITARBEITER">Mitarbeiter</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="ACTIVE">Aktiv</SelectItem>
                          <SelectItem value="INACTIVE">Inaktiv</SelectItem>
                          <SelectItem value="PENDING">Ausstehend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Änderungen speichern
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">E-Mail</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Rolle</p>
                      {getRoleBadge(user.role)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Abteilungen</p>
                    {getDepartmentBadge(user.departments || [])}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user._count?.tasks || 0}</div>
                  <div className="text-sm text-muted-foreground">Aufgaben</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{user._count?.projects || 0}</div>
                  <div className="text-sm text-muted-foreground">Projekte</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{user._count?.tickets || 0}</div>
                  <div className="text-sm text-muted-foreground">Tickets</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Benutzer Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Benutzer-ID:</span>
                  <p className="font-mono text-sm">{user._id}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Erstellt am:</span>
                  <p className="text-sm">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Zuletzt aktualisiert:</span>
                  <p className="text-sm">{formatDate(user.updatedAt)}</p>
                </div>
                {user.lastLoginAt && (
                  <div>
                    <span className="text-sm text-muted-foreground">Letzter Login:</span>
                    <p className="text-sm">{formatDate(user.lastLoginAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Berechtigungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.role === 'ADMIN' && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Vollzugriff auf alle Funktionen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Benutzerverwaltung</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Systemeinstellungen</span>
                    </div>
                  </>
                )}
                {user.role === 'MANAGER' && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Projektverwaltung</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Aufgabenverwaltung</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Kundenverwaltung</span>
                    </div>
                  </>
                )}
                {user.role === 'MITARBEITER' && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Eigene Aufgaben anzeigen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Projekte anzeigen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-muted-foreground">Keine Verwaltungsrechte</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteUser}
        title="Benutzer löschen"
        description={`Möchten Sie den Benutzer "${user.name}" wirklich löschen?`}
        entityName={user.name}
        entityType="task"
      />
    </AdminLayout>
  )
}