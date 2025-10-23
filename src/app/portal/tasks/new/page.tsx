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

interface Project {
  _id: string
  name: string
}

interface User {
  _id: string
  name: string
}

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    projectId: '',
    dueDate: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          fetch('/api/v1/projects-mongodb?limit=100'),
          fetch('/api/v1/users-mongodb?userType=STAFF')
        ])

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData.projects || [])
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Fehler beim Laden der Daten')
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/v1/tasks-mongodb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const task = await response.json()
        toast.success('Aufgabe erfolgreich erstellt!')
        router.push(`/portal/tasks/${task._id}`)
      } else {
        const errorData = await response.json()
        setErrors(errorData.errors || { general: 'Fehler beim Erstellen der Aufgabe' })
      }
    } catch (error) {
      console.error('Failed to create task:', error)
      toast.error('Fehler beim Erstellen der Aufgabe')
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
        <h1 className="text-3xl font-bold">Neue Aufgabe</h1>
        <p className="text-muted-foreground">
          Erstellen Sie eine neue Aufgabe für ein Projekt
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Aufgabe Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Aufgabentitel eingeben..."
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Detaillierte Beschreibung der Aufgabe..."
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
                    <SelectItem value="TODO">Zu erledigen</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
                    <SelectItem value="DONE">Erledigt</SelectItem>
                    <SelectItem value="CANCELLED">Abgebrochen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priorität</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Niedrig</SelectItem>
                    <SelectItem value="MEDIUM">Mittel</SelectItem>
                    <SelectItem value="HIGH">Hoch</SelectItem>
                    <SelectItem value="URGENT">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectId">Projekt *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => handleChange('projectId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Projekt auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.projectId && (
                  <p className="text-sm text-red-500 mt-1">{errors.projectId}</p>
                )}
              </div>

              <div>
                <Label htmlFor="assigneeId">Zugewiesen an</Label>
                <Select
                  value={formData.assigneeId}
                  onValueChange={(value) => handleChange('assigneeId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Benutzer auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className={errors.dueDate ? 'border-red-500' : ''}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>
              )}
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
                {loading ? 'Erstellen...' : 'Aufgabe erstellen'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}