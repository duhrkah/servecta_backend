'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import AdminLayout from '@/components/admin-layout'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'

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
  phone: string
  position: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    legalName: '',
    tradeName: '',
    vatId: '',
    industry: '',
    size: 'SMALL',
    status: 'ACTIVE',
    notes: ''
  })
  const [addresses, setAddresses] = useState<Address[]>([
    {
      _id: '1',
      type: 'BUSINESS',
      street: '',
      city: '',
      postalCode: '',
      country: 'Deutschland'
    }
  ])
  const [contacts, setContacts] = useState<Contact[]>([
    {
      _id: '1',
      name: '',
      email: '',
      phone: '',
      position: ''
    }
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/v1/customers-mongo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          addresses: addresses.filter(addr => addr.street && addr.city),
          contacts: contacts.filter(contact => contact.name && contact.email)
        }),
      })

      if (response.ok) {
        const customer = await response.json()
        toast.success('Kunde erfolgreich erstellt!')
        router.push(`/portal/customers/${customer._id}`)
      } else {
        const errorData = await response.json()
        setErrors(errorData.errors || { general: 'Fehler beim Erstellen des Kunden' })
      }
    } catch (error) {
      console.error('Failed to create customer:', error)
      toast.error('Fehler beim Erstellen des Kunden')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddressChange = (index: number, field: keyof Address, value: string) => {
    setAddresses(prev => prev.map((addr, i) => 
      i === index ? { ...addr, [field]: value } : addr
    ))
  }

  const handleContactChange = (index: number, field: keyof Contact, value: string) => {
    setContacts(prev => prev.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    ))
  }

  const addAddress = () => {
    setAddresses(prev => [...prev, {
      _id: Date.now().toString(),
      type: 'BUSINESS',
      street: '',
      city: '',
      postalCode: '',
      country: 'Deutschland'
    }])
  }

  const removeAddress = (index: number) => {
    if (addresses.length > 1) {
      setAddresses(prev => prev.filter((_, i) => i !== index))
    }
  }

  const addContact = () => {
    setContacts(prev => [...prev, {
      _id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      position: ''
    }])
  }

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(prev => prev.filter((_, i) => i !== index))
    }
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
        <h1 className="text-3xl font-bold">Neuer Kunde</h1>
        <p className="text-muted-foreground">
          Erstellen Sie einen neuen Kunden im System
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kunde Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="legalName">Firmenname *</Label>
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={(e) => handleChange('legalName', e.target.value)}
                    placeholder="ACME Corporation GmbH"
                    className={errors.legalName ? 'border-red-500' : ''}
                  />
                  {errors.legalName && (
                    <p className="text-sm text-red-500 mt-1">{errors.legalName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tradeName">Handelsname</Label>
                  <Input
                    id="tradeName"
                    value={formData.tradeName}
                    onChange={(e) => handleChange('tradeName', e.target.value)}
                    placeholder="ACME Corp"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vatId">USt-ID</Label>
                    <Input
                      id="vatId"
                      value={formData.vatId}
                      onChange={(e) => handleChange('vatId', e.target.value)}
                      placeholder="DE123456789"
                    />
                  </div>

                  <div>
                    <Label htmlFor="industry">Branche</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleChange('industry', e.target.value)}
                      placeholder="Technology"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="size">Unternehmensgröße</Label>
                    <Select
                      value={formData.size}
                      onValueChange={(value) => handleChange('size', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STARTUP">Startup</SelectItem>
                        <SelectItem value="SMALL">Klein</SelectItem>
                        <SelectItem value="MEDIUM">Mittel</SelectItem>
                        <SelectItem value="LARGE">Groß</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value)}
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
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Zusätzliche Informationen über den Kunden..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Adressen</CardTitle>
                  <Button type="button" onClick={addAddress} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adresse hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.map((address, index) => (
                  <div key={address._id} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-2">
                      <Label>Typ</Label>
                      <Select
                        value={address.type}
                        onValueChange={(value) => handleAddressChange(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUSINESS">Geschäftlich</SelectItem>
                          <SelectItem value="BILLING">Rechnungsadresse</SelectItem>
                          <SelectItem value="SHIPPING">Lieferadresse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Label>Straße</Label>
                      <Input
                        value={address.street}
                        onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                        placeholder="Musterstraße 123"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>PLZ</Label>
                      <Input
                        value={address.postalCode}
                        onChange={(e) => handleAddressChange(index, 'postalCode', e.target.value)}
                        placeholder="10115"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Stadt</Label>
                      <Input
                        value={address.city}
                        onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                        placeholder="Berlin"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAddress(index)}
                        disabled={addresses.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Kontakte</CardTitle>
                  <Button type="button" onClick={addContact} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Kontakt hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={contact._id} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-3">
                      <Label>Name</Label>
                      <Input
                        value={contact.name}
                        onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                        placeholder="Max Mustermann"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>E-Mail</Label>
                      <Input
                        type="email"
                        value={contact.email}
                        onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                        placeholder="max@example.com"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Telefon</Label>
                      <Input
                        value={contact.phone}
                        onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                        placeholder="+49 30 12345678"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Position</Label>
                      <Input
                        value={contact.position}
                        onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                        placeholder="Projektmanager"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeContact(index)}
                        disabled={contacts.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zusammenfassung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Firmenname:</span>
                    <p className="font-medium">{formData.legalName || 'Nicht angegeben'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <p className="font-medium">{formData.status}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Adressen:</span>
                    <p className="font-medium">{addresses.filter(addr => addr.street && addr.city).length}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Kontakte:</span>
                    <p className="font-medium">{contacts.filter(contact => contact.name && contact.email).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Erstellen...' : 'Kunde erstellen'}
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}