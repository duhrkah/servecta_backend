'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  _id: string
  legalName: string
  tradeName?: string
}

export default function NewConsumerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    customerId: '',
    status: 'ACTIVE'
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/v1/customers-mongo')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password || !formData.customerId) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/v1/consumers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Erstellen des Consumer-Benutzers')
      }

      toast.success('Consumer-Benutzer erfolgreich erstellt!')
      router.push('/portal/consumers')
    } catch (error: any) {
      console.error('Failed to create consumer:', error)
      toast.error(error.message || 'Fehler beim Erstellen des Consumer-Benutzers')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/portal/consumers')
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
            <h1 className="text-3xl font-bold">Neuer Consumer-Benutzer</h1>
            <p className="text-muted-foreground">
              Erstellen Sie einen neuen Kunden-Benutzer
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consumer-Benutzer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Max Mustermann"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  E-Mail *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="max@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Passwort *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mindestens 6 Zeichen"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Kunde *
                </label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kunde auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.legalName} {customer.tradeName && `(${customer.tradeName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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

            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Erstelle...' : 'Consumer-Benutzer erstellen'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Rollen-Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Consumer-Benutzer</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Kann nur eigene Projekte, Tasks und Tickets anzeigen</li>
                <li>• Kann neue Tickets erstellen</li>
                <li>• Kann keine anderen Benutzer verwalten</li>
                <li>• Eingeschränkte Berechtigungen für Datenschutz</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
