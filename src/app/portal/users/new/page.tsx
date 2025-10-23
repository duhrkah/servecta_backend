'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AdminLayout from '@/components/admin-layout'
import { ArrowLeft, Save, User, Mail, Shield, UserCheck, Building, Monitor } from 'lucide-react'
import { toast } from 'sonner'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MITARBEITER',
    status: 'ACTIVE',
    departments: ['IT']
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    if (!formData.name.trim()) {
      toast.error('Name ist erforderlich')
      return
    }
    
    if (!formData.email.trim()) {
      toast.error('E-Mail ist erforderlich')
      return
    }
    
    if (!formData.password.trim()) {
      toast.error('Passwort ist erforderlich')
      return
    }
    
    if (formData.password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/users-mongodb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      const newUser = await response.json()
      toast.success('Benutzer erfolgreich erstellt!')
      router.push(`/portal/users/${newUser._id}`)
    } catch (error) {
      console.error('Failed to create user:', error)
      toast.error(error instanceof Error ? error.message : 'Fehler beim Erstellen des Benutzers')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
            <h1 className="text-3xl font-bold">Neuer Benutzer</h1>
            <p className="text-muted-foreground">
              Erstellen Sie einen neuen Benutzer für das System
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Benutzer Informationen
            </CardTitle>
            <CardDescription>
              Geben Sie die grundlegenden Informationen für den neuen Benutzer ein.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Vollständiger Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Max Mustermann"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-Mail-Adresse *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="max.mustermann@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Passwort *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Das Passwort muss mindestens 6 Zeichen lang sein.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Rolle
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rolle auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MITARBEITER">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Mitarbeiter
                        </div>
                      </SelectItem>
                      <SelectItem value="MANAGER">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrator
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">
                    {formData.role === 'MITARBEITER' && 'Kann eigene Aufgaben und Projekte anzeigen'}
                    {formData.role === 'MANAGER' && 'Kann Projekte und Aufgaben verwalten'}
                    {formData.role === 'ADMIN' && 'Vollzugriff auf alle Systemfunktionen'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departments" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Abteilungen
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="it-department-new"
                        checked={formData.departments.includes('IT')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              departments: [...prev.departments, 'IT'] 
                            }))
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              departments: prev.departments.filter(d => d !== 'IT') 
                            }))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="it-department-new" className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        IT
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="datenschutz-department-new"
                        checked={formData.departments.includes('DATENSCHUTZ')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              departments: [...prev.departments, 'DATENSCHUTZ'] 
                            }))
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              departments: prev.departments.filter(d => d !== 'DATENSCHUTZ') 
                            }))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="datenschutz-department-new" className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Datenschutz
                      </label>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formData.departments.includes('IT') && formData.departments.includes('DATENSCHUTZ') && 'Mitarbeiter in beiden Abteilungen'}
                    {formData.departments.includes('IT') && !formData.departments.includes('DATENSCHUTZ') && 'IT-Abteilung - Technische Projekte und Support'}
                    {!formData.departments.includes('IT') && formData.departments.includes('DATENSCHUTZ') && 'Datenschutz-Abteilung - Compliance und Datenschutz'}
                    {!formData.departments.includes('IT') && !formData.departments.includes('DATENSCHUTZ') && 'Bitte wählen Sie mindestens eine Abteilung aus'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktiv</SelectItem>
                      <SelectItem value="INACTIVE">Inaktiv</SelectItem>
                      <SelectItem value="PENDING">Ausstehend</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">
                    {formData.status === 'ACTIVE' && 'Benutzer kann sich anmelden und arbeiten'}
                    {formData.status === 'INACTIVE' && 'Benutzer ist deaktiviert'}
                    {formData.status === 'PENDING' && 'Benutzer wartet auf Aktivierung'}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Benutzer erstellen
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Rollen-Informationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-800">Benutzer</h4>
                <p className="text-sm text-muted-foreground">
                  Kann eigene Aufgaben anzeigen und bearbeiten, Projekte einsehen, Tickets erstellen und bearbeiten.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-800">Manager</h4>
                <p className="text-sm text-muted-foreground">
                  Alle Benutzer-Rechte plus: Projektverwaltung, Aufgabenverwaltung, Kundenverwaltung, Rechnungsverwaltung.
                </p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-red-800">Administrator</h4>
                <p className="text-sm text-muted-foreground">
                  Alle Manager-Rechte plus: Benutzerverwaltung, Systemeinstellungen, DSGVO-Tools, Audit-Logs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}