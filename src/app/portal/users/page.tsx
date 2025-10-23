'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AdminLayout from '@/components/admin-layout'
import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Shield, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock
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

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const limit = 10

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        userType: 'STAFF' // Nur Staff-Benutzer anzeigen
      })

      const response = await fetch(`/api/v1/users-mongodb?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Fehler beim Laden der Staff-Benutzer')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/users-mongodb/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      setUsers(users.filter(user => user._id !== userId))
      toast.success('Benutzer erfolgreich gelöscht!')
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('Fehler beim Löschen des Benutzers')
    }
  }

  const handleUpdateUserStatus = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      const response = await fetch(`/api/v1/users-mongodb/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, status: newStatus }
          : user
      ))
      
      toast.success(`Benutzer ${newStatus === 'ACTIVE' ? 'aktiviert' : 'deaktiviert'}!`)
    } catch (error) {
      console.error('Failed to update user status:', error)
      toast.error('Fehler beim Aktualisieren des Benutzerstatus')
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

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Benutzer</h1>
            <p className="text-muted-foreground">
              Verwalten Sie alle Benutzer und deren Berechtigungen
            </p>
          </div>
          <Button onClick={() => router.push('/portal/users/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Benutzer
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Benutzer suchen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Nach Name oder E-Mail suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Benutzer gefunden</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Keine Benutzer entsprechen Ihren Suchkriterien.' : 'Erstellen Sie den ersten Benutzer.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => router.push('/portal/users/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten Benutzer erstellen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://ui-avatars.com/api/v1/?name=${encodeURIComponent(user.name)}&background=random`} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                        {getDepartmentBadge(user.departments || [])}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Erstellt: {formatDate(user.createdAt)}
                        </div>
                        {user.lastLoginAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Letzter Login: {formatDate(user.lastLoginAt)}
                          </div>
                        )}
                      </div>
                      {user._count && (
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{user._count.tasks} Aufgaben</span>
                          <span>{user._count.projects} Projekte</span>
                          <span>{user._count.tickets} Tickets</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateUserStatus(user._id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                    >
                      {user.status === 'ACTIVE' ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/portal/users/${user._id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUserToDelete(user)
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Vorherige
          </Button>
          <span className="text-sm text-muted-foreground">
            Seite {currentPage} von {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Nächste
          </Button>
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setUserToDelete(null)
        }}
        onConfirm={async () => {
          if (userToDelete) {
            await handleDeleteUser(userToDelete._id)
            setShowDeleteDialog(false)
            setUserToDelete(null)
          }
        }}
        title="Benutzer löschen"
        description={`Möchten Sie den Benutzer "${userToDelete?.name}" wirklich löschen?`}
        entityName={userToDelete?.name || ''}
        entityType="task"
      />
    </AdminLayout>
  )
}
