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
  Clock,
  Building
} from 'lucide-react'
import { toast } from 'sonner'

interface ConsumerUser {
  _id: string
  name: string
  email: string
  role: 'KUNDE'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  customerId: string
  customerName?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

interface ConsumersResponse {
  consumers: ConsumerUser[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ConsumersPage() {
  const router = useRouter()
  const [consumers, setConsumers] = useState<ConsumerUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchConsumers()
  }, [currentPage, searchTerm, statusFilter])

  const fetchConsumers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })

      const response = await fetch(`/api/v1/consumers?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch consumers')
      }

      const data: ConsumersResponse = await response.json()
      setConsumers(data.consumers)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Failed to fetch consumers:', error)
      toast.error('Fehler beim Laden der Consumer-Benutzer')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/consumers/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete consumer')
      }

      toast.success('Consumer-Benutzer erfolgreich gelöscht!')
      setShowDeleteDialog(false)
      setUserToDelete(null)
      fetchConsumers()
    } catch (error) {
      console.error('Failed to delete consumer:', error)
      toast.error('Fehler beim Löschen des Consumer-Benutzers')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
      INACTIVE: { label: 'Inaktiv', className: 'bg-red-100 text-red-800' },
      PENDING: { label: 'Ausstehend', className: 'bg-yellow-100 text-yellow-800' },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return config ? (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{status}</Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      KUNDE: { label: 'Kunde', className: 'bg-blue-100 text-blue-800' },
    }
    const config = roleConfig[role as keyof typeof roleConfig]
    return config ? (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{role}</Badge>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredConsumers = consumers.filter(consumer => {
    const matchesSearch = !searchTerm || 
      consumer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consumer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (consumer.customerName && consumer.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || consumer.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Consumer-Benutzer</h1>
            <p className="text-muted-foreground">
              Verwaltung der Kunden-Benutzer
            </p>
          </div>
          <Link href="/portal/consumers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Consumer-Benutzer
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Consumer-Benutzer suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">Alle Status</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="INACTIVE">Inaktiv</option>
            <option value="PENDING">Ausstehend</option>
          </select>
        </div>
      </div>

      {/* Consumer Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredConsumers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Consumer-Benutzer gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Versuchen Sie andere Suchkriterien.' 
                : 'Erstellen Sie den ersten Consumer-Benutzer.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link href="/portal/consumers/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Consumer-Benutzer
                </Button>
              </Link>
            )}
          </div>
        ) : (
          filteredConsumers.map((consumer) => (
            <Card key={consumer._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${consumer.name}`} />
                      <AvatarFallback>{getInitials(consumer.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{consumer.name}</h3>
                      <p className="text-sm text-muted-foreground">{consumer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(consumer.status)}
                    {getRoleBadge(consumer.role)}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    <span>Kunde: {consumer.customerName || 'Unbekannt'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Erstellt: {new Date(consumer.createdAt).toLocaleDateString('de-DE')}</span>
                  </div>
                  {consumer.lastLoginAt && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Letzter Login: {new Date(consumer.lastLoginAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Link href={`/portal/consumers/${consumer._id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUserToDelete(consumer._id)
                      setShowDeleteDialog(true)
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Zurück
          </Button>
          <span className="text-sm text-muted-foreground">
            Seite {currentPage} von {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Weiter
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
            await handleDeleteUser(userToDelete)
          }
        }}
        title="Consumer-Benutzer löschen"
        description="Möchten Sie diesen Consumer-Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        entityName={userToDelete ? consumers.find(u => u._id === userToDelete)?.name || '' : ''}
        entityType="customer"
      />
    </AdminLayout>
  )
}
