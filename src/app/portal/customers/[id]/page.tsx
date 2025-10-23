'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog'
import { ArrowLeft, Edit, Save, X, Building, Mail, Phone, MapPin, Calendar, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  _id: string
  legalName: string
  tradeName?: string
  vatId?: string
  industry?: string
  size?: string
  status: string
  notes?: string
  addresses: Address[]
  contacts: Contact[]
  createdAt: string
  updatedAt: string
}

interface Address {
  _id: string
  type: string
  street: string
  city: string
  postalCode: string
  country: string
}

interface Contact {
  _id: string
  name: string
  email: string
  phone?: string
  position?: string
}

interface ConsumerUser {
  _id: string
  name: string
  email: string
  status: string
  createdAt: string
  lastLoginAt?: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    legalName: '',
    tradeName: '',
    vatId: '',
    industry: '',
    size: '',
    status: '',
    notes: ''
  })
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newAddress, setNewAddress] = useState({
    type: 'BUSINESS',
    street: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    isDefault: false
  })
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    isPrimary: false
  })
  const [consumerUsers, setConsumerUsers] = useState<ConsumerUser[]>([])
  const [showAddConsumerDialog, setShowAddConsumerDialog] = useState(false)
  const [newConsumer, setNewConsumer] = useState({
    name: '',
    email: '',
    password: '',
    status: 'ACTIVE'
  })

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/customers-mongo/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Kunde nicht gefunden')
            return
          }
          throw new Error('Failed to fetch customer')
        }
        
        const customerData = await response.json()
        
        // Ensure arrays exist
        const customer: Customer = {
          ...customerData,
          addresses: customerData.addresses || [],
          contacts: customerData.contacts || [],
        }
        
        setCustomer(customer)
        setEditData({
          legalName: customer.legalName,
          tradeName: customer.tradeName || '',
          vatId: customer.vatId || '',
          industry: customer.industry || '',
          size: customer.size || '',
          status: customer.status,
          notes: customer.notes || ''
        })
        
        // Consumer-Benutzer laden
        await fetchConsumerUsers()
      } catch (error) {
        console.error('Failed to fetch customer:', error)
        toast.error('Fehler beim Laden des Kunden')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [params.id])

  const fetchConsumerUsers = async () => {
    try {
      const response = await fetch(`/api/v1/consumers?customerId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setConsumerUsers(data.consumers || [])
      }
    } catch (error) {
      console.error('Error fetching consumer users:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
      INACTIVE: { label: 'Inaktiv', className: 'bg-gray-100 text-gray-800' },
      PROSPECT: { label: 'Interessent', className: 'bg-blue-100 text-blue-800' },
      SUSPENDED: { label: 'Gesperrt', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getSizeBadge = (size: string) => {
    const sizeConfig = {
      STARTUP: { label: 'Startup', className: 'bg-green-100 text-green-800' },
      SME: { label: 'KMU', className: 'bg-blue-100 text-blue-800' },
      ENTERPRISE: { label: 'Unternehmen', className: 'bg-purple-100 text-purple-800' }
    }
    
    const config = sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.SME
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/customers-mongo/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        throw new Error('Failed to update customer')
      }

      const updatedCustomer = await response.json()
      
      // Ensure arrays exist
      const customer: Customer = {
        ...updatedCustomer,
        addresses: updatedCustomer.addresses || [],
        contacts: updatedCustomer.contacts || [],
      }
      
      setCustomer(customer)
      setEditing(false)
      toast.success('Kunde erfolgreich aktualisiert!')
    } catch (error) {
      console.error('Failed to save customer:', error)
      toast.error('Fehler beim Speichern des Kunden')
    }
  }

  const handleAddConsumer = async () => {
    try {
      const response = await fetch('/api/v1/consumers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newConsumer,
          customerId: params.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create consumer user')
      }

      toast.success('Kunde-Benutzer erfolgreich erstellt!')
      setShowAddConsumerDialog(false)
      setNewConsumer({
        name: '',
        email: '',
        password: '',
        status: 'ACTIVE'
      })
      
      // Consumer-Benutzer neu laden
      await fetchConsumerUsers()
    } catch (error) {
      console.error('Error creating consumer user:', error)
      toast.error('Fehler beim Erstellen des Kunde-Benutzers')
    }
  }

  const handleDeleteConsumer = async (consumerId: string) => {
    try {
      const response = await fetch(`/api/v1/consumers/${consumerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete consumer user')
      }

      toast.success('Kunde-Benutzer erfolgreich gelöscht!')
      
      // Consumer-Benutzer neu laden
      await fetchConsumerUsers()
    } catch (error) {
      console.error('Error deleting consumer user:', error)
      toast.error('Fehler beim Löschen des Kunde-Benutzers')
    }
  }

  const handleAddAddress = async () => {
    try {
      const response = await fetch(`/api/v1/customers-mongo/${params.id}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAddress),
      })

      if (!response.ok) {
        throw new Error('Failed to add address')
      }

      // Refresh customer data
      const customerResponse = await fetch(`/api/v1/customers-mongo/${params.id}`)
      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        const customer: Customer = {
          ...customerData,
          addresses: customerData.addresses || [],
          contacts: customerData.contacts || [],
        }
        setCustomer(customer)
      }

      setNewAddress({
        type: 'BUSINESS',
        street: '',
        city: '',
        postalCode: '',
        country: 'Deutschland',
        isDefault: false
      })
      setShowAddAddress(false)
      toast.success('Adresse erfolgreich hinzugefügt!')
    } catch (error) {
      console.error('Failed to add address:', error)
      toast.error('Fehler beim Hinzufügen der Adresse')
    }
  }

  const handleAddContact = async () => {
    try {
      const response = await fetch(`/api/v1/customers-mongo/${params.id}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContact),
      })

      if (!response.ok) {
        throw new Error('Failed to add contact')
      }

      // Refresh customer data
      const customerResponse = await fetch(`/api/v1/customers-mongo/${params.id}`)
      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        const customer: Customer = {
          ...customerData,
          addresses: customerData.addresses || [],
          contacts: customerData.contacts || [],
        }
        setCustomer(customer)
      }

      setNewContact({
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        isPrimary: false
      })
      setShowAddContact(false)
      toast.success('Kontakt erfolgreich hinzugefügt!')
    } catch (error) {
      console.error('Failed to add contact:', error)
    }
  }

  const handleDeleteCustomer = async () => {
    try {
      const response = await fetch(`/api/v1/customers-mongo/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Deletion result:', result)
        toast.success('Kunde und alle verknüpften Daten erfolgreich gelöscht!')
        router.push('/portal/customers')
      } else {
        throw new Error('Failed to delete customer')
      }
    } catch (error) {
      console.error('Failed to delete customer:', error)
      throw error
    }
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Fehler</h2>
          <p className="text-red-700">Kunde nicht gefunden</p>
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
            <h1 className="text-3xl font-bold">{customer.legalName}</h1>
            <p className="text-muted-foreground">
              Kunde Details und Informationen
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kunde Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Firmenname *</label>
                    <Input
                      value={editData.legalName}
                      onChange={(e) => setEditData(prev => ({ ...prev, legalName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Handelsname</label>
                    <Input
                      value={editData.tradeName}
                      onChange={(e) => setEditData(prev => ({ ...prev, tradeName: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">USt-ID</label>
                      <Input
                        value={editData.vatId}
                        onChange={(e) => setEditData(prev => ({ ...prev, vatId: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Branche</label>
                      <Input
                        value={editData.industry}
                        onChange={(e) => setEditData(prev => ({ ...prev, industry: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Unternehmensgröße</label>
                      <Select
                        value={editData.size}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, size: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STARTUP">Startup</SelectItem>
                          <SelectItem value="SME">KMU</SelectItem>
                          <SelectItem value="ENTERPRISE">Unternehmen</SelectItem>
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
                          <SelectItem value="PROSPECT">Interessent</SelectItem>
                          <SelectItem value="SUSPENDED">Gesperrt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notizen</label>
                    <Textarea
                      value={editData.notes}
                      onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{customer.legalName}</h3>
                    {customer.tradeName && (
                      <p className="text-muted-foreground mb-2">Handelsname: {customer.tradeName}</p>
                    )}
                    <p className="text-muted-foreground">Branche: {customer.industry || 'Nicht angegeben'}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(customer.status)}
                    {customer.size && getSizeBadge(customer.size)}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">USt-ID:</span>
                      <span className="ml-2 font-medium">{customer.vatId || 'Nicht angegeben'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Erstellt:</span>
                      <span className="ml-2 font-medium">{formatDate(customer.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Aktualisiert:</span>
                      <span className="ml-2 font-medium">{formatDate(customer.updatedAt)}</span>
                    </div>
                  </div>
                  {customer.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notizen</h4>
                      <p className="text-muted-foreground">{customer.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Adressen</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAddress(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adresse hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddAddress && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-4">Neue Adresse hinzufügen</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Typ</label>
                        <Select
                          value={newAddress.type}
                          onValueChange={(value) => setNewAddress(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BUSINESS">Geschäftlich</SelectItem>
                            <SelectItem value="BILLING">Rechnungsadresse</SelectItem>
                            <SelectItem value="SHIPPING">Lieferadresse</SelectItem>
                            <SelectItem value="OTHER">Sonstige</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                        />
                        <label htmlFor="isDefault" className="text-sm">Standard-Adresse</label>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Straße</label>
                      <Input
                        value={newAddress.street}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="Musterstraße 123"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Postleitzahl</label>
                        <Input
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="10115"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Stadt</label>
                        <Input
                          value={newAddress.city}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Berlin"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Land</label>
                      <Input
                        value={newAddress.country}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Deutschland"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleAddAddress}>
                        <Save className="h-4 w-4 mr-2" />
                        Speichern
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddAddress(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {customer.addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Keine Adressen vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customer.addresses.map((address) => (
                    <div key={address._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{address.type}</h4>
                        {(address as any).isDefault && (
                          <Badge variant="secondary">Standard</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {address.street}<br />
                        {address.postalCode} {address.city}<br />
                        {address.country}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kontakte</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddContact(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Kontakt hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddContact && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-4">Neuen Kontakt hinzufügen</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Name *</label>
                        <Input
                          value={newContact.name}
                          onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Max Mustermann"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">E-Mail *</label>
                        <Input
                          type="email"
                          value={newContact.email}
                          onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="max.mustermann@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Telefon</label>
                        <Input
                          value={newContact.phone}
                          onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+49 30 12345678"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Position</label>
                        <Input
                          value={newContact.position}
                          onChange={(e) => setNewContact(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Projektmanager"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Abteilung</label>
                      <Input
                        value={newContact.department}
                        onChange={(e) => setNewContact(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="IT"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPrimary"
                        checked={newContact.isPrimary}
                        onChange={(e) => setNewContact(prev => ({ ...prev, isPrimary: e.target.checked }))}
                      />
                      <label htmlFor="isPrimary" className="text-sm">Hauptansprechpartner</label>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleAddContact}>
                        <Save className="h-4 w-4 mr-2" />
                        Speichern
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddContact(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {customer.contacts.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Keine Kontakte vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customer.contacts.map((contact) => (
                    <div key={contact._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{contact.name}</h4>
                        <div className="flex items-center space-x-2">
                          {(contact as any).isPrimary && (
                            <Badge variant="secondary">Hauptansprechpartner</Badge>
                          )}
                          {contact.position && (
                            <span className="text-sm text-muted-foreground">{contact.position}</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-2" />
                          {contact.email}
                        </div>
                        {contact.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-2" />
                            {contact.phone}
                          </div>
                        )}
                        {(contact as any).department && (
                          <div className="flex items-center">
                            <Building className="h-3 w-3 mr-2" />
                            {(contact as any).department}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Consumer Users, Customer Info, Quick Actions */}
        <div className="space-y-6">
          {/* Consumer-Benutzer */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kunde-Benutzer</CardTitle>
                <Button onClick={() => setShowAddConsumerDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Kunde hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddConsumerDialog && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-4">Neuer Kunde-Benutzer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <Input
                        value={newConsumer.name}
                        onChange={(e) => setNewConsumer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Max Mustermann"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">E-Mail</label>
                      <Input
                        value={newConsumer.email}
                        onChange={(e) => setNewConsumer(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="max@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Passwort</label>
                      <Input
                        type="password"
                        value={newConsumer.password}
                        onChange={(e) => setNewConsumer(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Mindestens 6 Zeichen"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select
                        value={newConsumer.status}
                        onValueChange={(value) => setNewConsumer(prev => ({ ...prev, status: value }))}
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
                  <div className="flex space-x-2 mt-4">
                    <Button onClick={handleAddConsumer}>
                      <Save className="h-4 w-4 mr-2" />
                      Speichern
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddConsumerDialog(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Abbrechen
                    </Button>
                  </div>
                </div>
              )}
              
              {consumerUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Keine Kunde-Benutzer vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consumerUsers.map((consumer) => (
                    <div key={consumer._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{consumer.name}</h4>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(consumer.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConsumer(consumer._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-2" />
                          {consumer.email}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-2" />
                          Erstellt: {new Date(consumer.createdAt).toLocaleDateString('de-DE')}
                        </div>
                        {consumer.lastLoginAt && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-2" />
                            Letzter Login: {new Date(consumer.lastLoginAt).toLocaleDateString('de-DE')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kunde Info */}
          <Card>
            <CardHeader>
              <CardTitle>Kunde Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Kunden-ID:</span>
                  <p className="font-mono text-sm">{customer._id}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div className="mt-1">
                    {getStatusBadge(customer.status)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schnellaktionen */}
          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Building className="h-4 w-4 mr-2" />
                Projekte anzeigen
              </Button>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                E-Mail senden
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteCustomer}
        title="Kunde löschen"
        description={`Möchten Sie den Kunden "${customer.legalName}" wirklich löschen?`}
        entityName={customer.legalName}
        entityType="customer"
      />
    </AdminLayout>
  )
}