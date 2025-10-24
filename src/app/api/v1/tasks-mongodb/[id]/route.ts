import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
import { z } from 'zod'

// Force dynamic rendering
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections, findUserById } from '@/lib/mongodb'

// Force dynamic rendering
import { ObjectId } from 'mongodb'

// Force dynamic rendering

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  projectId: z.string().optional(),
  departments: z.array(z.enum(['IT', 'DATENSCHUTZ'])).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasksCollection = await collections.tasks()
    const task = await tasksCollection.findOne({ _id: new ObjectId(params.id) })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Consumer: Prüfen ob Task zum eigenen Kunden gehört
    if (user.role === 'KUNDE') {
      const customerId = (user as any).customerId
      if (customerId && task.customerId?.toString() !== customerId.toString()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Populate assignee, project, and comments data
    const usersCollection = await collections.staff()
    const projectsCollection = await collections.projects()
    const commentsCollection = await collections.comments()

    const [assignee, project, comments] = await Promise.all([
      task.assigneeId ? findUserById(task.assigneeId) : null,
      task.projectId ? projectsCollection.findOne({ _id: new ObjectId(task.projectId) }) : null,
      commentsCollection.find({ taskId: params.id }).sort({ createdAt: -1 }).toArray(),
    ])

    // Enrich comments with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await findUserById(comment.authorId)
        
        return {
          ...comment,
          authorName: author?.name || 'Unbekannter Benutzer',
          authorEmail: author?.email || '',
        }
      })
    )

    return NextResponse.json({
      ...task,
      assignee,
      project,
      comments: enrichedComments,
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireManagerOrAdmin()
    const body = await request.json()
    const data = updateTaskSchema.parse(body)

    const tasksCollection = await collections.tasks()

    const updateData = {
      ...data,
      updatedAt: new Date(),
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(params.id) })

    // Populate assignee, project, and comments data for the response
    const usersCollection = await collections.staff()
    const projectsCollection = await collections.projects()
    const commentsCollection = await collections.comments()

    const [assignee, project, comments] = await Promise.all([
      updatedTask?.assigneeId ? findUserById(updatedTask.assigneeId) : null,
      updatedTask?.projectId ? projectsCollection.findOne({ _id: new ObjectId(updatedTask.projectId) }) : null,
      commentsCollection.find({ taskId: params.id }).sort({ createdAt: -1 }).toArray(),
    ])

    // Enrich comments with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await findUserById(comment.authorId)
        
        return {
          ...comment,
          authorName: author?.name || 'Unbekannter Benutzer',
          authorEmail: author?.email || '',
        }
      })
    )

    return NextResponse.json({
      ...updatedTask,
      assignee,
      project,
      comments: enrichedComments,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireManagerOrAdmin()
    const taskId = new ObjectId(params.id)

    // First, get the task data for audit logging
    const tasksCollection = await collections.tasks()
    const task = await tasksCollection.findOne({ _id: taskId })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Create audit log entry before deletion
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'DELETE_TASK',
      entityType: 'task',
      entityId: taskId.toString(),
      userId: user.id,
      userEmail: user.email,
      details: {
        taskTitle: task.title,
        reason: 'GDPR compliant deletion',
        deletedAt: new Date()
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    // Delete the task
    const result = await tasksCollection.deleteOne({ _id: taskId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Task deleted successfully (GDPR compliant)',
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
