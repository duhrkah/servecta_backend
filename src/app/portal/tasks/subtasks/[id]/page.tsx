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
import { ArrowLeft, Edit, Save, X, MessageSquare, User, Calendar, Clock, Trash2, CheckSquare, ArrowUp, Trash } from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  _id: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
}

interface Subtask {
  _id: string
  title: string
  description: string
  status: string
  priority: string
  type: string
  dueDate: string
  createdAt: string
  updatedAt: string
  parentTaskId: string
  assigneeId?: string
  assignee?: {
    _id: string
    name: string
    email: string
  }
  projectId?: string
  project?: {
    _id: string
    name: string
    code: string
  }
  reporterId?: string
  reporter?: {
    _id: string
    name: string
    email: string
  }
  parentTask?: {
    _id: string
    title: string
  }
  comments?: Comment[]
  _count?: {
    subtasks: number
    comments: number
  }
}

export default function SubtaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subtask, setSubtask] = useState<Subtask | null>(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: ''
  })
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const fetchSubtask = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/tasks-mongodb/subtasks/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Unteraufgabe nicht gefunden')
            return
          }
          throw new Error('Failed to fetch subtask')
        }
        
        const subtaskData = await response.json()
        
        const subtask: Subtask = {
          ...subtaskData,
          assignee: subtaskData.assignee || null,
          project: subtaskData.project || null,
          reporter: subtaskData.reporter || null,
          parentTask: subtaskData.parentTask || null,
          comments: subtaskData.comments || [],
        }
        
        setSubtask(subtask)
        setEditData({
          title: subtask.title,
          description: subtask.description || '',
          status: subtask.status,
          priority: subtask.priority,
          dueDate: subtask.dueDate || ''
        })
      } catch (error) {
        console.error('Failed to fetch subtask:', error)
        toast.error('Unteraufgabe nicht gefunden')
      } finally {
        setLoading(false)
      }
    }

    fetchSubtask()
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
      const response = await fetch(`/api/v1/tasks-mongodb/subtasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        throw new Error('Failed to update subtask')
      }

      const updatedSubtaskData = await response.json()
      
      const subtask: Subtask = {
        ...updatedSubtaskData,
        assignee: updatedSubtaskData.assignee || null,
        project: updatedSubtaskData.project || null,
        reporter: updatedSubtaskData.reporter || null,
        parentTask: updatedSubtaskData.parentTask || null,
        comments: updatedSubtaskData.comments || [],
      }
      
      setSubtask(subtask)
      setEditing(false)
      toast.success('Unteraufgabe erfolgreich aktualisiert!')
    } catch (error) {
      console.error('Failed to save subtask:', error)
      toast.error('Fehler beim Speichern der Unteraufgabe')
    }
  }

  const handleDeleteSubtask = async () => {
    try {
      const response = await fetch(`/api/v1/tasks-mongodb/subtasks/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Deletion result:', result)
        toast.success('Unteraufgabe erfolgreich gelöscht!')
        // Navigate back to parent task
        if (subtask?.parentTaskId) {
          router.push(`/portal/tasks/${subtask.parentTaskId}`)
        } else {
          router.push('/portal/tasks')
        }
      } else {
        throw new Error('Failed to delete subtask')
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error)
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
      
      setSubtask(prev => prev ? {
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

      setSubtask(prev => prev ? {
        ...prev,
        comments: (prev.comments || []).filter(comment => comment._id !== commentId)
      } : null)
      
      toast.success('Kommentar gelöscht!')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('Fehler beim Löschen des Kommentars')
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

  if (!subtask) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Fehler</h2>
          <p className="text-red-700">Unteraufgabe nicht gefunden</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => subtask.parentTaskId ? router.push(`/portal/tasks/${subtask.parentTaskId}`) : router.push('/portal/tasks')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Hauptaufgabe
          </Button>
          {subtask.parentTask && (
            <Button variant="ghost" asChild>
              <Link href={`/portal/tasks/${subtask.parentTaskId}`}>
                <ArrowUp className="h-4 w-4 mr-2" />
                {subtask.parentTask.title}
              </Link>
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Unteraufgabe
              </Badge>
              <h1 className="text-3xl font-bold">{subtask.title}</h1>
            </div>
            <p className="text-muted-foreground">
              Unteraufgabe Details und Kommentare
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
        {/* Subtask Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unteraufgabe Details</CardTitle>
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
                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Änderungen speichern
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Titel</p>
                    <p className="font-medium">{subtask.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Beschreibung</p>
                    <p className="text-sm">{subtask.description || 'Keine Beschreibung'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(subtask.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Priorität</p>
                      {getPriorityBadge(subtask.priority)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Fälligkeitsdatum</p>
                      <p className="font-medium">{subtask.dueDate ? formatDate(subtask.dueDate) : 'Nicht festgelegt'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Projekt</p>
                      <p className="font-medium">{subtask.project?.name || 'Kein Projekt'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Kommentare ({subtask.comments?.length || 0})
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
              {subtask.comments?.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Keine Kommentare vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subtask.comments?.map((comment) => (
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
              <CardTitle>Unteraufgabe Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Unteraufgabe-ID:</span>
                  <p className="font-mono text-sm">{subtask._id}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Erstellt am:</span>
                  <p className="text-sm">{formatDate(subtask.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Zuletzt aktualisiert:</span>
                  <p className="text-sm">{formatDate(subtask.updatedAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Typ:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {subtask.type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zugewiesener Benutzer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{subtask.assignee?.name || 'Nicht zugewiesen'}</p>
                  <p className="text-sm text-muted-foreground">
                    {subtask.assignee?.email || 'Kein Assignee'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hauptaufgabe</CardTitle>
            </CardHeader>
            <CardContent>
              {subtask.parentTask ? (
                <div className="space-y-2">
                  <p className="font-medium">{subtask.parentTask.title}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/portal/tasks/${subtask.parentTaskId}`}>
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Zur Hauptaufgabe
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Keine Hauptaufgabe gefunden</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteSubtask}
        title="Unteraufgabe löschen"
        description={`Möchten Sie die Unteraufgabe "${subtask.title}" wirklich löschen?`}
        entityName={subtask.title}
        entityType="task"
      />
    </AdminLayout>
  )
}
