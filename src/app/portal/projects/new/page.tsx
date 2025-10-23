'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import AdminLayout from '@/components/admin-layout'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  _id: string
  legalName: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'PLANNING',
    customerId: '',
    budget: 0,
    startDate: '',
    endDate: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/v1/customers-mongo?limit=100')
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error)
        toast.error('Fehler beim Laden der Kunden')
      }
    }

    fetchCustomers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Client-side validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Projektname ist erforderlich'
    if (!formData.code.trim()) newErrors.code = 'Projektcode ist erforderlich'
    if (!formData.customerId) newErrors.customerId = 'Kunde ist erforderlich'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/v1/projects-mongodb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const project = await response.json()
        toast.success('Projekt erfolgreich erstellt!')
        router.push(`/portal/projects/${project._id}`)
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        
        if (errorData.details) {
          // Handle Zod validation errors
          console.log('Validation details:', errorData.details)
          const validationErrors: Record<string, string> = {}
          errorData.details.forEach((error: any) => {
            console.log('Validation error:', error)
            validationErrors[error.path[0]] = error.message
          })
          setErrors(validationErrors)
        } else {
          setErrors({ general: errorData.message || 'Fehler beim Erstellen des Projekts' })
        }
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Fehler beim Erstellen des Projekts')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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
        <h1 className="text-3xl font-bold">Neues Projekt</h1>
        <p className="text-muted-foreground">
          Erstellen Sie ein neues Projekt für einen Kunden
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Projekt Details</CardTitle>
        </CardHeader>
        <CardContent>
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Projektname eingeben..."
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="code">Projektcode *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="z.B. PROJ-2024-001"
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && (
                <p className="text-sm text-red-500 mt-1">{errors.code}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Detaillierte Beschreibung des Projekts..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="PLANNING">Planung</SelectItem>
                    <SelectItem value="ACTIVE">Aktiv</SelectItem>
                    <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                    <SelectItem value="ON_HOLD">Pausiert</SelectItem>
                    <SelectItem value="CANCELLED">Abgebrochen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budget">Budget (€)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder="0"
                  className={errors.budget ? 'border-red-500' : ''}
                />
                {errors.budget && (
                  <p className="text-sm text-red-500 mt-1">{errors.budget}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="customerId">Kunde *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => handleChange('customerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kunde auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-sm text-red-500 mt-1">{errors.customerId}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">Enddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
                )}
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
                {loading ? 'Erstellen...' : 'Projekt erstellen'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}