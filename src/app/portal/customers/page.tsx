'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Building,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Customer {
  _id: string
  legalName: string
  tradeName?: string
  vatId?: string
  industry?: string
  size?: string
  status: string
  addresses: any[]
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  contacts: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    role?: string
  }>
  projects: Array<{
    id: string
    status: string
  }>
  _count: {
    contacts: number
    projects: number
  }
}

export default function CustomersPage() {
  const { data: session } = useSession()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm, statusFilter])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
      })
      const response = await fetch(`/api/v1/customers-mongo?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        
        // Basierend auf der Benutzerrolle filtern
        let filteredCustomers = data.customers || []
        
        if (session?.user?.role === 'USER') {
          // USER: Nur Kunden anzeigen, denen der Benutzer zugewiesen ist
          filteredCustomers = filteredCustomers.filter((customer: Customer) => 
            (customer as any).assignedUsers?.includes(session.user.id)
          )
        }
        // MANAGER und ADMIN sehen alle Kunden
        
        setCustomers(filteredCustomers)
      } else {
        toast.error('Fehler beim Laden der Kunden.')
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      toast.error('Fehler beim Laden der Kunden.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
      INACTIVE: { label: 'Inaktiv', className: 'bg-gray-100 text-gray-800' },
      PENDING: { label: 'Ausstehend', className: 'bg-yellow-100 text-yellow-800' },
      SUSPENDED: { label: 'Gesperrt', className: 'bg-red-100 text-red-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const canCreateCustomer = () => {
    return session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN'
  }

  const canEditCustomer = () => {
    return session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN'
  }

  const canDeleteCustomer = () => {
    return session?.user?.role === 'ADMIN'
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kunden</h1>
            <p className="text-muted-foreground">
              {session?.user?.role === 'USER' 
                ? 'Ihre zugewiesenen Kunden' 
                : 'Verwalten Sie Ihre Kundenbeziehungen'
              }
            </p>
          </div>
          {canCreateCustomer() && (
            <Link href="/portal/customers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Kunde
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter & Suche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Suche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Firmenname, Branche, Tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Alle Status</option>
                  <option value="ACTIVE">Aktiv</option>
                  <option value="INACTIVE">Inaktiv</option>
                  <option value="PENDING">Ausstehend</option>
                  <option value="SUSPENDED">Gesperrt</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Grid */}
        {customers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Kunden gefunden</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Versuchen Sie andere Suchkriterien.'
                  : session?.user?.role === 'USER'
                    ? 'Sie haben noch keine Kunden zugewiesen bekommen.'
                    : 'Erstellen Sie Ihren ersten Kunden.'
                }
              </p>
              {canCreateCustomer() && (
                <Link href="/portal/customers/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Kunden erstellen
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card key={customer._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{customer.legalName}</CardTitle>
                      {customer.tradeName && (
                        <CardDescription className="mt-1">
                          {customer.tradeName}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(customer.status)}
                      {(canEditCustomer() || canDeleteCustomer()) && (
                        <div className="flex items-center space-x-1">
                          <Link href={`/portal/customers/${customer._id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {canEditCustomer() && (
                            <Link href={`/portal/customers/${customer._id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Industry */}
                    {customer.industry && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Building className="h-4 w-4 mr-2" />
                        {customer.industry}
                      </div>
                    )}

                    {/* Contacts */}
                    {customer.contacts && customer.contacts.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Ansprechpartner:</p>
                        {customer.contacts.slice(0, 2).map((contact) => (
                          <div key={contact.id} className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 mr-2" />
                            {contact.firstName} {contact.lastName}
                            {contact.role && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {contact.role}
                              </Badge>
                            )}
                          </div>
                        ))}
                        {customer.contacts.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{customer.contacts.length - 2} weitere
                          </p>
                        )}
                      </div>
                    )}

                    {/* Projects */}
                    {customer.projects && customer.projects.length > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="font-medium">Projekte:</span>
                        <Badge variant="outline" className="ml-2">
                          {customer.projects.length}
                        </Badge>
                      </div>
                    )}

                    {/* Tags */}
                    {customer.tags && customer.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {customer.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{customer.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Erstellt: {formatDate(customer.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {customers.length} Kunde{customers.length !== 1 ? 'n' : ''} gefunden
              </span>
              <span>
                {customers.filter(c => c.status === 'ACTIVE').length} aktiv
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
