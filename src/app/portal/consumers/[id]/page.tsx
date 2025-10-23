'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog'
import { ArrowLeft, Edit, Save, X, Trash2, Mail, Calendar, Building, User } from 'lucide-react'
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

export default function ConsumerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [consumer, setConsumer] = useState<ConsumerUser | null>(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    status: 'ACTIVE'
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchConsumer()
  }, [params.id])

  const fetchConsumer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/consumers/${params.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Consumer-Benutzer nicht gefunden')
          return
        }
        throw new Error('Failed to fetch consumer')
      }

      const consumerData = await response.json()
      setConsumer(consumerData)
      setEditData({
        name: consumerData.name,
        email: consumerData.email,
        status: consumerData.status
      })
    } catch (error) {
      console.error('Failed to fetch consumer:', error)
      toast.error('Fehler beim Laden des Consumer-Benutzers')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/consumers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        throw new Error('Failed to update consumer')
      }

      toast.success('Consumer-Benutzer erfolgreich aktualisiert!')
      setEditing(false)
      fetchConsumer()
    } catch (error) {
      console.error('Failed to update consumer:', error)
      toast.error('Fehler beim Aktualisieren des Consumer-Benutzers')
    }
  }

  const handleDeleteConsumer = async () => {
    try {
      const response = await fetch(`/api/v1/consumers/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete consumer')
      }

      toast.success('Consumer-Benutzer erfolgreich gelöscht!')
      router.push('/portal/consumers')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Consumer-Benutzer wird geladen...</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Lade Consumer-Benutzer...</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Info</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  if (!consumer) {
    return (
      <AdminLayout>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/portal/consumers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Consumer-Benutzer nicht gefunden</h2>
        </div>
        <p className="mt-4 text-muted-foreground">Der angeforderte Consumer-Benutzer konnte nicht geladen werden oder existiert nicht.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/portal/consumers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{consumer.name}</h2>
            <p className="text-muted-foreground">Consumer-Benutzer Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(consumer.status)}
          {getRoleBadge(consumer.role)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Consumer-Benutzer Details</CardTitle>
                <div className="flex space-x-2">
                  {editing ? (
                    <>
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Abbrechen
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Speichern
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name *</label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">E-Mail *</label>
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    />
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
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{consumer.name}</h3>
                    <p className="text-muted-foreground">{consumer.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Kunde:</span>
                      <span className="ml-2 font-medium">{consumer.customerName || 'Unbekannt'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Erstellt:</span>
                      <span className="ml-2 font-medium">{formatDate(consumer.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Aktualisiert:</span>
                      <span className="ml-2 font-medium">{formatDate(consumer.updatedAt)}</span>
                    </div>
                    {consumer.lastLoginAt && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Letzter Login:</span>
                        <span className="ml-2 font-medium">{formatDate(consumer.lastLoginAt)}</span>
                      </div>
                    )}
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
              <CardTitle>Consumer-Benutzer Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Consumer-ID:</span>
                  <p className="font-mono text-sm">{consumer._id}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div className="mt-1">
                    {getStatusBadge(consumer.status)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Rolle:</span>
                  <div className="mt-1">
                    {getRoleBadge(consumer.role)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                E-Mail senden
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Consumer-Benutzer löschen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConsumer}
        title="Consumer-Benutzer löschen"
        description={`Möchten Sie den Consumer-Benutzer "${consumer.name}" wirklich löschen?`}
        entityName={consumer.name}
        entityType="customer"
      />
    </AdminLayout>
  )
}
