'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import AdminLayout from '@/components/admin-layout'
import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog'
import { ArrowLeft, Edit, Save, X, MessageSquare, User, Calendar, Clock, Trash2, CheckSquare, Plus, MoreHorizontal, Trash } from 'lucide-react'
import { toast } from 'sonner'

interface Task {
  _id: string
  title: string
  description: string
  status: string
  priority: string
  departments?: ('IT' | 'DATENSCHUTZ')[]
  assigneeId: string
  assigneeName: string
  assignee?: {
    _id: string
    name: string
    email: string
  }
  projectId: string
  projectName: string
  dueDate: string
  createdAt: string
  updatedAt: string
  comments: Comment[]
}

interface User {
  _id: string
  name: string
  email: string
  role: string
  status: string
}

interface Comment {
  _id: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [task, setTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: '',
    assigneeId: '',
    departments: [] as ('IT' | 'DATENSCHUTZ')[]
  })
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: ''
  })
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [quickAssignUserId, setQuickAssignUserId] = useState('')

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/tasks-mongodb/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Aufgabe nicht gefunden')
            return
          }
          throw new Error('Failed to fetch task')
        }
        
        const taskData = await response.json()
        
        const task: Task = {
          ...taskData,
          assigneeName: taskData.assignee?.name || 'Nicht zugewiesen',
          projectName: taskData.project?.name || 'Kein Projekt',
          comments: taskData.comments || [],
        }
        
        setTask(task)
        setEditData({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          dueDate: formatDateForInput(task.dueDate),
          assigneeId: task.assigneeId || '',
          departments: task.departments || []
        })
      } catch (error) {
        console.error('Failed to fetch task:', error)
        toast.error('Aufgabe nicht gefunden')
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [params.id])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/v1/users-mongodb?userType=STAFF')
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

  useEffect(() => {
    const fetchSubtasks = async () => {
      try {
        const response = await fetch(`/api/v1/tasks-mongodb/${params.id}/subtasks`)
        
        if (response.ok) {
          const subtasksData = await response.json()
          setSubtasks(subtasksData)
        }
      } catch (error) {
        console.error('Failed to fetch subtasks:', error)
      }
    }
    
    fetchSubtasks()
  }, [params.id])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      TODO: { label: 'Zu erledigen', className: 'bg-gray-100 text-gray-800' },
      IN_PROGRESS: { label: 'In Bearbeitung', className: 'bg-blue-100 text-blue-800' },
      DONE: { label: 'Erledigt', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Abgebrochen', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.TODO
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: 'Niedrig', className: 'bg-green-100 text-green-800' },
      MEDIUM: { label: 'Mittel', className: 'bg-yellow-100 text-yellow-800' },
      HIGH: { label: 'Hoch', className: 'bg-orange-100 text-orange-800' },
      URGENT: { label: 'Dringend', className: 'bg-red-100 text-red-800' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/tasks-mongodb/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editData,
          assigneeId: editData.assigneeId || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const updatedTaskData = await response.json()
      
      const task: Task = {
        ...updatedTaskData,
        assigneeName: updatedTaskData.assignee?.name || 'Nicht zugewiesen',
        projectName: updatedTaskData.project?.name || 'Kein Projekt',
        comments: updatedTaskData.comments || [],
      }
      
      setTask(task)
      setEditing(false)
      toast.success('Aufgabe erfolgreich aktualisiert!')
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const getDepartmentBadge = (departments?: string[]) => {
    const departmentConfig = {
      IT: { label: 'IT', className: 'bg-blue-100 text-blue-800' },
      DATENSCHUTZ: { label: 'Datenschutz', className: 'bg-purple-100 text-purple-800' }
    }
    
    // Fallback für alte Daten oder undefined
    const departmentsArray = Array.isArray(departments) ? departments : []
    
    return (
      <div className="flex gap-1 flex-wrap">
        {departmentsArray.map((department) => {
          const config = departmentConfig[department as keyof typeof departmentConfig]
          return config ? (
            <Badge key={department} variant="secondary" className={config.className}>
              {config.label}
            </Badge>
          ) : null
        })}
      </div>
    )
  }

  const handleDeleteTask = async () => {
    try {
      const response = await fetch(`/api/v1/tasks-mongodb/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Deletion result:', result)
        toast.success('Aufgabe erfolgreich gelöscht!')
        router.push('/portal/tasks')
      } else {
        throw new Error('Failed to delete task')
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
      throw error
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/v1/tasks-mongodb/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const newCommentData = await response.json()
      
      setTask(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), newCommentData]
      } : null)
      
      setNewComment('')
      toast.success('Kommentar hinzugefügt!')
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Fehler beim Hinzufügen des Kommentars')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/v1/tasks-mongodb/${params.id}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Sie haben keine Berechtigung, diesen Kommentar zu löschen')
          return
        }
        throw new Error('Failed to delete comment')
      }

      setTask(prev => prev ? {
        ...prev,
        comments: (prev.comments || []).filter(comment => comment._id !== commentId)
      } : null)
      
      toast.success('Kommentar gelöscht!')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('Fehler beim Löschen des Kommentars')
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.title.trim()) return

    try {
      const response = await fetch(`/api/v1/tasks-mongodb/${params.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSubtask),
      })

      if (!response.ok) {
        throw new Error('Failed to create subtask')
      }

      const newSubtaskData = await response.json()
      
      // Add the new subtask to the subtasks list
      setSubtasks(prev => [newSubtaskData, ...prev])
      
      // Update the task's subtask count
      setTask(prev => prev ? {
        ...prev,
        _count: {
          ...(prev as any)._count,
          subtasks: ((prev as any)._count?.subtasks || 0) + 1
        }
      } : null)
      
      setNewSubtask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: ''
      })
      setShowAddSubtask(false)
      toast.success('Unteraufgabe erstellt!')
    } catch (error) {
      console.error('Failed to create subtask:', error)
      toast.error('Fehler beim Erstellen der Unteraufgabe')
    }
  }

  const handleQuickAssign = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/tasks-mongodb/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigneeId: userId || null }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign task')
      }

      const updatedTaskData = await response.json()
      
      const task: Task = {
        ...updatedTaskData,
        assigneeName: updatedTaskData.assignee?.name || 'Nicht zugewiesen',
        projectName: updatedTaskData.project?.name || 'Kein Projekt',
        comments: updatedTaskData.comments || [],
      }
      
      setTask(task)
      setQuickAssignUserId('')
      toast.success(userId ? 'Aufgabe erfolgreich zugewiesen!' : 'Zuweisung erfolgreich entfernt!')
    } catch (error) {
      console.error('Failed to assign task:', error)
      toast.error('Fehler beim Zuweisen der Aufgabe')
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

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
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

  if (!task) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Fehler</h2>
          <p className="text-red-700">Aufgabe nicht gefunden</p>
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
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground">
              Aufgabe Details und Kommentare
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aufgabe Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Titel</label>
                    <Input
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Beschreibung</label>
                    <Textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="TODO">Zu erledigen</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
                          <SelectItem value="DONE">Erledigt</SelectItem>
                          <SelectItem value="CANCELLED">Abgebrochen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Priorität</label>
                      <Select
                        value={editData.priority}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}
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
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fälligkeitsdatum</label>
                    <Input
                      type="date"
                      value={editData.dueDate}
                      onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Zugewiesen an</label>
                    <Select
                      value={editData.assigneeId || "unassigned"}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, assigneeId: value === "unassigned" ? "" : value }))}
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
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Abteilungen</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="it-department-task"
                          checked={editData.departments.includes('IT')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditData(prev => ({ ...prev, departments: [...prev.departments, 'IT'] }))
                            } else {
                              setEditData(prev => ({ ...prev, departments: prev.departments.filter(d => d !== 'IT') }))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="it-department-task" className="text-sm">IT</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="datenschutz-department-task"
                          checked={editData.departments.includes('DATENSCHUTZ')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditData(prev => ({ ...prev, departments: [...prev.departments, 'DATENSCHUTZ'] }))
                            } else {
                              setEditData(prev => ({ ...prev, departments: prev.departments.filter(d => d !== 'DATENSCHUTZ') }))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="datenschutz-department-task" className="text-sm">Datenschutz</label>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                    <p className="text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Zugewiesen an:</span>
                      <span className="ml-2 font-medium">{task.assigneeName}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Fällig:</span>
                      <span className="ml-2 font-medium">{formatDate(task.dueDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Erstellt:</span>
                      <span className="ml-2 font-medium">{formatDate(task.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Aktualisiert:</span>
                      <span className="ml-2 font-medium">{formatDate(task.updatedAt)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Abteilungen:</span>
                    <div className="mt-2">
                      {getDepartmentBadge(task.departments)}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CheckSquare className="h-5 w-5 mr-2" />
                  Unteraufgaben ({(task as any)._count?.subtasks || 0})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSubtask(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Unteraufgabe hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddSubtask && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-3">Neue Unteraufgabe</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Titel *</label>
                      <Input
                        placeholder="Titel der Unteraufgabe..."
                        value={newSubtask.title}
                        onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Beschreibung</label>
                      <Textarea
                        placeholder="Beschreibung der Unteraufgabe..."
                        value={newSubtask.description}
                        onChange={(e) => setNewSubtask(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Priorität</label>
                        <Select
                          value={newSubtask.priority}
                          onValueChange={(value) => setNewSubtask(prev => ({ ...prev, priority: value }))}
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
                      <div>
                        <label className="text-sm font-medium mb-1 block">Fälligkeitsdatum</label>
                        <Input
                          type="date"
                          value={newSubtask.dueDate}
                          onChange={(e) => setNewSubtask(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddSubtask}
                        disabled={!newSubtask.title.trim()}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Unteraufgabe erstellen
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddSubtask(false)}
                        size="sm"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {subtasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Keine Unteraufgaben vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subtasks.map((subtask) => (
                    <div key={subtask._id} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">{subtask.title}</h4>
                            {getStatusBadge(subtask.status)}
                            {getPriorityBadge(subtask.priority)}
                          </div>
                          {subtask.description && (
                            <p className="text-sm text-muted-foreground mb-2">{subtask.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {subtask.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(subtask.dueDate)}
                              </span>
                            )}
                            {subtask.assignee && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {subtask.assignee.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/portal/tasks/subtasks/${subtask._id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Kommentare ({task.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Kommentar hinzufügen..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  size="sm"
                >
                  {submittingComment ? 'Hinzufügen...' : 'Kommentar hinzufügen'}
                </Button>
              </div>

              {/* Comments List */}
              {task.comments?.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Keine Kommentare vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {task.comments?.map((comment) => (
                    <div key={comment._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.authorName}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projekt Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Projekt:</span>
                  <p className="font-medium">{task.projectName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Aufgaben-ID:</span>
                  <p className="font-mono text-sm">{task._id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zugewiesener Benutzer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{task.assigneeName}</p>
                    <p className="text-sm text-muted-foreground">Zugewiesen</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Schnell zuweisen</label>
                  <div className="space-y-2">
                    <Select
                      value={quickAssignUserId || "unassigned"}
                      onValueChange={(value) => {
                        if (value === "unassigned") {
                          handleQuickAssign("")
                        } else if (value) {
                          handleQuickAssign(value)
                        }
                      }}
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
                    <p className="text-xs text-muted-foreground">
                      Wählen Sie einen Benutzer aus, um die Aufgabe sofort zuzuweisen
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteTask}
        title="Aufgabe löschen"
        description={`Möchten Sie die Aufgabe "${task.title}" wirklich löschen?`}
        entityName={task.title}
        entityType="task"
      />
    </AdminLayout>
  )
}