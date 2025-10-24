import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
// Force dynamic rendering

// Force dynamic rendering
import { z } from 'zod'

// Force dynamic rendering
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections, findUserById } from '@/lib/mongodb'

// Force dynamic rendering
import { ObjectId } from 'mongodb'

// Force dynamic rendering

const updateSubtaskSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
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
    const subtask = await tasksCollection.findOne({ _id: new ObjectId(params.id) })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    // Verify this is actually a subtask
    if (!subtask.parentTaskId) {
      return NextResponse.json({ error: 'This is not a subtask' }, { status: 400 })
    }

    // Populate related data
    const [assignee, project, reporter, parentTask, comments] = await Promise.all([
      subtask.assigneeId ? findUserById(subtask.assigneeId) : null,
      subtask.projectId ? collections.projects().then(col => col.findOne({ _id: new ObjectId(subtask.projectId) })) : null,
      subtask.reporterId ? findUserById(subtask.reporterId) : null,
      collections.tasks().then(col => col.findOne({ _id: new ObjectId(subtask.parentTaskId) })),
      collections.comments().then(col => col.find({ taskId: subtask._id.toString() }).sort({ createdAt: -1 }).toArray()),
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
      ...subtask,
      assignee,
      project,
      reporter,
      parentTask,
      comments: enrichedComments,
      _count: {
        subtasks: 0, // Subtasks don't have their own subtasks
        comments: enrichedComments.length,
      }
    })
  } catch (error) {
    console.error('Error fetching subtask:', error)
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
    const data = updateSubtaskSchema.parse(body)

    const tasksCollection = await collections.tasks()

    // Verify subtask exists and is actually a subtask
    const existingSubtask = await tasksCollection.findOne({ _id: new ObjectId(params.id) })
    if (!existingSubtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }
    if (!existingSubtask.parentTaskId) {
      return NextResponse.json({ error: 'This is not a subtask' }, { status: 400 })
    }

    const updateData = {
      ...data,
      updatedAt: new Date(),
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    const updatedSubtask = await tasksCollection.findOne({ _id: new ObjectId(params.id) })

    // Populate related data for the response
    const [assignee, project, reporter, parentTask] = await Promise.all([
      updatedSubtask?.assigneeId ? findUserById(updatedSubtask.assigneeId) : null,
      updatedSubtask?.projectId ? collections.projects().then(col => col.findOne({ _id: new ObjectId(updatedSubtask.projectId) })) : null,
      updatedSubtask?.reporterId ? findUserById(updatedSubtask.reporterId) : null,
      updatedSubtask?.parentTaskId ? collections.tasks().then(col => col.findOne({ _id: new ObjectId(updatedSubtask.parentTaskId) })) : null,
    ])

    return NextResponse.json({
      ...updatedSubtask,
      assignee,
      project,
      reporter,
      parentTask,
      _count: {
        subtasks: 0,
        comments: updatedSubtask ? await collections.comments().then(col => col.countDocuments({ taskId: updatedSubtask._id.toString() })) : 0,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Error updating subtask:', error)
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
    const subtaskId = new ObjectId(params.id)

    // First, get the subtask data for audit logging
    const tasksCollection = await collections.tasks()
    const subtask = await tasksCollection.findOne({ _id: subtaskId })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    if (!subtask.parentTaskId) {
      return NextResponse.json({ error: 'This is not a subtask' }, { status: 400 })
    }

    // Create audit log entry before deletion
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'DELETE_SUBTASK',
      entityType: 'subtask',
      entityId: subtaskId.toString(),
      userId: user.id,
      userEmail: user.email,
      details: {
        subtaskTitle: subtask.title,
        parentTaskId: subtask.parentTaskId,
        reason: 'GDPR compliant deletion',
        deletedAt: new Date()
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    // Delete related data first
    const deletionResults = await Promise.all([
      // Delete comments
      collections.comments().then(col => col.deleteMany({ taskId: subtaskId.toString() })),
    ])

    // Finally, delete the subtask
    const result = await tasksCollection.deleteOne({ _id: subtaskId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Subtask and all related data deleted successfully (GDPR compliant)',
      deletedCounts: {
        subtask: result.deletedCount,
        comments: deletionResults[0].deletedCount,
      }
    })
  } catch (error) {
    console.error('Error deleting subtask:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
