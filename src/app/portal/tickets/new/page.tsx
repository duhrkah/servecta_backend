'use client'

import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Save,
  Ticket,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function NewTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    type: 'SUPPORT',
    assigneeId: '',
    dueDate: '',
    tags: [] as string[]
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/v1/users-mongodb')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Bitte geben Sie einen Titel ein')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/v1/tickets-mongodb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          assigneeId: formData.assigneeId || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create ticket')
      }

      const newTicket = await response.json()
      toast.success('Ticket erfolgreich erstellt!')
      router.push(`/portal/tickets/${newTicket._id}`)
    } catch (error) {
      console.error('Failed to create ticket:', error)
      toast.error('Fehler beim Erstellen des Tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/portal/tickets')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Neues Ticket</h1>
              <p className="text-muted-foreground">
                Erstellen Sie ein neues Support-Ticket.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Form */}
            <div className="md:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Grundinformationen</CardTitle>
                  <CardDescription>
                    Geben Sie die grundlegenden Informationen zum Ticket ein.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Titel <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ticket-Titel eingeben..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Beschreibung</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detaillierte Beschreibung des Problems oder der Anfrage..."
                      className="min-h-32"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Zusätzliche Details</CardTitle>
                  <CardDescription>
                    Weitere Informationen zur Kategorisierung und Priorisierung.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Typ</label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUG">
                            <div className="flex items-center space-x-2">
                              <Badge variant="destructive">Bug</Badge>
                              <span>Fehlerbericht</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="FEATURE">
                            <div className="flex items-center space-x-2">
                              <Badge variant="default" className="bg-blue-100 text-blue-800">Feature</Badge>
                              <span>Feature-Anfrage</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="SUPPORT">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="border-purple-500 text-purple-600">Support</Badge>
                              <span>Support-Anfrage</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="TASK">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">Aufgabe</Badge>
                              <span>Allgemeine Aufgabe</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Priorität</label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="border-green-500 text-green-600">Niedrig</Badge>
                              <span>Niedrige Priorität</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">Mittel</Badge>
                              <span>Normale Priorität</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="HIGH">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="border-orange-500 text-orange-600">Hoch</Badge>
                              <span>Hohe Priorität</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="URGENT">
                            <div className="flex items-center space-x-2">
                              <Badge variant="destructive">Dringend</Badge>
                              <span>Sofortige Bearbeitung</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Fälligkeitsdatum</label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Wann sollte das Ticket bearbeitet werden?
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>
                    Der aktuelle Status des Tickets.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-blue-100 text-blue-800">Offen</Badge>
                          <span>Neues Ticket</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-yellow-100 text-yellow-800">In Bearbeitung</Badge>
                          <span>Wird bearbeitet</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="RESOLVED">
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">Gelöst</Badge>
                          <span>Problem behoben</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CLOSED">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">Geschlossen</Badge>
                          <span>Ticket geschlossen</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle>Zuweisung</CardTitle>
                  <CardDescription>
                    Weisen Sie das Ticket einem Benutzer zu.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.assigneeId || "unassigned"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value === "unassigned" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Benutzer auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Das Ticket kann später einem Benutzer zugewiesen werden.
                  </p>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Vorschau</CardTitle>
                  <CardDescription>
                    So wird das Ticket angezeigt.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{formData.title || 'Ticket-Titel'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {formData.type === 'BUG' && <Badge variant="destructive">Bug</Badge>}
                    {formData.type === 'FEATURE' && <Badge variant="default" className="bg-blue-100 text-blue-800">Feature</Badge>}
                    {formData.type === 'SUPPORT' && <Badge variant="outline" className="border-purple-500 text-purple-600">Support</Badge>}
                    {formData.type === 'TASK' && <Badge variant="secondary">Aufgabe</Badge>}
                    
                    {formData.priority === 'LOW' && <Badge variant="outline" className="border-green-500 text-green-600">Niedrig</Badge>}
                    {formData.priority === 'MEDIUM' && <Badge variant="outline" className="border-yellow-500 text-yellow-600">Mittel</Badge>}
                    {formData.priority === 'HIGH' && <Badge variant="outline" className="border-orange-500 text-orange-600">Hoch</Badge>}
                    {formData.priority === 'URGENT' && <Badge variant="destructive">Dringend</Badge>}
                  </div>
                  {formData.dueDate && (
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span>Fällig: {new Date(formData.dueDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Erstellen...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Ticket erstellen
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}